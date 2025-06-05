// Import required modules
const fs = require('fs');
const path = require('path');
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

function formatEpochToSQLDate(epochSeconds) {
	const date = new Date(epochSeconds * 1000);
	const pad = (n) => n.toString().padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
		date.getDate(),
	)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
		date.getSeconds(),
	)}`;
}

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

async function getSheetData(filePath) {
	try {
		const sheetNames = await sheetsAPI.spreadsheets.get({
			spreadsheetId,
			fields: 'sheets.properties.title',
		});

		console.log('Received sheet titles. Starting processing');

		for (let i = 0; i < sheetNames.data.sheets.length; i++) {
			const sheetName = sheetNames.data.sheets[i].properties.title;

			console.log(sheetName);
			if (sheetName !== 'D-Side') continue;

			const fileInfo = await sheetsAPI.spreadsheets.get({
				spreadsheetId,
				ranges: `${sheetName}`,
				fields: spreadsheetFields,
				includeGridData: true,
			});

			await sortData(fileInfo.data.sheets[0]);

			console.log(
				`All data in sheet ${sheetName} processed successfully. Creating SQL statements...`,
			);

			createSQLStatements(filePath);

			tierMap.clear();
			modMap.clear();
			playerProgress.clear();

			return;
		}

		return;
	} catch (error) {
		console.error('Error fetching file:', error.message);
		throw error;
	}
}

const noGBMod = [];

let submitterMap = new Map();

let tierMap = new Map();
let tierId = 0;

let modMap = new Map();
let modId = 1;

let playerProgress = new Map();
let playerId = 1;

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

				if (playerName) {
					userIndex.push(playerName);
				}
			}

			userIndex.forEach((username) => {
				if (username !== '') {
					if (!playerProgress.has(username)) {
						playerProgress.set(username, {
							playerId: playerId++,
							mods: [],
						});
					}
				}
			});

			continue;
		} else if (modName.includes(' Challenges - Clear Any ')) {
			const nameSplit = modName.split(' Challenges - Clear Any ');
			const color = rowData[i + 1].values[0]?.effectiveFormat.backgroundColor;
			const colorPlus = rowValues[0]?.effectiveFormat.backgroundColor;

			tierName = nameSplit[0].trim().toString();

			if (sheetName === 'DLC' || sheetName === 'Archived') {
				switch (tierName) {
					case 'DLC 1':
						tierId = 101000;
						break;
					case 'DLC 2':
						tierId = 101001;
						break;
					case 'DLC 3':
						tierId = 101002;
						break;
					case 'DLC 4':
						tierId = 101003;
						break;
					case 'DLC 5':
						tierId = 101004;
						break;
					case 'DLC 6':
						tierId = 101005;
						break;
					case 'DLC 7':
						tierId = 101006;
						break;
					case 'DLC 8':
						tierId = 101007;
						break;
					case 'DLC 9':
						tierId = 101008;
						break;
					case 'DLC 10':
						tierId = 101009;
						break;
					case 'DLC 11':
						tierId = 101010;
						break;
					case 'DLC 12':
						tierId = 101011;
						break;
				}
			} else if (sideId === 1000 && (tierId < 100000 || tierId >= 101000)) {
				tierId = 100000;
			} else {
				++tierId;
			}

			tierMap.set(tierId, {
				name: tierName,
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
			return;
			// continue;
		}

		for (let index = 1; index < rowValues.length; index++) {
			const playerName = userIndex[index - 1];
			const cleared = Boolean(rowValues[index]?.formattedValue);

			if (!playerName) continue;

			const player = playerProgress.get(playerName);

			if (player && cleared) {
				player.mods.push({
					modId,
					cleared: Boolean(rowValues[index]?.formattedValue),
					proof: rowValues[index]?.hyperlink ?? null,
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
			}
		}
	}

	// console.log(`${noGBMod.length} mods without GameBanana link found.`);
	// if (noGBMod.length > 0) {
	// 	console.log('Mods without GameBanana link:');

	// 	noGBMod.forEach((mod) => {
	// 		console.log(
	// 			`Mod ID: ${mod.modId}, Name: ${
	// 				mod.name
	// 			}, Download Links: ${mod.downloadLinks.join(', ')}`,
	// 		);
	// 	});
	// }
	// return;
}

async function getModData(cellData) {
	const name = cellData?.formattedValue.replaceAll("'", "\\'");
	const link = cellData?.hyperlink;
	const notes = cellData?.note?.replaceAll("'", "\\'") ?? null;

	if (!link) {
		modMap.set(modId, {
			tierId,
			name,
			notes,
			downloadLinks: [],
		});

		noGBMod.push({
			tierId,
			modId,
			name,
			downloadLinks: [],
		});

		modId++;
		return;
	}

	const linkSplit = link?.replace('//', '/').split('/');

	if (!link || linkSplit[1] !== 'gamebanana.com') {
		modMap.set(modId, {
			tierId,
			name,
			gbName: null,
			isChild: false,
			parentId: null,
			submitterId: null,
			category: null,
			version: null,
			gbPage: null,
			gbDownloadPage: null,
			description: null,
			text: null,
			media: null,
			tags: null,
			feedbackInstructions: null,
			notes,
			createdAt: null,
			downloadLinks: null,
			// authors: [{}],
		});

		noGBMod.push({
			tierId,
			modId,
			name,
			downloadLinks: [link],
		});

		modId++;
		return;
	}

	const requestOptions = {
		method: 'GET',
		redirect: 'follow',
	};

	const parentId = modId;
	const modIds = [];

	if (linkSplit[2] === 'mods') {
		modIds.push(linkSplit[3]);
	} else {
		let page = 0;
		let hasNextPage = true;

		const profileUrl = `https://gamebanana.com/apiv11/Collection/${linkSplit[3]}/ProfilePage`;
		const profileResult = await fetch(profileUrl, requestOptions);
		const profileJson = await profileResult.json();

		sortModData(profileJson, name, notes, false, null, true);

		// modMap.set(modId, {
		// 	tierId,
		// 	name,
		// 	gbName: profileJson._sName.replaceAll("'", "\\'"),
		// 	notes,
		// 	gbPage: profileJson._sProfileUrl,
		// 	createdAt: profileJson._tsDateAdded,
		// });
		modId++;

		while (hasNextPage) {
			page++;

			console.log(`Fetching page ${page} for collection ${linkSplit[3]}`);

			const url = `https://gamebanana.com/apiv11/Collection/${linkSplit[3]}/Items?_nPage=${page}`;
			const collectionResult = await fetch(url, requestOptions);
			const resultJson = await collectionResult.json();

			resultJson._aRecords.forEach((item) => {
				if (item._sModelName !== 'Mod') {
					console.log(
						`Skipping item with model name: ${item._sModelName}. Name of item: ${item._sName}`,
					);
				} else {
					modIds.push(item._sProfileUrl.replace('//', '/').split('/')[3]);
				}
			});

			hasNextPage = !resultJson._aMetadata._bIsComplete;
		}
	}

	const modIdLength = modIds.length;

	for (let i = 0; i < modIds.length; i++) {
		const id = modIds[i];

		const url = `https://gamebanana.com/apiv11/Mod/${id}/ProfilePage`;
		const modResult = await fetch(url, requestOptions);

		const resultJson = await modResult.json();

		sortModData(
			resultJson,
			name,
			modIdLength === 1 ? cellData?.notes : null,
			modIdLength > 1,
			modIdLength > 1 ? parentId : null,
		);

		modId++;
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
function sortModData(
	modData,
	name,
	notes,
	isChild = false,
	parentId = null,
	isParent = false,
) {
	let mod = {
		tierId,
		name: isChild ? null : name,
		gbName: null,
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
		downloadLinks: [],
		// authors: [{}],
	};

	const submitter = modData._aSubmitter;
	const submitterExists = submitterMap.has(submitter._sName);

	if (!submitterExists) {
		submitterMap.set(submitter._sName, {
			submitterId: submitterMap.size + 1,
			profileUrl: submitter._sProfileUrl,
			avatarUrl: submitter._sAvatarUrl,
		});
	}

	mod.gbName = modData._sName.replaceAll("'", "\\'");
	mod.submitterId = submitterMap.get(submitter._sName).submitterId;
	mod.category = modData?._aCategory?._sName.replaceAll("'", "\\'") ?? null;
	mod.version = modData._sVersion;
	mod.gbPage = modData._sProfileUrl;
	mod.gbDownloadPage = modData?._sDownloadUrl ?? null;
	mod.description = modData._sDescription?.replaceAll("'", "\\'") ?? null;
	mod.text = modData._sText?.replaceAll("'", "\\'") ?? null;
	mod.createdAt = modData._tsDateAdded
		? formatEpochToSQLDate(modData._tsDateAdded)
		: null;

	if (!isParent) {
		mod.media = modData._aEmbeddedMedia ?? [];
		for (let i = 0; i < modData._aPreviewMedia._aImages.length; i++) {
			const images = modData._aPreviewMedia._aImages[i];

			mod.media.push(`${images._sBaseUrl}/${images._sFile}`);
		}
		if (mod.media.length === 0) mod.media = null;
	}

	if (modData._aTags.length > 0) {
		modData._aTags.forEach((tag) => {
			mod.tags.push(tag._sValue.replaceAll("'", "\\'"));
		});
	}
	if (mod.tags.length === 0) mod.tags = null;

	if (modData._sFeedbackInstructions) {
		mod.feedbackInstructions =
			modData._sFeedbackInstructions.replaceAll("'", "\\'") ?? null;
	}

	if (modData._aFiles && modData._aFiles.length > 0) {
		for (let i = 0; i < modData._aFiles.length; i++) {
			const file = modData._aFiles[i];

			mod.downloadLinks.push({
				orderIndex: mod.downloadLinks.length,
				fileName: file._sFile,
				fileSize: file._nFilesize,
				description: file._sDescription,
				manualUrl: file._sDownloadUrl,
				everestUrl: file._aModManagerIntegrations?.[0]._sDownloadUrl,
			});
		}
	}

	modMap.set(modId, mod);
}

function createSQLStatements(filePath = path.join(__dirname, '../sqlFiles')) {
	if (noGBMod.length > 0) {
		noGBMod.forEach((mod) => {
			fs.appendFileSync(
				path.join(filePath, 'no_gb_mods.txt'),
				`Tier ID: ${mod.tierId}, Mod ID: ${mod.modId}, Name: ${
					mod.name
				}, Download Links: ${mod.downloadLinks.join(', ')}\n`,
			);
		});
	}

	tierMap.forEach((tier, tierId) => {
		fs.appendFileSync(
			path.join(filePath, 'tiers.sql'),
			`,\n(${tierId}, '${tier.name}', '${tier.color}', '${tier.colorPlus}', ${tier.clearsForRank}, ${tier.sideId}, ${tier.sideIndex})`,
		);
	});

	modMap.forEach((mod, modId) => {
		fs.appendFileSync(
			path.join(filePath, 'mod_tiers.sql'),
			`,\n(${modId}, ${mod.tierId})`,
		);

		// Simplified mods.sql insert with additional fields, using null for empty values and quoting literals
		fs.appendFileSync(
			path.join(filePath, 'mods.sql'),
			`,\n(${modId}, ${mod.name ? `'${mod.name}'` : null}, ${
				mod.gbName ? `'${mod.gbName}'` : null
			}, ${mod.isChild ? 1 : 0}, ${
				mod.parentId !== null ? mod.parentId : null
			}, ${mod.submitterId !== null ? mod.submitterId : null}, ${
				mod.category ? `'${mod.category}'` : null
			}, ${mod.version ? `'${mod.version}'` : null}, ${
				mod.gbPage ? `'${mod.gbPage}'` : null
			}, ${mod.gbDownloadPage ? `'${mod.gbDownloadPage}'` : null}, ${
				mod.description ? `'${mod.description}'` : null
			}, ${mod.text ? `'${mod.text}'` : null}, ${
				Array.isArray(mod.media) && mod.media.length
					? `'${mod.media.join(' ')}'`
					: null
			}, ${
				Array.isArray(mod.tags) && mod.tags.length
					? `'${mod.tags.join(', ')}'`
					: null
			}, ${
				mod.feedbackInstructions ? `'${mod.feedbackInstructions}'` : null
			}, ${mod.notes ? `'${mod.notes}'` : null}, ${
				mod.createdAt ? `'${mod.createdAt}'` : null
			})`,
		);

		// Write download links for this mod
		if (Array.isArray(mod.downloadLinks)) {
			if (mod.downloadLinks.length > 0) {
				mod.downloadLinks.forEach((link) => {
					fs.appendFileSync(
						path.join(filePath, 'download_links.sql'),
						`,\n(${modId}, ${link.orderIndex}, ${
							link.fileName ? `'${link.fileName}'` : null
						}, ${
							link.fileSize !== null && link.fileSize !== undefined
								? link.fileSize
								: null
						}, ${link.description ? `'${link.description}'` : null}, '${
							link.manualUrl
						}', ${link.everestUrl ? `'${link.everestUrl}'` : null})`,
					);
				});
			}
		}
	});

	submitterMap.forEach((submitter, submitterName) => {
		fs.appendFileSync(
			path.join(filePath, 'mod_submitter.sql'),
			`,\n(${submitter.submitterId}, '${submitterName}', '${submitter.profileUrl}', '${submitter.avatarUrl}')`,
		);
	});

	playerProgress.forEach((player, playerName) => {
		fs.appendFileSync(
			path.join(filePath, 'players.sql'),
			`,\n(${player.playerId}, '${playerName}')`,
		);

		if (player.mods && player.mods.length > 0) {
			player.mods.forEach((mod) => {
				fs.appendFileSync(
					path.join(filePath, 'player_progress.sql'),
					`,\n(${player.playerId}, ${mod.modId}, ${mod.cleared ? 1 : 0}, '${
						mod.proof
					}', null)`,
				);
			});
		}
	});
}

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
