const { google } = require('googleapis');
// const User = require('../schemas/UserStats');
const Sides = require('../schemas/Sides');
const Tiers = require('../schemas/Tiers');
const Players = require('../schemas/Players');

let sideMap = new Map();

let tierMap = new Map();

let modMap = new Map();

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

		const sides = await Sides.find();
		const sideNames = sides.map((side) => side.name);

		const players = await Players.find();
		// console.log(sides);
		// process.exit();

		const changes = {
			sides: [],
			tiers: [],
			players: [],
		};
		// const newSides = [];
		// const newTiers = [];
		// const changes = [];

		for (let i = 0; i < sheetNames.data.sheets.length; i++) {
			const sheetName = sheetNames.data.sheets[i].properties.title;

			if (!sideNames.includes(sheetName)) {
				// New side
				console.log(`Sheet ${sheetName} is new`);
				// changes.sides.push(sheetName);
				// continue;

				const sheetInfo = await sheetsAPI.spreadsheets.get({
					spreadsheetId,
					ranges: `${sheetName}`,
					fields: spreadsheetFields,
					includeGridData: true,
				});

				await sortData(sheetInfo.data.sheets[0], i + 1);
			} else {
				const currentSide = sides.find((side) => side.name === sheetName);

				if (currentSide) {
					const tiers = await Tiers.find(
						{ 'side.id': currentSide._id },
						'name',
					);
					const tierNames = tiers.map((tier) => tier.name);

					console.log(`Tier names for side ${sheetName}:`, tierNames);
				} else {
					console.log(`No side found with name ${sheetName}`);
				}

				const sheetMinData = await sheetsAPI.spreadsheets.values.batchGet({
					spreadsheetId,
					majorDimension: 'COLUMNS',
					ranges: [`${sheetName}!A:A`, `${sheetName}!2:3`],
				});

				changes.players.push(
					await checkChanges(sheetMinData.data.valueRanges, players),
				);

				await getPlayerData(changes.players, sheetName);
			}
		}

		return;
	} catch (error) {
		console.error('Error fetching file:', error.message);
		throw error;
	}
}

async function checkChanges(values, players) {
	// const modValues = values[0].values;
	const playerValues = values[1].values;

	// let modChanges = [];
	const playerChanges = [];

	playerValues.forEach((player) => {
		if (player && player[0] !== 'Celeste Custom Maps') {
			const playerData = players.find((p) => p.name === player[0]) ?? null;

			if (!playerData || playerData.clearedMods.length !== player[1]) {
				// Player is new or has a different number of clears
				playerChanges.push([player[0], playerValues.indexOf(player)]);
			}
		}
	});

	return playerChanges;

	// const sideMap = getModData(sheetName, modValues);

	// let newMods = [];
	// let removedMods = [];
	// let updatedMods = [];

	// for (const [tierName, mods] of sideMap) {
	// 	const firstUserTier =
	// 		firstUserSide.find((tier) => tier.name === tierName) ?? null;
	// 	if (!firstUserTier) {
	// 		// Entire tier is new
	// 		continue;
	// 	} else {
	// 		if (sheetName !== 'Archived') {
	// 			const firstUserMods = firstUserTier.modStats.map((mod) => mod.name);

	// 			newMods.push(mods.filter((mod) => !firstUserMods.includes(mod)));
	// 			removedMods.push(firstUserMods.filter((mod) => !mods.includes(mod)));
	// 		}
	// 	}
	// }

	// if (newMods.length > 0 && removedMods.length > 0) {
	// 	const newModsFlat = newMods.flat();
	// 	const removedModsFlat = removedMods.flat();

	// 	const newModsCompare = newModsFlat.map((mod) =>
	// 		mod.toLowerCase().split(' (')[0].trim(),
	// 	);
	// 	const removedModsCompare = removedModsFlat.map((mod) =>
	// 		mod.toLowerCase().split(' (')[0].trim(),
	// 	);

	// 	for (let i = 0; i < removedModsCompare.length; i++) {
	// 		updatedMods.push(
	// 			newModsCompare.filter((mod) => removedModsCompare[i].includes(mod)),
	// 		);
	// 	}
	// }
}

async function getPlayerData(players, sheetName) {
	const playerNames = players[0].map((player) => player[0]);
	const playerColumns = players[0].map((player) => player[1]);

	const ranges = players[0].map((player) => {
		return `${sheetName}!${player[1]}:${player[1]}`;
	});

	const errorChannel = await client.channels.fetch('1225142448737620124');

	if (ranges.length < 250) {
		try {
			const playerData = await sheetsAPI.spreadsheets.get({
				spreadsheetId,
				fields: spreadsheetFields,
				includeGridData: true,
				ranges,
			});
		} catch (e) {
			await errorChannel.send(e.message);
			console.log(e);
		}
	} else {
		await errorChannel.send('Too many players to fetch data for at once.');
	}
}

function getModData(sheetName, modValues) {
	let tierName = '';
	let sideMap = new Map();

	for (let i = 3; i < modValues[0].length; i++) {
		const modName = modValues[0][i] ?? null;

		if (!modName) continue;

		if (modName.includes(' Challenges - Clear Any ')) {
			const nameSplit = modName.split(' Challenges - Clear Any ');
			// const color = rowData[i + 1].values[0]?.effectiveFormat.backgroundColor;
			// const colorPlus = rowValues[0]?.effectiveFormat.backgroundColor;

			tierName = nameSplit[0].trim().toString();
			sideMap.set(tierName, []);

			continue;
		} else if (
			tierName !== '' &&
			!modName.includes(
				`${sheetName === 'Catstare' ? 'Catstare' : tierName} Total (Out of `,
			)
		) {
			sideMap.get(tierName).push(modName);
		}
	}

	return sideMap;
}

async function sortData(sheetData, sheetOrder) {
	const sheetName = sheetData.properties.title;
	console.log(`Processing data for ${sheetName}`);

	sideMap.set(sheetName, { position: sheetOrder, tiers: [] });

	let tierName = '';
	const userIndex = [];

	const rowData = sheetData.data[0].rowData;

	for (let i = 1; i < rowData.length; i++) {
		if (i === 2) continue;

		const rowValues = rowData[i].values;
		const modName = rowValues[0]?.formattedValue ?? null;

		if (!modName) continue;

		if (i === 1) {
			// Populate userIndex and initialize playerProgress
			for (let index = 1; index < rowValues.length; index++) {
				const playerName = rowValues[index]?.formattedValue;
				if (playerName) {
					userIndex.push(playerName);
					playerProgress.set(playerName, { clearedMods: [] });
				}
			}
			continue;
		}

		if (modName.includes(' Challenges - Clear Any ')) {
			// Start a new tier
			const nameSplit = modName.split(' Challenges - Clear Any ');

			tierName = nameSplit[0].trim();
			const side = sideMap.get(sheetName);

			side.tiers.push({
				name: tierName,
				position: side.tiers.length + 1,
				quickInstaller: rowValues[0]?.hyperlink,
				mods: [],
			});

			console.log(`Starting processing for ${tierName} tier`);
			continue;
		}

		if (
			modName.includes(
				`${sheetName === 'Catstare' ? 'Catstare' : tierName} Total (Out of `,
			)
		) {
			// Skip total rows
			continue;
		}

		// Add mod to the current tier
		const side = sideMap.get(sheetName);
		const currentTier = side.tiers.find((tier) => tier.tierName === tierName);

		if (currentTier) {
			currentTier.mods.push({
				name: modName,
				row: i,
				link: rowValues[0]?.hyperlink,
				notes: rowValues[0]?.note,
				position: currentTier.mods.length + 1,
			});
		}

		// Update player progress
		for (let index = 1; index < rowValues.length; index++) {
			if (Boolean(rowValues[index]?.formattedValue)) {
				const playerName = userIndex[index - 1];
				const player = playerProgress.get(playerName);

				player.clearedMods.push({
					modRow: i + 1,
					archived: sheetName === 'Archived',
				});
			}
		}
	}

	const side = sideMap.get(sheetName);
	side.tiers.forEach((tier) => {
		tier.mods.forEach(async (mod) => {
			if (!mod.link) {
				console.log(`${mod.name} does not have a link`);

				// try {
				// 	const modInfo = await sheetsAPI.spreadsheets.values.get({
				// 		spreadsheetId,
				// 		range: `${sheetName}!${mod.row}:${mod.row}`,
				// 		fields: 'data.rowData.values.hyperlink',
				// 	});

				// 	console.log(modInfo);
				// } catch (e) {
				// 	console.log(e.message);
				// }
			}
		});
	});
}

module.exports = { getSheetData };
