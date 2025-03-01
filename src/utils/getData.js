const { google } = require('googleapis');

let sideMap = new Map();

let tierMap = new Map();

let modMap = new Map();

let defaultPlayerProgress = new Set();
let playerProgress = new Map();

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

// function rgbToHex(color) {
// 	const { red, green, blue } = color;

// 	// Scale the RGB values to the 0-255 range
// 	const r = Math.round(red * 255)
// 		.toString(16)
// 		.toUpperCase()
// 		.padStart(2, '0');
// 	const g = Math.round(green * 255)
// 		.toString(16)
// 		.toUpperCase()
// 		.padStart(2, '0');
// 	const b = Math.round(blue * 255)
// 		.toString(16)
// 		.toUpperCase()
// 		.padStart(2, '0');

// 	// Combine the hexadecimal values
// 	return `#${r}${g}${b}`;
// }

async function getSheetData() {
	try {
		const sheetNames = await sheetsAPI.spreadsheets.get({
			spreadsheetId,
			fields: 'sheets.properties.title',
		});

		console.log('Received sheet titles. Starting processing');

		for (let i = 0; i < sheetNames.data.sheets.length; i++) {
			const sheetName = sheetNames.data.sheets[i].properties.title;

			const fileInfo = await sheetsAPI.spreadsheets.values.batchGet({
				spreadsheetId,
				majorDimension: 'COLUMNS',
				ranges: [`{sheetName}!A:A`, `{sheetName}!2:3`],
			});

			await checkChanges(fileInfo.data.valueRanges[0]);
		}

		// for (let i = 0; i < sheetNames.data.sheets.length; i++) {
		// 	const sheetName = sheetNames.data.sheets[i].properties.title;

		// 	const fileInfo = await sheetsAPI.spreadsheets.get({
		// 		spreadsheetId,
		// 		ranges: `${sheetName}`,
		// 		fields: spreadsheetFields,
		// 		includeGridData: true,
		// 	});

		// 	await sortData(fileInfo.data.sheets[0]);
		// }

		return;
	} catch (error) {
		console.error('Error fetching file:', error.message);
		throw error;
	}
}

async function sortData(sheetData) {
	const sheetName = sheetData.properties.title;
	console.log(`Processing data for ${sheetName}`);

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

			defaultPlayerProgress.add(null, {
				totalClears: 0,
				sheets: [],
			});

			userIndex.forEach((user) => {
				if (user !== '') {
					if (!playerProgress.has(user)) {
						playerProgress.set(user, {
							totalClears: 0,
							sheets: [],
						});
					} else {
						const player = playerProgress.get(user);

						player;
					}
				}
			});

			continue;
		} else if (modName.includes(' Challenges - Clear Any ')) {
			const nameSplit = modName.split(' Challenges - Clear Any ');
			// const color = rowData[i + 1].values[0]?.effectiveFormat.backgroundColor;
			// const colorPlus = rowValues[0]?.effectiveFormat.backgroundColor;

			tierName = nameSplit[0].trim().toString();

			// defaultPlayerProgress

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

		// // Get mod data
		// try {
		// 	await getModData(rowValues[0]);
		// } catch (e) {
		// 	if (e === 'No link in cell') {
		// 		console.log(`${e} A-${i}`);
		// 		continue;
		// 	} else {
		// 		console.log(e);
		// 		process.exit();
		// 	}
		// }

		// modId++;
	}
}
