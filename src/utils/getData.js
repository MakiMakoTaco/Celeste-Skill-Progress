const { google } = require('googleapis');
// const User = require('../schemas/UserStats');
const Sides = require('../schemas/Sides');
const Tiers = require('../schemas/Tiers');
const Mods = require('../schemas/Mods');
const Players = require('../schemas/Players');
const { numberToColumn } = require('./numberLetterConversion');

// let sideMap = new Map();

// let playerProgress = new Map();

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

		// Only get players for each side and the mods that have the same side id
		const players = await Players.find();

		const changes = {
			sides: [],
			tiers: [],
			players: [],
		};

		for (let i = 0; i < sheetNames.data.sheets.length; i++) {
			const sheet = sheetNames.data.sheets[i];
			const sheetName = sheet.properties.title;
			const currentSide = sides.find((side) => side.name === sheetName);

			// if (currentSide) {
			// 	const tiers = await Tiers.find({ 'side.id': currentSide._id });
			// 	const tierNames = tiers.map((tier) => tier.name);

			// 	await Promise.all(
			// 		tiers.map(async (tier) => {
			// 			const count = await Mods.countDocuments({ 'tier.id': tier.id });

			// 			tier.modCount = count; // Update the modCount field
			// 		}),
			// 	);

			// 	console.log(`Tier names for side ${sheetName}:`, tierNames);

			// 	if (sheetName === 'A-Side') {
			// 		const sheetMinData = await sheetsAPI.spreadsheets.values.batchGet({
			// 			spreadsheetId,
			// 			majorDimension: 'COLUMNS',
			// 			ranges: [`${sheetName}!A:A`, `${sheetName}!2:3`],
			// 		});

			// 		changes.players.push(
			// 			await checkChanges(
			// 				currentSide,
			// 				sheetMinData.data.valueRanges,
			// 				players,
			// 			),
			// 		);

			// 		await getPlayerData(currentSide, tiers, changes.players);
			// 	}
			// } else {
			// New side
			console.log(`Sheet ${sheetName} is new`);

			const sheetInfo = await sheetsAPI.spreadsheets.get({
				spreadsheetId,
				ranges: `${sheetName}`,
				fields: spreadsheetFields,
				includeGridData: true,
			});

			await sortData(sheetInfo.data.sheets[0], i + 1);

			//}
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

	// const newTiers = [];
	// let currentTier;

	// const newMods = [];
	// let currentMod;

	// let playerProgress = new Map();

	const rowData = sheetData.data[0].rowData;

	for (
		let column = 0;
		column < 10;
		// sheetData.properties.gridProperties.columnCount;
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

			await player.save();
			console.log(
				`Saved ${playerName} with cleared ${player.clearedMods.length} mods`,
			);
		}
	}

	// for (let i = 1; i < rowData.length; i++) {
	// 	if (i === 2) continue;

	// 	const rowValues = rowData[i]?.values;
	// 	const modName = rowValues[0]?.formattedValue ?? null;

	// 	if (!modName) continue;

	// 	if (
	// 		currentTier &&
	// 		modName.includes(
	// 			`${
	// 				sheetName === 'Catstare' ? 'Catstare' : currentTier.name
	// 			} Total (Out of `,
	// 		)
	// 	) {
	// 		// Skip total rows
	// 		continue;
	// 	}

	// 	if (i === 1) {
	// 		// Populate userIndex and initialize playerProgress
	// 		// rowValues.forEach((row, rowIndex) => {
	// 		for (let j = 1; j < rowValues.length; j++) {
	// 			const row = rowValues[j];
	// 			const playerName = row?.formattedValue;

	// 			if (playerName) {
	// 				playerProgress.set(j, { name: playerName, clearedMods: [] });
	// 			}
	// 		}
	// 		// });

	// 		continue;
	// 	}

	// 	if (modName.includes(' Challenges - Clear Any ')) {
	// 		// Start a new tier
	// 		const nameSplit = modName.split(' Challenges - Clear Any ');

	// 		const tierName = nameSplit[0].trim();

	// 		currentTier = await Tiers.create({
	// 			name: tierName,
	// 			requiredClears: nameSplit[1].trim(),
	// 			side: {
	// 				id: newSide.id,
	// 				position: newTiers.length + 1,
	// 			},
	// 			quickInstaller: rowValues[0]?.hyperlink,
	// 		});

	// 		newTiers.push(currentTier);

	// 		console.log(`Starting processing for ${tierName} tier`);
	// 		continue;
	// 	} else if (currentTier) {
	// 		// Add mod to the current tier
	// 		currentMod = await Mods.create({
	// 			name: modName,
	// 			tier: {
	// 				id: currentTier.id,
	// 				position:
	// 					newMods.filter((mod) => mod.tier.id == currentTier.id).length + 1,
	// 			},
	// 			row: i + 1,
	// 			link: rowValues[0]?.hyperlink,
	// 			notes: rowValues[0]?.note,
	// 		});

	// 		newMods.push(currentMod);
	// 	}

	// Update player progress
	// await Promise.all(
	// 	rowValues.map(async (row, index) => {
	// for (let j = 1; j < rowValues.length; j++) {
	// 	const row = rowValues[j];
	// 	if (row?.formattedValue === 'Clear!') {
	// 		const player = playerProgress.get(j);

	// 		if (player) {
	// 			if (!player.clearedMods) {
	// 				player.clearedMods = [];
	// 			}

	// 			player.clearedMods.push({
	// 				sideId: newSide.id,
	// 				modId: currentMod.id,
	// 				link: row?.hyperlink,
	// 			});
	// 		}
	// 	}
	// }
	// 	}),
	// );
	// }

	// for (let i = 1; i < sheetData.properties.gridProperties.columnCount; i++) {
	// 	const value = rowData
	// 	const player = await Players.findOne({name: })
	// }

	// const noLinkMods = newMods.filter((mod) => !mod.link);
	// if (noLinkMods.length > 0) {
	// 	console.log(`There are ${noLinkMods.length} mods with no link`);
	// 	const modNames = noLinkMods.map((mod) => mod.name);

	// 	modNames.forEach((modName) => {
	// 		console.log(modName);
	// 	});
	// }

	// await saveData(
	// 	newSide,
	// 	newTiers,
	// 	newMods,
	// 	Array.from(playerProgress.values()),
	// );
	// return [newSide, newTiers, newMods];
}

async function saveData(side, tiers, mods, players) {
	// Save the side, tiers, mods, and players to the database
	try {
		// Collect bulkWrite operations
		const bulkOperations = [];

		for (const player of players) {
			// Check if the player already exists in the database
			const existingPlayer = await Players.findOne({ name: player.name });

			if (existingPlayer) {
				// Merge clearedMods
				const existingClearedMods = existingPlayer.clearedMods || [];
				const newClearedMods = player.clearedMods || [];

				// Update or add mods
				newClearedMods.forEach((newMod) => {
					const existingModIndex = existingClearedMods.findIndex(
						(existingMod) => existingMod.id === newMod.id,
					);

					if (existingModIndex !== -1) {
						// Update the link if the mod ID already exists
						existingClearedMods[existingModIndex].link = newMod.link;
					} else {
						// Add the new mod if it doesn't exist
						existingClearedMods.push(newMod);
					}
				});

				// Add an update operation for the existing player
				bulkOperations.push({
					updateOne: {
						filter: { name: player.name },
						update: { $set: { clearedMods: existingClearedMods } },
					},
				});
			} else {
				// Add an insert operation for a new player
				bulkOperations.push({
					insertOne: {
						document: player,
					},
				});
			}
		}

		// Perform the bulkWrite operation
		if (bulkOperations.length > 0) {
			await Players.bulkWrite(bulkOperations, {
				ordered: false,
			});
		}

		// await side.save();

		// await Tiers.bulkSave(tiers, { ordered: false });

		// await Mods.bulkSave(mods, { ordered: false });
	} catch (error) {
		console.error('Error saving data:', error.message);
		throw error;
	}
}

async function checkChanges(side, values, players) {
	// const modValues = values[0].values;
	const playerValues = values[1].values;

	// let modChanges = [];
	const playerChanges = [];

	playerValues.forEach((player, index) => {
		if (player && player[0] !== 'Celeste Custom Maps') {
			const playerData = players.find((p) => p.name === player[0]) ?? null;

			if (
				!playerData ||
				playerData.clearedMods.filter((mod) => mod.sideId == side.id).length !==
					player[1]
			) {
				// Player is new or has a different number of clears
				playerChanges.push([player[0], index]);
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

async function getPlayerData(side, tiers, players) {
	// const playerNames = players[0]
	// 	.map((player) => player[0])
	// 	.filter((name) => name && name !== 'Celeste Custom Maps');
	// const playerColumns = players[0]
	// 	.filter((player) => player[0] && player[0] !== 'Celeste Custom Maps')
	// 	.map((player) => player[1]);

	// console.log(playerNames, playerColumns);
	// process.exit();

	const ranges = players[0]
		.filter((player) => player[0] && player[0] !== 'Celeste Custom Maps')
		.map((player) => {
			const playerColumn = numberToColumn(player[1]);

			return `${side.name}!${playerColumn}:${playerColumn}`;
		})
		.splice(0, 15);

	if (ranges.length < 250) {
		console.log('Attempting to get player data');

		const archived = side.name === 'Archived';

		try {
			const playerData = await sheetsAPI.spreadsheets.get({
				spreadsheetId,
				fields: 'sheets.data.rowData.values(formattedValue,hyperlink)',
				includeGridData: true,
				ranges,
			});

			await Promise.all(
				playerData.data.sheets[0].data.map(async (row) => {
					const rowData = row.rowData;
					const playerName = rowData[1].values[0].formattedValue;

					if (playerName && playerName !== 'Celeste Custom Maps') {
						console.log(`Checking info for ${playerName}`);

						const player =
							(await Players.findOne({ name: playerName })) ??
							new Players({
								name: playerName,
								clearedMods: [],
								roles: [],
							});

						let newClearedMods = false;

						await Promise.all(
							rowData.map(async (data, index) => {
								if (index > 3 && data.values) {
									const value = data.values;

									try {
										if (value[0]?.formattedValue === 'Clear!') {
											const mod =
												(await Mods.findOne(
													{ row: index + 1 },
													'_id name tier.id',
												)) ?? null;

											if (mod && !player.clearedMods.includes(mod.id)) {
												newClearedMods = true;

												player.clearedMods.push({
													modId: mod.id,
													link: value.hyperlink,
													archived,
												});

												// Get mod something tier compare shoutout if meet requirements
												// } else if (!mod) {
												// 	console.log(
												// 		`Could not find mod at row ${index + 1} in ${sheetName}`,
												// 	);
											}
										}
									} catch (e) {
										console.error(e);
										process.exit();
									}
								}
							}),
						);

						if (newClearedMods) {
							if (side.name !== 'Archived') {
								await shoutout(player, tiers);
							}

							// await player.save();
							// console.log(`Saved ${playerName} with new cleared mods`);
						}
					}

					// Something something shoutout if player has more cleared mods in a tier than needed for role(+)
				}),
			);
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

async function saveSide(sides, tiers, mods) {
	// const sides = sideData;
	console.log(sides);

	sides.forEach(async (side, sideName) => {
		try {
			const newSide = await Sides.create({
				name: sideName,
				position: side.position,
			});

			side.tiers.forEach(async (tier) => {
				try {
					const newTier = await Tiers.create({
						name: tier.name,
						side: { id: newSide.id, position: tier.position },
						requiredClears: tier.requiredClears,
						quickInstaller: tier.quickInstaller,
					});

					tier.mods.forEach(async (mod) => {
						try {
							await Mods.create({
								name: mod.name,
								tier: { id: newTier.id, position: mod.position },
								row: mod.row,
								link: mod.link,
								notes: mod.notes,
							});
						} catch (e) {
							console.error(
								`Error creating new mod "${mod.name}": ${e.message}`,
							);
						}
					});
				} catch (e) {
					console.error(`Error creating new tier "${tier.name}": ${e.message}`);
				}
			});
		} catch (e) {
			console.error(`Error creating new side "${side.name}": ${e.message}`);
		}
	});
}

async function shoutout(player, tiers) {
	const modIds = player.clearedMods.map((mod) => mod.modId);

	// Add to player map -> side: tier objects with tier name and plus rank bool
	const tierShoutout = await Promise.all(
		tiers.map(async (tier) => {
			try {
				const clearedMods = await Mods.countDocuments({
					_id: { $in: modIds },
					'tier.id': tier.id,
				});

				if (clearedMods >= tiers.modCount) {
					// return true
					return { name: tier.name, plus: true };
				} else if (
					clearedMods >= tiers.requiredClears &&
					clearedMods < tiers.modCount
				) {
					// return false
					return { name: tier.name, plus: false };
				}
			} catch (e) {
				console.error(e);
			}
		}),
	);

	console.log(tierShoutout);
	process.exit();
}

module.exports = { getSheetData };
