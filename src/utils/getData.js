const { google } = require('googleapis');
const { numberToColumn } = require('./numberLetterConversion');
const Sides = require('../schemas/Sides');
const Tiers = require('../schemas/Tiers');
const Mods = require('../schemas/Mods');
const Players = require('../schemas/Players');

let shoutoutMap = new Map();

// Create Google Sheets API client
const sheetsAPI = google.sheets({
	version: 'v4',
	auth: process.env.GOOGLE_API_KEY,
});

// Define the spreadsheet ID
const spreadsheetId = '1XTAL3kgpX0bG6SBfznPX8z7Qdb7lGnQRuxeUfPZMFoU';

// Define the fields to be fetched from the spreadsheet
const spreadsheetFields =
	'sheets(properties(title,gridProperties(rowCount,columnCount)),data.rowData.values(formattedValue,effectiveFormat.backgroundColor,note,hyperlink))';

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

		const changes = {
			sides: [],
			tiers: [],
			players: [],
		};

		for (let i = 0; i < sheetNames.data.sheets.length; i++) {
			const sheet = sheetNames.data.sheets[i];
			const sheetName = sheet.properties.title;
			const side = await Sides.findOne({ name: sheetName }, '_id name');

			if (!side) {
				// New side
				console.log(`Sheet ${sheetName} is new`);

				const sheetInfo = await sheetsAPI.spreadsheets.get({
					spreadsheetId,
					ranges: `${sheetName}`,
					fields: spreadsheetFields,
					includeGridData: true,
				});

				await sortData(
					sheetInfo.data.sheets[0],
					sheetName === 'Catstare'
						? 100
						: sheetName === 'DLC'
						? 1000
						: sheetName === 'Archived'
						? 1001
						: i + 1,
				);
			} else {
				console.log(`Sheet ${sheetName} already exists, checking for changes`);
				// Existing side
				const tiers = await Tiers.find(
					{ 'side.id': side._id },
					'_id name first requiredClears modCount',
				);

				await Promise.all(
					tiers.map(async (tier) => {
						tier.modCount = await Mods.countDocuments({ 'tier.id': tier.id }); // Update the modCount field
						tier.first = !Boolean(
							await Players.findOne({
								roles: { $in: `${tier.name} ${side.name}` },
							}),
						);

						if (tier.first) {
							tier.firstPlus = true;
						} else {
							tier.firstPlus = !Boolean(
								await Players.findOne({
									roles: { $in: `${tier.name}+ ${side.name}` },
								}),
							);
						}
					}),
				);

				const sheetMinData = await sheetsAPI.spreadsheets.values.batchGet({
					spreadsheetId,
					majorDimension: 'COLUMNS',
					ranges: [`${sheetName}!A:A`, `${sheetName}!2:3`],
				});

				changes.players.push(
					await checkChanges(side, sheetMinData.data.valueRanges),
				);

				await getPlayerData(side, tiers, changes.players);
			}
		}
	} catch (error) {
		console.error('Error fetching file:', error.message);
		throw error;
	}
}

async function sortData(sheetData, sheetOrder) {
	const sheetName = sheetData.properties.title;

	const newSide = await Sides.create({
		name: sheetName,
		position: sheetOrder,
	});

	const rowData = sheetData.data[0].rowData;

	for (
		let column = 0;
		column < sheetData.properties.gridProperties.columnCount;
		column++
	) {
		if (column === 0) {
			let currentTier;
			let tierLength = 0;
			let modLength = 0;

			for (
				let row = 3;
				row < sheetData.properties.gridProperties.rowCount;
				row++
			) {
				const cell = rowData[row]?.values[0];
				const modName = cell?.formattedValue ?? null;

				if (!modName) continue;

				if (
					currentTier &&
					modName.includes(
						`${sheetName === 'Catstare' ? 'Catstare ' : ''}${
							currentTier.name
						} Total (Out of `,
					)
				) {
					// Skip total rows
					continue;
				}

				if (modName.includes(' Challenges - Clear Any ')) {
					// Start a new tier
					const nameSplit = modName.split(' Challenges - Clear Any ');

					const tierName = nameSplit[0].trim();

					currentTier = await Tiers.create({
						name: tierName,
						requiredClears: nameSplit[1].trim(),
						side: {
							id: newSide.id,
							position: ++tierLength,
						},
						quickInstaller: cell?.hyperlink,
					});

					modLength = 0; // Reset mod length for the new tier
				} else if (currentTier) {
					// Add mod to the current tier
					await Mods.create({
						name: modName,
						tier: {
							id: currentTier.id,
							position: ++modLength,
						},
						row: row + 1,
						link: cell?.hyperlink,
						notes: cell?.note,
					});
				}
			}
		} else if (rowData[1]?.values[column]) {
			const playerName = rowData[1].values[column].formattedValue ?? null;

			if (!playerName) continue;

			const player =
				(await Players.findOne({ name: playerName })) ??
				new Players({
					name: playerName,
					clearedMods: [],
					roles: [],
				});

			for (
				let row = 4;
				row < sheetData.properties.gridProperties.rowCount;
				row++
			) {
				const cell = rowData[row]?.values[column];
				const cellValue = cell?.formattedValue ?? null;

				const modId = await Mods.findOne({ row: row + 1 }, '_id');

				if (cellValue === 'Clear!') {
					player.clearedMods.push({
						sideId: newSide.id,
						modId: modId._id,
						link: cell?.hyperlink,
					});
				}
			}

			// shoutout stuff

			await player.save();
			console.log(
				`Saved ${playerName} with cleared ${player.clearedMods.length} mods`,
			);
		}
	}
}

async function checkChanges(side, values) {
	// const modValues = values[0].values;
	const playerValues = values[1].values;

	// let modChanges = [];
	const playerChanges = [];

	// playerValues.forEach((player, index) => {
	for (let i = 1; i < playerValues.length; i++) {
		const playerColumn = playerValues[i];

		if (playerColumn) {
			const player = await Players.findOne(
				{ name: playerColumn[0] },
				'_id clearedMods.sideId',
			);

			if (
				!player ||
				player.clearedMods.filter((mod) => mod.sideId == side.id).length !=
					playerColumn[1]
			) {
				// Player is new or has a different number of clears
				playerChanges.push({
					name: playerColumn[0],
					clears: playerColumn[1],
					column: numberToColumn(i + 1),
				});
			}
		}
	}
	// });

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

async function getPlayerData(side, tiers, players) {
	const ranges = players[0]
		.map((player) => {
			return `${side.name}!${player.column}:${player.column}`;
		})
		.slice(0, 15); // Limit to 25 ranges for testing

	// do max 50 at a time (change to a loop and split)
	if (ranges.length < 50) {
		console.log('Attempting to get player data');

		try {
			const playerData = await sheetsAPI.spreadsheets.get({
				spreadsheetId,
				fields: 'sheets.data.rowData.values(formattedValue,hyperlink)',
				includeGridData: true,
				ranges,
			});

			const data = playerData.data.sheets[0].data;

			// await Promise.all(
			// 	playerData.data.sheets[0].data.map(async (row) => {
			for (let i = 0; i < data.length; i++) {
				const rowData = data[i].rowData;
				const playerName = rowData[1]?.values[0]?.formattedValue;

				if (playerName) {
					console.log(`Checking info for ${playerName}`);

					// const playerClears = players[i].clears;

					const player =
						(await Players.findOne({ name: playerName })) ??
						new Players({
							name: playerName,
							clearedMods: [],
							roles: [],
						});

					let newClearedMods = false;

					// await Promise.all(
					// 	rowData.map(async (data, index) => {
					// if (i > 3 && data.values) {
					for (let j = 4; j < rowData.length; j++) {
						const values = rowData[j]?.values?.[0];

						if (!values) continue;

						try {
							if (values?.formattedValue === 'Clear!') {
								const mod = await Mods.findOne(
									{ row: j + 1 },
									'_id name tier.id',
								);

								if (!mod && i) {
									console.log(
										`Could not find mod at row ${j + 1} in ${side.name}`,
									);
									continue;
								}

								if (
									mod &&
									!player.clearedMods.includes(
										(clearedMod) => clearedMod.modId == mod._id,
									)
								) {
									newClearedMods = true;

									player.clearedMods.push({
										sideId: side._id,
										modId: mod._id,
										link: values.hyperlink,
									});
								}
							}
						} catch (e) {
							console.error(e);
							process.exit();
						}
					}
					// }
					// 	}),
					// );

					console.log(newClearedMods);

					if (newClearedMods) {
						if (side.name !== 'Archived') {
							await prepareShoutouts(player, tiers, side.name);
						}

						// await player.save();
						// console.log(`Saved ${playerName} with new cleared mods`);
					}
				}

				// Something something shoutout if player has more cleared mods in a tier than needed for role(+)
			}
			// 	}),
			// );
		} catch (e) {
			// await errorChannel.send(e.message);
			console.log(e);
		}
		// } else {
		// 	await errorChannel.send('Too many players to fetch data for at once.');
	}

	// process.exit();
}

// function getModData(sheetName, modValues) {
// 	let tierName = '';
// 	let sideMap = new Map();

// 	for (let i = 3; i < modValues[0].length; i++) {
// 		const modName = modValues[0][i] ?? null;

// 		if (!modName) continue;

// 		if (modName.includes(' Challenges - Clear Any ')) {
// 			const nameSplit = modName.split(' Challenges - Clear Any ');
// 			// const color = rowData[i + 1].values[0]?.effectiveFormat.backgroundColor;
// 			// const colorPlus = rowValues[0]?.effectiveFormat.backgroundColor;

// 			tierName = nameSplit[0].trim().toString();
// 			sideMap.set(tierName, []);

// 			continue;
// 		} else if (
// 			tierName !== '' &&
// 			!modName.includes(
// 				`${sheetName === 'Catstare' ? 'Catstare' : tierName} Total (Out of `,
// 			)
// 		) {
// 			sideMap.get(tierName).push(modName);
// 		}
// 	}

// 	return sideMap;
// }

async function prepareShoutouts(player, tiers, sideName) {
	console.log(`Getting shoutout data for ${player.name}`);

	const existingPlayer = shoutoutMap.get(player.name);
	if (!existingPlayer) {
		shoutoutMap.set(player.name, []);
	}
	const playerMap = shoutoutMap.get(player.name);
	const modIds = player.clearedMods.map((mod) => mod.modId);

	for (const tier of tiers) {
		try {
			const clearedMods = await Mods.countDocuments({
				_id: { $in: modIds },
				'tier.id': tier.id,
			});

			if (clearedMods >= tier.modCount) {
				// return true
				player.roles.push(
					`${tier.name}+ ${sideName}`,
					`${tier.name} ${sideName}`,
				);
				playerMap.push(
					{ first: tier.firstPlus, role: `${tier.name}+ ${sideName}` },
					{ first: tier.first, role: `${tier.name} ${sideName}` },
				);

				tier.firstPlus = false;
				tier.first = false;
				// return { name: tier.name, plus: true };
			} else if (
				clearedMods >= tier.requiredClears &&
				clearedMods < tier.modCount
			) {
				// return false
				player.roles.push(`${tier.name} ${sideName}`);
				playerMap.push({ first: tier.first, role: `${tier.name} ${sideName}` });

				tier.first = false;
				// return { name: tier.name, plus: false };
			}
		} catch (e) {
			console.error(e);
		}
	}
}

async function shoutouts(client) {
	const guild =
		client.guilds.cache.get('773124995684761630') ??
		(await client.guilds.fetch('773124995684761630')); // Get CSR server from cache

	const shoutoutChannel =
		guild.channels.cache.get('1224754665363738645') ??
		(await guild.channels.fetch('1224754665363738645')); // CSR shoutout channel

	console.log(shoutoutMap);

	for (const [name, player] of shoutoutMap.entries()) {
		for (let i = 0; i < player.length; i++) {
			let plus = false;
			const roleData = player[i];

			if (
				roleData.role.includes('+') &&
				player[i + 1]?.role ===
					roleData.role
						.split(' ')
						.map((str, index, arr) =>
							index === arr.length - 2 ? str.slice(0, -1).trim() : str.trim(),
						)
						.join(' ')
			) {
				plus = true;
				i++;
			}

			await shoutoutChannel.send(
				`Congrats to our ${roleData.first ? 'first' : 'newest'} ${
					roleData.role
				}${
					plus && roleData.first && !player[i].first
						? ` (and our newest ${player[i].role})`
						: plus
						? ` (and ${player[i].role})`
						: ''
				} rank, ${name}!`,
			);
		}

		shoutoutMap.delete(name); // Remove the player from the map after processing
	}
}

module.exports = { getSheetData, shoutouts };
