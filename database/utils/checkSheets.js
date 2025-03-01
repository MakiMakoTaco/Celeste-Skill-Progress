// Import required modules
const { google } = require('googleapis');

// Create Google Sheets API client
const sheetsAPI = google.sheets({
	version: 'v4',
	auth: process.env.GOOGLE_API_KEY,
});

// Define the spreadsheet ID
const spreadsheetId = '1XTAL3kgpX0bG6SBfznPX8z7Qdb7lGnQRuxeUfPZMFoU';

// Define the fields to be fetched from the spreadsheet
const spreadsheetFields =
	'sheets(properties(title,sheetId,index,gridProperties(rowCount,columnCount)),data.rowData.values(formattedValue,effectiveFormat.backgroundColor,note,hyperlink))';

function rgbToHex(color) {
	const { red, green, blue } = color;

	// Scale the RGB values to the 0-255 range
	const r = Math.round(red * 255)
		.toString(16)
		.toUpperCase()
		.padStart(2, '0');
	const g = Math.round(green * 255)
		.toString(16)
		.toUpperCase()
		.padStart(2, '0');
	const b = Math.round(blue * 255)
		.toString(16)
		.toUpperCase()
		.padStart(2, '0');

	// Combine the hexadecimal values
	return `#${r}${g}${b}`;
}

async function getSheetData() {
	try {
		const sheetNames = await sheetsAPI.spreadsheets.get({
			spreadsheetId,
			fields: 'sheets.properties.title',
		});

		console.log('Received sheet titles. Starting processing');

		for (let i = 0; i < sheetNames.data.sheets.length; i++) {
			const sheetName = sheetNames.data.sheets[i].properties.title;

			const fileInfo = await sheetsAPI.spreadsheets.get({
				spreadsheetId,
				ranges: `${sheetName}`,
				fields: spreadsheetFields,
				includeGridData: true,
			});

			await sortData(fileInfo.data.sheets[0]);
		}

		return;
	} catch (error) {
		console.error('Error fetching file:', error.message);
		throw error;
	}
}

let sideMap = new Map();

let tierMap = new Map();
let tierId = 0;

let modMap = new Map();
let modId = 1;

let playerProgress = new Map();

async function sortData(sheetData) {
	const sheetName = sheetData.properties.title;
	console.log(`Processing data for ${sheetName}`);

	let sideId;

	switch (sheetName) {
		case 'A-Side':
			sideId = 1;
			break;
		case 'B-Side':
			sideId = 2;
			break;
		case 'C-Side':
			sideId = 3;
			break;
		case 'D-Side':
			sideId = 4;
			break;
		case 'Catstare':
			sideId = 1000;
			break;
		case 'DLC':
			sideId = 1001;
			break;
		case 'Archived':
			sideId = 1002;
			break;
	}

	let tierName = '';

	const userIndex = [];

	for (let i = 1; i < sheetData.data[0].rowData.length; i++) {
		if (i === 2) {
			continue;
		}

		const rowData = sheetData.data[0].rowData;
		const rowValues = rowData[i].values;
		const modName = rowValues[0]?.formattedValue ?? null;

		if (!modName) continue;
		// modName && modMap.has(modName)

		if (i === 1) {
			for (let index = 1; index < rowValues.length; index++) {
				const playerName = rowValues[index]?.formattedValue;

				const dupeNames = [
					'maskos37' /** Maskos37 */,
					'Hikarirom' /** HikariRom */,
					'Vikram' /** VIkram */,
					'kem' /** Kem */,
					'Sammysam' /** SammySam */,
				];
				// // Below are [side & catstare, dlc]
				// const monitor = ['Monitor', 'monitor' /** catstare name */];
				// const rocketguy2 = ['rocketguy2', 'Rocketguy2'];
				// const evelyncubes = ['evelyncubes', 'EvelynCubes'];
				// const kauan_cpi = ['Kauan_cpi', 'kauan_cpi'];

				const extraNames = [
					'monitor',
					'Rocketguy2',
					'EvelynCubes',
					'kauan_cpi',
				];

				if (playerName) {
					let name = playerName;

					if (dupeNames.includes(playerName)) {
						name = '';
					}

					if (extraNames.includes(playerName)) {
						switch (playerName) {
							case 'monitor':
								name = 'Monitor';
								break;
							case 'Rocketguy2':
								name = 'rocketguy2';
								break;
							case 'EvelynCubes':
								name = 'evelyncubes';
								break;
							case 'kauan_cpi':
								name = 'Kauan_cpi';
								break;
						}
					}

					userIndex.push(name);
				}
			}

			userIndex.forEach((user) => {
				if (user !== '') {
					if (!playerProgress.has(user)) {
						playerProgress.set(user, {
							playerId: playerProgress.size + 1,
							mods: [],
						});
					}
				}
			});

			continue;
		} else if (modName.includes(' Challenges - Clear Any ')) {
			if (sideId === 1000 && (tierId < 100000 || tierId >= 101000)) {
				tierId = 100000;
			} else if (sideId > 1000 && tierId < 101000) {
				tierId = 101000;
			} else {
				++tierId;
			}

			const nameSplit = modName.split(' Challenges - Clear Any ');
			const color = rowData[i + 1].values[0]?.effectiveFormat.backgroundColor;
			const colorPlus = rowValues[0]?.effectiveFormat.backgroundColor;

			tierName = nameSplit[0].trim().toString();

			tierMap.set(tierId, {
				tierName,
				color: JSON.stringify(color) !== '{}' ? rgbToHex(color) : '#000000',
				colorPlus:
					JSON.stringify(colorPlus) !== '{}' ? rgbToHex(colorPlus) : '#000000',
				clearsForRank: nameSplit[1].trim(),
				sideId,
				sideIndex: tierMap.size + 1,
			});

			console.log(`Starting processing for ${tierName} tier`);
			continue;
		} else if (
			modName.includes(
				`${sheetName === 'Catstare' ? 'Catstare' : tierName} Total (Out of `,
			)
		) {
			continue;
		}

		for (let index = 1; index < rowValues.length; index++) {
			const playerName = userIndex[index - 1];

			const player = playerProgress.get(playerName);

			if (player) {
				player.mods.push({
					modId,
					cleared: Boolean(rowValues[index]?.formattedValue),
				});
			}
		}

		// Get mod data
		try {
			await getModData(rowValues[0]);
		} catch (e) {
			if (e === 'No link in cell') {
				console.log(`${e} A-${i}`);
				continue;
			} else {
				console.log(e);
				process.exit();
			}
		}

		modId++;
	}
}

async function getModData(cellData) {
	const link = cellData?.hyperlink;
	const notes = cellData?.notes;

	if (!link) throw new Error('No link in cell');

	const linkSplit = link.replace('//', '/').split('/');

	if (linkSplit[1] !== 'gamebanana.com') {
		console.log(link);
		process.exit();
	}

	const requestOptions = {
		method: 'GET',
		redirect: 'follow',
	};

	if (linkSplit[2] === 'mods') {
		const url = `https://gamebanana.com/apiv11/Mod/${linkSplit[3]}/ProfilePage`;
		const modResult = await fetch(url, requestOptions);

		const resultJson = await modResult.json();

		sortModData(resultJson, notes);
	} else {
		const url = `https://gamebanana.com/apiv11/Collection/${linkSplit[3]}/Items`;
		const collectionResult = await fetch(url, requestOptions);
		const resultJson = await collectionResult.json();

		const parentMap = new Map([modId]);

		resultJson._aRecords.forEach((item) => {
			mod++;
			sortModData(item, null, true, parentMod.id);
		});
	}

	/**
	 * optional all below just incase
	 *
	 * ._tsDateAdded, ._sProfileUrl(Mod Page), ._sName, ._sDownloadUrl(Downloads Page), ._sDescription, ._sText, ._sFeedbackInstructions, ._sVersion, ._aEmbeddedMedia
	 * ._aTags[foreach]: ._sValue
	 * ._aCategory: ._sName
	 * ._aSubmitter: ._sName, ._sProfileUrl, ._sAvatarUrl
	 * ._aPreviewMedia._aImages[foreach]: ._sBaseUrl + ._sFile
	 * ._aRequirements[foreach]: name: [0], link: [1]
	 * ._aFiles[foreach]: ._sFile(Downloaded file name), ._nFilesize, ._sDescription, ._sDownloadUrl
	 * ._aFiles._aModManagerIntegrations[0]: ._sDownloadUrl
	 * ._aCredits[foreach]: ._sGroupName
	 * ._aCredits._aAuthors[foreach]: ._sRole, ._sName, ._sProfileUrl, ._sUrl(external url like youtube)
	 */
}

// change input data after changing above function
function sortModData(modData, notes, isChild = false, parentId = null) {
	let mod = {
		isChild,
		parentId,
		submitterId: null,
		category: null,
		version: null,
		gbPage: null,
		gbDownloadPage: null,
		description: null,
		text: null,
		media: [],
		tags: [],
		feedbackInstructions: null,
		notes,
		createdAt: null,
		// downloadLinks: [],
		// modSubmitter: {
		// 	submitterId: null,
		// 	submitterName: null,
		// 	profileUrl: null,
		// 	avatarUrl: null,
		// },
		// authors: [{}],
	};

	// const submitter = modData._aSubmitter;

	// mod.modSubmitter.submitterName = submitter._sName;
	// mod.modSubmitter.profileUrl = submitter._sProfileUrl;
	// mod.modSubmitter.avatarUrl = submitter._sAvatarUrl;

	mod.category = modData._aCategory._sName;
	mod.version = modData._sVersion;
	mod.gbPage = modData._sProfileUrl;
	mod.gbDownloadPage = modData._sDownloadUrl;
	mod.description = modData._sDescription;
	mod.text = modData._sText;
	mod.createdAt = modData._tsDateAdded;

	mod.media = modData._aEmbeddedMedia ?? [];
	for (let i = 0; i < modData._aPreviewMedia._aImages.length; i++) {
		const images = modData._aPreviewMedia._aImages[i];

		mod.media.push(`${images._sBaseUrl}/${images._sFile}`);
	}

	if (modData._aTags.length > 0) {
		modData._aTags.forEach((tag) => {
			mod.tags.push(tag._sValue);
		});
	}

	if (modData._sFeedbackInstructions) {
		mod.feedbackInstructions = modData._sFeedbackInstructions;
	}

	for (let i = 0; i < modData._aFiles.length; i++) {
		const file = modData._aFiles[i];

		mod.downloadLinks.push({
			modId,
			orderIndex: mod.downloadLinks.length,
			fileName: file._sFile,
			fileSize: file._nFilesize,
			description: file._sDescription,
			manualUrl: file._sDownloadUrl,
			everestUrl: file._aModManagerIntegrations[0]._sDownloadUrl,
		});
	}

	modMap.set(modId, mod);
}

// function createSQLStatements() {}

// /**
//  * Finds the maps and category totals in the spreadsheet.
//  * @param {Object} file - The file information obtained from the spreadsheet.
//  * @param {Object} sheetValues - The fetched sheet values.
//  * @returns {Promise<[Object[], Object[]]>} A promise that resolves to an array containing the map information and category totals.
//  */
// async function findMaps(file, sheetValues) {
// 	const mapInfo = [];
// 	const categoryTotals = [];
// 	const mapCount = [];

// 	const sheets = file.sheets;

// 	if (sheets && sheets.length > 0) {
// 		for (let i = 0; i < sheets.length; i++) {
// 			const sheet = sheets[i];
// 			const rowData = sheet.data[0].rowData;

// 			const sheetName = sheet.properties.title;

// 			let currentCategory = '';

// 			if (rowData) {
// 				const hyperlinksAndNotes = [];

// 				for (let j = 0; j < rowData.length; j++) {
// 					const rowDataArray = rowData[j];

// 					// Access hyperlinks and notes
// 					const valuesArray = rowDataArray.values || [];
// 					const firstValue = valuesArray[0] || {};
// 					const hyperlink = firstValue.hyperlink || null;
// 					const note = firstValue.note || null;

// 					const mapName = sheetValues[i]?.values[0][j] || null;

// 					if (mapName === 'Celeste Custom Maps' || !mapName) {
// 						continue;
// 					} else if (
// 						j <= 2 ||
// 						(mapName &&
// 							mapName.includes(' Challenges - Clear') &&
// 							!mapName.includes('Total')) ||
// 						mapName.includes('Total')
// 					) {
// 						if (j === 2) {
// 							const nameSplit = mapName.split(' ');
// 							const sheetMapCount = nameSplit[nameSplit.length - 1].replace(
// 								')',
// 								'',
// 							);

// 							mapCount.push({ sheetName, mapCount: sheetMapCount });
// 						} else if (
// 							mapName &&
// 							mapName.includes(' Challenges - Clear') &&
// 							!mapName.includes('Total')
// 						) {
// 							currentCategory = mapName.split(' Challenges - Clear')[0].trim();
// 						} else {
// 							categoryTotals.push({
// 								mapName,
// 								sheetName,
// 								category: currentCategory,
// 								rowNumber: j + 1,
// 							});
// 						}
// 					} else {
// 						hyperlinksAndNotes.push({
// 							mapName,
// 							sheetName,
// 							category: currentCategory,
// 							hyperlink,
// 							note,
// 							rowNumber: j + 1,
// 						});
// 					}
// 				}

// 				mapInfo.push(hyperlinksAndNotes);
// 			} else {
// 				console.error('No data found in the specified range.');
// 			}
// 		}
// 	} else {
// 		console.error('No sheets found in the spreadsheet.');
// 	}

// 	return [mapInfo, categoryTotals];
// }

// /**
//  * Fetches the users' data from the spreadsheet.
//  * @param {Object} file - The file information obtained from the spreadsheet.
//  * @param {Object} sheetValues - The fetched sheet values.
//  * @returns {Promise<Object>} A promise that resolves to an object of default user sheet data
//  */
// async function getDefaultUserData(file, sheetValues) {
// 	const sheetOrder = [];

// 	if (!file.sheets || file.sheets.length === 0) {
// 		return null;
// 	}

// 	let defaultSheetData = [];

// 	let totalMods = 0;
// 	let totalModsIncludingArchived = 0;

// 	await Promise.all(
// 		file.sheets.map(async (sheet) => {
// 			const sheetName = sheet.properties.title;
// 			sheetOrder.push(sheetName);

// 			const sheetIndex = sheetOrder.indexOf(sheetName);

// 			const rowCount = sheet.properties.gridProperties.rowCount;

// 			let sheetMapCount = 0;

// 			const mapColumn = sheetValues[sheetIndex]?.values[0] || [];

// 			const challenges = [];
// 			const category = [];
// 			const mapCountForRank = [];
// 			const mapCountForPlusRank = [];

// 			for (let i = 0; i < rowCount; i++) {
// 				const mapName = mapColumn[i];

// 				if (!mapName) continue;

// 				if (
// 					i === 0 ||
// 					i === 1 ||
// 					i === 2 ||
// 					(mapName.includes(' Challenges - Clear') &&
// 						!mapName.includes('Total')) ||
// 					mapName.includes('Total (')
// 				) {
// 					const nameSplit = mapName.split(' ');

// 					if (i === 0 || i === 1) {
// 						continue;
// 					} else if (i === 2) {
// 						sheetMapCount = parseInt(
// 							nameSplit[nameSplit.length - 1].replace(')', '').trim(),
// 						);
// 					} else {
// 						let challengeNumber = nameSplit[nameSplit.length - 1];

// 						if (challengeNumber.includes(')')) {
// 							challengeNumber = challengeNumber.replace(')', '');
// 						}

// 						challengeNumber = parseInt(challengeNumber.trim());

// 						if (
// 							mapName &&
// 							mapName.includes(' Challenges - Clear') &&
// 							!mapName.includes('Total')
// 						) {
// 							category.push({
// 								name: mapName.split(' Challenges - Clear')[0].trim(),
// 								modStats: [],
// 							});
// 							mapCountForRank.push(challengeNumber);
// 						} else {
// 							mapCountForPlusRank.push(challengeNumber);
// 						}
// 					}
// 				} else {
// 					category[category.length - 1].modStats.push({
// 						name: mapName,
// 						cleared: null,
// 						row: i + 1,
// 					});
// 				}
// 			}

// 			for (let i = 0; i < category.length; i++) {
// 				challenges.push({
// 					name: category[i].name,
// 					totalClears: 0,
// 					clearsForRank: mapCountForRank[i],
// 					clearsForPlusRank: mapCountForPlusRank[i],
// 					hasRank: false,
// 					hasPlusRank: false,
// 					modStats: category[i].modStats,
// 				});
// 			}

// 			if (!sheetName.includes('Archived') && !sheetName.includes('DLC')) {
// 				totalMods += sheetMapCount;
// 			}
// 			totalModsIncludingArchived += sheetMapCount;

// 			// Create a default user
// 			defaultSheetData.push({
// 				name: sheetName,
// 				userColumn: null,
// 				totalMods: sheetMapCount,
// 				totalClears: 0,
// 				challenges,
// 			});
// 		}),
// 	);

// 	const defaultUserData = {
// 		username: null,
// 		totalMods,
// 		totalClears: 0,
// 		totalModsIncludingArchived,
// 		totalClearsIncludingArchived: 0,
// 		sheets: defaultSheetData.map((sheet) => sheet),
// 	};

// 	return defaultUserData;
// }

// /**
//  * Fetches the users' data from the spreadsheet.
//  * @param {Object} file - The file information obtained from the spreadsheet.
//  * @param {Object} sheetValues - The fetched sheet values.
//  * @param {Object} defaultData - The default user data.
//  * @returns {Promise<Object[]>} A promise that resolves to an array containing the users' data.
//  */
// async function getUsersData(file, sheetValues, defaultData) {
// 	const sheetOrder = [];

// 	if (!file.sheets || file.sheets.length === 0) {
// 		return null;
// 	}

// 	const usersData = [];

// 	await Promise.all(
// 		file.sheets.map(async (sheet) => {
// 			const sheetName = sheet.properties.title;
// 			sheetOrder.push(sheetName);

// 			const sheetIndex = sheetOrder.indexOf(sheetName);

// 			const rowCount = sheet.properties.gridProperties.rowCount;
// 			const columnCount = sheet.properties.gridProperties.columnCount;

// 			const mapColumnData = sheetValues[sheetIndex]?.values[0] || [];

// 			for (let i = 1; i < columnCount; i++) {
// 				const userColumn = numberLetterConversion.numberToColumn(i + 1);
// 				const username = sheetValues[sheetIndex]?.values[i]?.[1] || null;
// 				const userClearData = sheetValues[sheetIndex]?.values[i] || [];

// 				let totalSheetClears = 0;
// 				const challenges = [];
// 				const modStats = [];

// 				for (let k = 0; k < rowCount; k++) {
// 					const userClear = userClearData[k] == 'Clear!' ? true : false;
// 					const mapName = mapColumnData[k];

// 					if (!mapName) continue;

// 					if (
// 						k !== 0 ||
// 						k !== 1 ||
// 						k !== 2 ||
// 						(!mapName.includes(' Challenges - Clear') &&
// 							mapName.includes('Total')) ||
// 						!mapName.includes('Total (')
// 					) {
// 						if (userClear === true) {
// 							totalSheetClears += 1;
// 						}

// 						modStats.push({
// 							name: mapName,
// 							cleared: userClear,
// 							row: k + 1,
// 						});
// 					}
// 				}

// 				const defaultChallengeData = defaultData.sheets[sheetIndex].challenges;
// 				for (let k = 0; k < defaultChallengeData.length; k++) {
// 					const challengeMods = modStats.filter(
// 						(mod) =>
// 							mod.row >= (defaultChallengeData[k].modStats[0]?.row || 0) &&
// 							mod.row <=
// 								(defaultChallengeData[k].modStats[
// 									defaultChallengeData[k].modStats.length - 1
// 								]?.row || Infinity),
// 					);

// 					const totalClears = challengeMods.filter(
// 						(mod) => mod.cleared === true,
// 					).length;
// 					challenges.push({
// 						name: defaultChallengeData[k].name,
// 						totalClears,
// 						clearsForRank: defaultChallengeData[k].clearsForRank,
// 						clearsForPlusRank: defaultChallengeData[k].clearsForPlusRank,
// 						hasRank: totalClears >= defaultChallengeData[k].clearsForRank,
// 						hasPlusRank:
// 							totalClears === defaultChallengeData[k].clearsForPlusRank,
// 						modStats: challengeMods,
// 					});
// 				}

// 				// Find existing user
// 				let existingUserIndex = usersData.findIndex(
// 					(user) => user.username === username,
// 				);

// 				if (existingUserIndex === -1) {
// 					usersData.push({
// 						username,
// 						roles: [],
// 						totalMods: defaultData.totalMods,
// 						totalClears: 0,
// 						totalModsIncludingArchived: defaultData.totalModsIncludingArchived,
// 						totalClearsIncludingArchived: 0,
// 						sheets: defaultData.sheets.map((sheet) => ({ ...sheet })),
// 					});

// 					existingUserIndex = usersData.length - 1;
// 				}

// 				// Push sheet data to existing user
// 				if (!sheetName.includes('Archived') && !sheetName.includes('DLC')) {
// 					usersData[existingUserIndex].totalClears += totalSheetClears;
// 				}
// 				usersData[existingUserIndex].totalClearsIncludingArchived +=
// 					totalSheetClears;

// 				usersData[existingUserIndex].sheets[sheetIndex] = {
// 					name: sheetName,
// 					userColumn: userColumn,
// 					totalMods: defaultData.sheets[sheetIndex].totalMods,
// 					totalClears: totalSheetClears,
// 					challenges,
// 				};
// 			}
// 		}),
// 	);

// 	return usersData;
// }

// async function checkUserExists(username) {
// 	const file = await getFile();

// 	if (!file[0] || file[0].length === 0) {
// 		return null;
// 	}

// 	const values = await getSheetValues(file[1], 'ROWS');
// 	const sheetOrder = [];

// 	let userExists = false;

// 	await Promise.all(
// 		file[0].sheets.map(async (sheet) => {
// 			const sheetName = sheet.properties.title;
// 			sheetOrder.push(sheetName);

// 			const sheetIndex = sheetOrder.indexOf(sheetName);
// 			const secondRowValues = values[sheetIndex].values[1];

// 			const userColumnIndex = secondRowValues.findIndex(
// 				(value) => value.toLowerCase() === username.toLowerCase(),
// 			);

// 			if (userColumnIndex !== -1) {
// 				userExists = true;
// 				return; // Exit the loop
// 			}
// 		}),
// 	);

// 	if (userExists) {
// 		return true;
// 	}

// 	return null;
// }

// Export the functions
module.exports = {
	getSheetData,
	// sortData,
	// findMaps,
	// getSheetValues,
	// getDefaultUserData,
	// getUsersData,
	// checkUserExists,
};
