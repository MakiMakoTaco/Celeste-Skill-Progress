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

async function getSheetData(fast = false) {
	// TESTING ONLY
	await Sides.deleteMany();
	await Tiers.deleteMany();
	await Mods.deleteMany();
	await Players.deleteMany();

	try {
		const sheetNames = await sheetsAPI.spreadsheets.get({
			spreadsheetId,
			fields: 'sheets.properties.title',
		});

		for (let i = 0; i < sheetNames.data.sheets.length; i++) {
			const sheet = sheetNames.data.sheets[i];
			const sheetName = sheet.properties.title;
			const side = await Sides.findOne({ name: sheetName }, '_id name');

			if (!side) {
				// New side
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
					fast,
				);
			} else {
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

				const playerChanges = await checkChanges(
					side,
					sheetMinData.data.valueRanges,
				);

				await getPlayerData(side, tiers, playerChanges);
			}
		}
	} catch (error) {
		console.error('Error fetching file:', error.message);
		throw error;
	}
}

async function sortData(sheetData, sheetOrder, fast = false) {
	console.log('Sorting data');

	const sheetName = sheetData.properties.title;

	const newSide = await Sides.create({
		name: sheetName,
		position: sheetOrder,
	});
	const tierIds = [];

	const rowData = sheetData.data[0].rowData;

	if (fast) {
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

				tierIds.push(currentTier._id);

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

		console.log('Processed side data, starting player data');

		await Promise.all(
			rowData[1].values.map(async (column, columnIndex) => {
				if (columnIndex === 0) return;

				const playerName = column.formattedValue ?? null;

				if (!playerName) return;

				const player =
					(await Players.findOne({ name: playerName })) ??
					new Players({
						name: playerName,
						clearedMods: [],
						roles: [],
					});

				await Promise.all(
					rowData.map(async (row, rowIndex) => {
						const cell = row?.values[columnIndex];
						const cellValue = cell?.formattedValue ?? null;

						try {
							const modId = await Mods.findOne(
								{ row: rowIndex + 1, 'tier.id': { $in: tierIds } },
								'_id',
							);

							if (cellValue === 'Clear!') {
								player.clearedMods.push({
									sideId: newSide.id,
									modId: modId._id,
									link: cell?.hyperlink,
								});
							}
						} catch (e) {
							console.error(e.message);
						}
					}),
				);

				await player.save();
				console.log(`Finished sorting data for ${playerName}`);

				return player;
			}),
		);
	} else {
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

						tierIds.push(currentTier._id);

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

					const modId = await Mods.findOne(
						{ row: row + 1, 'tier.id': { $in: tierIds } },
						'_id',
					);

					if (cellValue === 'Clear!') {
						player.clearedMods.push({
							sideId: newSide.id,
							modId: modId._id,
							link: cell?.hyperlink,
						});
					}
				}

				// shoutout stuff
				await prepareShoutouts(
					player,
					await Tiers.find({ 'side.id': newSide._id }),
					sheetName,
				);

				await player.save();
				// console.log(
				// 	`Saved ${playerName} with cleared ${player.clearedMods.length} mods`,
				// );
			}
		}
	}
}

async function checkChanges(side, values) {
	const playerValues = values[1].values;

	const playerChanges = [];

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

	return playerChanges;
}

async function getPlayerData(side, tiers, players) {
	const tierIds = tiers.map((tier) => tier._id);

	const ranges = players.map((player) => {
		return `${side.name}!${player.column}:${player.column}`;
	});

	// Process in batches of 250
	for (let i = 0; i < ranges.length; i += 250) {
		const batch = ranges.slice(i, i + 250);

		// Perform operations on the current batch
		try {
			const playerData = await sheetsAPI.spreadsheets.get({
				spreadsheetId,
				fields: 'sheets.data.rowData.values(formattedValue,hyperlink)',
				includeGridData: true,
				ranges: batch,
			});

			// Process the player data for the current batch
			const data = playerData.data.sheets[0].data;

			for (let j = 0; j < data.length; j++) {
				const rowData = data[j].rowData;
				const playerName = rowData[1]?.values[0]?.formattedValue;

				if (playerName) {
					const player =
						(await Players.findOne({ name: playerName })) ??
						new Players({
							name: playerName,
							clearedMods: [],
							roles: [],
						});

					let newClearedMods = false;

					for (let k = 4; k < rowData.length; k++) {
						const values = rowData[k]?.values?.[0];

						if (!values) continue;

						try {
							if (values?.formattedValue === 'Clear!') {
								const mod = await Mods.findOne(
									{ row: k + 1, 'tier.id': { $in: tierIds } },
									'_id name tier.id',
								);

								if (!mod && j) {
									console.error(
										`Could not find mod at row ${k + 1} in ${side.name}`,
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
						}
					}

					if (newClearedMods) {
						if (side.name !== 'Archived') {
							await prepareShoutouts(player, tiers, side.name);
						}

						await player.save();
					}
				}
			}
		} catch (e) {
			console.error(e);
		}
	}
}

async function prepareShoutouts(player, tiers, sideName) {
	const existingPlayer = shoutoutMap.has(player.name);
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
			} else if (
				clearedMods >= tier.requiredClears &&
				clearedMods < tier.modCount
			) {
				player.roles.push(`${tier.name} ${sideName}`);
				playerMap.push({ first: tier.first, role: `${tier.name} ${sideName}` });

				tier.first = false;
			}
		} catch (e) {
			console.error(e);
		}
	}

	// if (playerMap.length === 0) shoutoutMap.delete(player.name);
}

async function shoutouts(client, test = false) {
	const guild = test
		? client.guilds.cache.get('773124995684761630') ??
		  (await client.guilds.fetch('773124995684761630')) // Get Testing server if test = true
		: client.guilds.cache.get('927897210471989270') ??
		  (await client.guilds.fetch('927897210471989270')); // Get CSR server if test = false

	const shoutoutChannel = test
		? guild.channels.cache.get('1224754665363738645') ??
		  (await guild.channels.fetch('1224754665363738645')) // Get Testing shoutout channel if test = true
		: guild.channels.cache.get('927897791932542986') ??
		  (await guild.channels.fetch('927897791932542986')); // Get CSR shoutout channel if test = false

	const errorChannel = test
		? guild.channels.cache.get('1225142448737620124') ??
		  (await guild.channels.fetch('1225142448737620124')) // Get Testing shoutout channel if test = true
		: guild.channels.cache.get('1358900120321654925') ??
		  (await guild.channels.fetch('1358900120321654925')); // Get CSR shoutout channel if test = false

	for (const [name, player] of shoutoutMap.entries()) {
		for (let i = 0; i < player.length; i++) {
			let plus = false;
			const roleData = player[i];

			let playerRoles = [];

			try {
				// Attempt to get roles from the cache
				const cachedRoles = guild.roles.cache.filter((role) =>
					player.some(
						(roleData) => roleData.role && role.name === roleData.role,
					),
				);

				// If all roles are found in the cache, use them
				if (cachedRoles.size === player.length) {
					playerRoles = cachedRoles.map((role) => [role.name, role.id]); // Extract only the role IDs and names
				} else {
					// Fetch all roles from the guild if some are missing in the cache
					const roles = await guild.roles.fetch();

					// Match roles with the player's roles
					playerRoles = roles
						.filter((role) =>
							player.some(
								(roleData) => roleData.role && role.name === roleData.role,
							),
						)
						.map((role) => [role.name, role.id]); // Extract only the role IDs
				}
			} catch (e) {
				console.error(`Error fetching roles for ${name}:`, e);
			}

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

			try {
				const shoutoutMessage = await shoutoutChannel.send(
					`**Congrats to our ${roleData.first ? 'first' : 'newest'} ${
						roleData.role
					}${
						plus && roleData.first && !player[i].first
							? ` (and our newest ${player[i].role})`
							: plus
							? ` (and ${player[i].role})`
							: ''
					} rank, ${name}!**`,
				);

				try {
					const editedMessage = `**Congrats to our ${
						roleData.first ? 'first' : 'newest'
					} <@&${playerRoles.find((role) => role[0] === roleData.role)[1]}>${
						plus && roleData.first && !player[i].first
							? ` (and our newest <@&${
									playerRoles.find((role) => role[0] === player[i].role)[1]
							  }>)`
							: plus
							? ` (and <@&${
									playerRoles.find((role) => role[0] === player[i].role)[1]
							  }>)`
							: ''
					} rank, ${name}!**`;

					await retry(() => shoutoutMessage.edit(editedMessage));
				} catch (e) {
					await errorChannel.send(
						`Error editing shoutout message: https://discord.com/channels/${guild.id}/${shoutoutChannel.id}/${shoutoutMessage.id}`,
					);
					console.error(
						`Error editing message for ${name} with ${roleData.role}`,
					);
				}
			} catch (e) {
				await errorChannel.send(
					`Error sending shoutout message for ${name} with the roles: ${player.join(
						', ',
					)}`,
				);
				console.error(
					`Error sending shoutout message for ${name} with the roles: ${player.join(
						', ',
					)}`,
				);
			}
		}

		shoutoutMap.delete(name); // Remove the player from the map after processing
	}
}

// Utility function to retry a promise-returning function
async function retry(fn, retries = 3, delay = 1000) {
	for (let i = 0; i < retries; i++) {
		try {
			return await fn();
		} catch (error) {
			if (i === retries - 1) throw error;
			console.log(`Retrying... (${i + 1}/${retries})`);
			await new Promise((res) => setTimeout(res, delay));
		}
	}
}

module.exports = { getSheetData, shoutouts };
