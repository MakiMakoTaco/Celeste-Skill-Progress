// Import required modules
const numberLetterConversion = require('../../src/utils/numberLetterConversion');
const { google } = require('googleapis');

// Create Google Sheets API client
const sheetsAPI = google.sheets({
	version: 'v4',
	auth: process.env.SHEETS_TOKEN,
});

// Define the spreadsheet ID
const spreadsheetId = '1XTAL3kgpX0bG6SBfznPX8z7Qdb7lGnQRuxeUfPZMFoU';

// Define the fields to be fetched from the spreadsheet
const SPREADSHEET_FIELDS =
	'sheets.properties.title,sheets.properties.gridProperties.rowCount,sheets.properties.gridProperties.columnCount,sheets.data.rowData.values.note,sheets.data.rowData.values.hyperlink';

/**
 * Fetches the file information and sheet titles from the spreadsheet.
 * @returns {Promise<[Object, string[]]>} A promise that resolves to an array containing the file information and sheet titles.
 */
async function getFile() {
	try {
		const fileInfo = await sheetsAPI.spreadsheets.get({
			spreadsheetId,
			fields: SPREADSHEET_FIELDS,
			includeGridData: true,
		});

		const sheets = fileInfo.data.sheets;
		const sheetTitles = sheets.map((sheet) => sheet.properties.title);

		return [fileInfo, sheetTitles];
	} catch (error) {
		console.error('Error fetching file:', error.message);
		throw error;
	}
}

/**
 * Fetches the values of the specified sheets from the spreadsheet.
 * @param {string[]} sheetNames - An array of sheet names to fetch values from.
 * @returns {Promise<Object>} A promise that resolves to the fetched sheet values.
 */
async function getSheetValues(sheetNames = []) {
	try {
		const result = await sheetsAPI.spreadsheets.values.batchGet({
			spreadsheetId,
			ranges: sheetNames,
			majorDimension: 'COLUMNS',
		});
		return result;
	} catch (error) {
		console.error('Error fetching sheet names:', error.message);
		throw error;
	}
}

/**
 * Finds the maps and category totals in the spreadsheet.
 * @param {Object} file - The file information obtained from the spreadsheet.
 * @param {Object} sheetValues - The fetched sheet values.
 * @returns {Promise<[Object[], Object[]]>} A promise that resolves to an array containing the map information and category totals.
 */
async function findMaps(file, sheetValues) {
	const mapInfo = [];
	const categoryTotals = [];
	const mapCount = [];

	const sheets = file.data.sheets;

	if (sheets && sheets.length > 0) {
		for (let i = 0; i < sheets.length; i++) {
			const sheet = sheets[i];
			const rowData = sheet.data[0].rowData;

			const sheetName = sheet.properties.title;

			let currentCategory = '';

			if (rowData) {
				const hyperlinksAndNotes = [];

				for (let j = 0; j < rowData.length; j++) {
					const rowDataArray = rowData[j];

					// Access hyperlinks and notes
					const valuesArray = rowDataArray.values || [];
					const firstValue = valuesArray[0] || {};
					const hyperlink = firstValue.hyperlink || null;
					const note = firstValue.note || null;

					const mapName = sheetValues.data.valueRanges[0]?.values[0][j] || null;

					if (mapName === 'Celeste Custom Maps' || !mapName) {
						continue;
					} else if (
						j <= 2 ||
						(mapName &&
							mapName.includes(' Challenges - Clear') &&
							!mapName.includes('Total')) ||
						mapName.includes('Total')
					) {
						if (j === 2) {
							const nameSplit = mapName.split(' ');
							const sheetMapCount = nameSplit[nameSplit.length - 1].replace(
								')',
								'',
							);

							mapCount.push({ sheetName, mapCount: sheetMapCount });
						} else if (
							mapName &&
							mapName.includes(' Challenges - Clear') &&
							!mapName.includes('Total')
						) {
							currentCategory = mapName.split(' Challenges - Clear')[0].trim();
						} else {
							categoryTotals.push({
								mapName,
								sheetName,
								category: currentCategory,
								rowNumber: j + 1,
							});
						}
					} else {
						hyperlinksAndNotes.push({
							mapName,
							sheetName,
							category: currentCategory,
							hyperlink,
							note,
							rowNumber: j + 1,
						});
					}
				}

				mapInfo.push(hyperlinksAndNotes);
			} else {
				console.log('No data found in the specified range.');
			}
		}
	} else {
		console.log('No sheets found in the spreadsheet.');
	}

	return [mapInfo, categoryTotals];
}

/**
 * Fetches the users' data from the spreadsheet.
 * @param {Object} file - The file information obtained from the spreadsheet.
 * @param {Object} sheetValues - The fetched sheet values.
 * @returns {Promise<Object[]>} A promise that resolves to an array containing the users' data.
 */
async function getUsersData(file, sheetValues) {
	console.log('File:', file);
	console.log('Sheet values:', sheetValues);

	const sheetOrder = [];

	if (!file.data.sheets || file.data.sheets.length === 0) {
		return null;
	}

	let defualtData = {};

	let totalMods = 0;
	let totalClears = 0;

	let usersData = [];

	await Promise.all(
		file.data.sheets.map(async (sheet) => {
			const sheetName = sheet.properties.title;
			sheetOrder.push(sheetName);

			const sheetIndex = sheetOrder.indexOf(sheetName);

			const rowCount = sheet.properties.gridProperties.rowCount;
			const columnCount = sheet.properties.gridProperties.columnCount;

			let sheetMapCount;
			let totalSheetClears;

			const mapColumnData =
				sheetValues.data.valueRanges[sheetIndex]?.values[0] || [];

			for (let i = 1; i < columnCount; i++) {
				const userColumn = numberLetterConversion.numberToColumn(i + 1);
				const username =
					sheetValues.data.valueRanges[sheetIndex]?.values[i]?.[1] || null;

				const userClearData =
					sheetValues.data.valueRanges[sheetIndex]?.values[i] || [];

				const challengesForUser = [];
				const category = [];
				const categoryMapsBeaten = [];
				const mapCountForRank = [];
				const mapCountForPlusRank = [];

				for (let k = 0; k < rowCount; k++) {
					const userClear = userClearData[k] || null;
					const mapName = mapColumnData[k];

					if (!mapName) continue;

					if (
						k === 0 ||
						k === 1 ||
						k === 2 ||
						(mapName.includes(' Challenges - Clear') &&
							!mapName.includes('Total')) ||
						mapName.includes('Total')
					) {
						const nameSplit = mapName.split(' ');

						if (k === 0 || k === 1) {
							continue;
						} else if (k === 2) {
							sheetMapCount = parseInt(
								nameSplit[nameSplit.length - 1].replace(')', '').trim(),
							);
							totalSheetClears = parseInt(userClear) || 0;
						} else {
							let challengeNumber = nameSplit[nameSplit.length - 1];

							if (challengeNumber.includes(')')) {
								challengeNumber = challengeNumber.replace(')', '');
							}

							challengeNumber = challengeNumber.trim();

							if (
								mapName &&
								mapName.includes(' Challenges - Clear') &&
								!mapName.includes('Total')
							) {
								category.push({
									name: mapName.split(' Challenges - Clear')[0].trim(),
									modStats: [],
								});
								mapCountForRank.push(challengeNumber);
							} else {
								mapCountForPlusRank.push(challengeNumber);
								categoryMapsBeaten.push(userClear || '0');
							}
						}
					} else {
						category[category.length - 1].modStats.push({
							name: mapName,
							cleared: userClear,
							row: k + 1,
						});
					}
				}

				for (let k = 0; k < category.length; k++) {
					challengesForUser.push({
						name: category[k].name,
						totalClears: parseInt(categoryMapsBeaten[k]),
						clearsForRank: parseInt(mapCountForRank[k]),
						clearsForPlusRank: parseInt(mapCountForPlusRank[k]),
						modStats: category[k].modStats,
					});
				}

				// Find existing user
				const existingUserIndex = usersData.findIndex(
					(user) => user.username === username,
				);

				if (existingUserIndex !== -1) {
					// Push sheet data to existing user
					usersData[existingUserIndex].totalMods += sheetMapCount;
					usersData[existingUserIndex].totalClears += totalSheetClears;

					usersData[existingUserIndex].sheets.push({
						name: sheetName,
						userColumn,
						totalMods: sheetMapCount,
						totalClears: totalSheetClears,
						challenges: challengesForUser,
					});
				} else {
					// Create a new user
					usersData.push({
						username,
						totalMods: sheetMapCount,
						totalClears: totalSheetClears,
						sheets: [
							{
								name: sheetName,
								userColumn,
								totalMods: sheetMapCount,
								totalClears: totalSheetClears,
								challenges: challengesForUser,
							},
						],
					});
				}
			}
		}),
	);

	return usersData;
}

// Export the functions
module.exports = { getFile, getSheetValues, findMaps, getUsersData };
