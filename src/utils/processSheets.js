const { google } = require('googleapis');
const numLetConverter = require('../utils/numberLetterConversion');

const sheetsAPI = google.sheets({
	version: 'v4',
	auth: process.env.SHEETS_TOKEN,
});

const spreadsheetId = '1XTAL3kgpX0bG6SBfznPX8z7Qdb7lGnQRuxeUfPZMFoU'; // Replace with your actual environment variable

const SPREADSHEET_FIELDS =
	'sheets.properties.title,sheets.properties.gridProperties.rowCount,sheets.properties.gridProperties.columnCount,sheets.data.rowData.values.note,sheets.data.rowData.values.hyperlink';

async function getFile() {
	try {
		const fileInfo = await sheetsAPI.spreadsheets.get({
			spreadsheetId,
			fields: SPREADSHEET_FIELDS,
			includeGridData: true,
		});
		return fileInfo;
	} catch (error) {
		console.error('Error fetching file:', error.message);
		throw error;
	}
}

async function findMaps() {
	const mapInfo = [];
	const categoryTotals = [];
	const mapCount = [];

	const file = await getFile();

	const sheets = file.data.sheets;

	if (sheets && sheets.length > 0) {
		for (let i = 0; i < sheets.length; i++) {
			const sheet = sheets[i];
			const rowData = sheet.data[0].rowData;

			const sheetName = sheet.properties.title;
			const rowCount = sheet.properties.gridProperties.rowCount;

			let currentCategory = '';
			const aColumn = await sheetsAPI.spreadsheets.values.batchGet({
				spreadsheetId,
				ranges: `${sheetName}!A1:A${rowCount}`,
			});

			if (rowData) {
				const hyperlinksAndNotes = [];

				for (let j = 0; j < rowData.length; j++) {
					const rowDataArray = rowData[j];

					// Access hyperlinks and notes
					const valuesArray = rowDataArray.values || [];
					const firstValue = valuesArray[0] || {};
					const hyperlink = firstValue.hyperlink || null;
					const note = firstValue.note || null;

					const mapName =
						aColumn.data.valueRanges[0]?.values[j]?.join(' ') || null;

					if (mapName === 'Celeste Custom Maps') {
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

async function getUserData(username) {
	const file = await getFile();
	const sheets = [];
	const sheetOrder = [];

	if (!file.data.sheets || file.data.sheets.length === 0) {
		return null;
	}

	let userName = username;
	let totalMods = 0;
	let totalClears = 0;
	let userData = {};

	await Promise.all(
		file.data.sheets.map(async (sheet) => {
			const sheetName = sheet.properties.title;
			sheetOrder.push(sheetName); // Push sheetName to maintain order

			const columnCount = sheet.properties.gridProperties.columnCount;
			const rowCount = sheet.properties.gridProperties.rowCount;
			const columnLetter = numLetConverter.numberToColumn(columnCount + 1);

			const secondRow = await sheetsAPI.spreadsheets.values.batchGet({
				spreadsheetId,
				ranges: `${sheetName}!B2:${columnLetter}2`,
			});

			const secondRowValues = secondRow.data.valueRanges[0].values[0];

			const userColumnIndex = secondRowValues.findIndex(
				(value) => value.toLowerCase() === username.toLowerCase(),
			);

			let userColumnData = null;
			if (userColumnIndex !== -1) {
				const userColumnLetter = numLetConverter.numberToColumn(
					userColumnIndex + 2,
				);

				userColumnData = await sheetsAPI.spreadsheets.values.get({
					spreadsheetId,
					range: `${sheetName}!${userColumnLetter}3:${userColumnLetter}${rowCount}`,
				});
			}

			const mapColumnData = await sheetsAPI.spreadsheets.values.get({
				spreadsheetId,
				range: `${sheetName}!A3:A${rowCount}`,
			});

			// Extract relevant information for the user
			const userClearData = userColumnData?.data.values || [];
			const mapData = mapColumnData.data.values;

			let challenges = [];

			let sheetMapCount = '';
			let totalSheetClears = '';

			const category = [];
			const categoryMapsBeaten = [];
			const mapCountForRank = [];
			const mapCountForPlusRank = [];

			for (let k = 0; k < mapData.length; k++) {
				const userClear = userClearData?.[k]?.[0] || null;
				const mapName = mapData[k][0];

				if (
					k === 0 ||
					(mapName.includes(' Challenges - Clear') &&
						!mapName.includes('Total')) ||
					mapName.includes('Total')
				) {
					const nameSplit = mapName.split(' ');

					if (k === 0) {
						sheetMapCount = nameSplit[nameSplit.length - 1]
							.replace(')', '')
							.trim();
						totalSheetClears = userClear || '0';
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
					// Category found, add userClears to the existing category
					category[category.length - 1].modStats.push({
						name: mapName,
						cleared: userClear,
						row: k + 3,
					});
				}
			}

			for (let k = 0; k < category.length; k++) {
				challenges.push({
					name: category[k].name,
					totalClears: parseInt(categoryMapsBeaten[k]),
					clearsForRank: parseInt(mapCountForRank[k]),
					clearsForPlusRank: parseInt(mapCountForPlusRank[k]),
					modStats: category[k].modStats,
				});
			}

			sheetMapCount = parseInt(sheetMapCount);
			totalSheetClears = parseInt(totalSheetClears);

			sheets.push({
				name: sheetName,
				totalMods: sheetMapCount,
				totalClears: totalSheetClears,
				challenges,
			});

			if (sheetName !== 'Archived') {
				// Update totalMods and totalClears
				totalMods += sheetMapCount;
				totalClears += totalSheetClears;
			}
		}),
	);

	if (totalMods > 0) {
		// Reorder sheets based on the original order
		const orderedSheets = sheetOrder.map((sheetName) =>
			sheets.find((sheet) => sheet.name === sheetName),
		);

		userData = {
			username: userName,
			totalMods,
			totalClears,
			sheets: orderedSheets,
		};

		return userData;
	}

	return null;
}

async function checkUserExists(username) {
	const file = await getFile();

	if (!file.data.sheets || file.data.sheets.length === 0) {
		return null;
	}

	let userExists = false;

	await Promise.all(
		file.data.sheets.map(async (sheet) => {
			const sheetName = sheet.properties.title;

			const columnCount = sheet.properties.gridProperties.columnCount;
			const columnLetter = numLetConverter.numberToColumn(columnCount + 1);

			const secondRow = await sheetsAPI.spreadsheets.values.batchGet({
				spreadsheetId,
				ranges: `${sheetName}!B2:${columnLetter}2`,
			});

			const secondRowValues = secondRow.data.valueRanges[0].values[0];

			const userColumnIndex = secondRowValues.findIndex(
				(value) => value.toLowerCase() === username.toLowerCase(),
			);

			if (userColumnIndex !== -1) {
				userExists = true;
				return; // Exit the loop
			}
		}),
	);

	if (userExists) {
		return true;
	}

	return null;
}

module.exports = { findMaps, getUserData, checkUserExists };
