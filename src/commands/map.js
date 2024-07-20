/**
 * Add a way to get details for an entire tier
 *
 *
 */

const {
	SlashCommandBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	ComponentType,
} = require('discord.js');
const { getFile, getSheetValues, findMaps } = require('../utils/checkSheets');
const UserAlias = require('../schemas/UserAlias');
const UserStats = require('../schemas/UserStats');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('map')
		.setDescription('Find a map')
		.addSubcommand((search) =>
			search
				.setName('search')
				.setDescription(
					'Searches for a specific map or maps including a phrase',
				)
				.addStringOption((name) =>
					name
						.setName('name')
						.setDescription('The name of the map or included in the map name')
						.setRequired(true),
				)
				.addBooleanOption((strict) =>
					strict
						.setName('strict')
						.setDescription(
							'Sets if the search results look for an exact match or allow any map that includes the name',
						)
						.setRequired(true),
				),
		)
		.addSubcommand((random) =>
			random
				.setName('random')
				.setDescription('Randomly picks a map')
				.addIntegerOption((amount) =>
					amount
						.setName('amount')
						.setDescription('The number of random maps to get')
						.setMinValue(1)
						.setMaxValue(10),
				)
				.addStringOption((filters) =>
					filters
						.setName('filters')
						.setDescription('A specific filter to apply to the random selector') // allow multiple in the future
						.setAutocomplete(true),
				)
				.addStringOption((uncleared) =>
					uncleared
						.setName('uncleared')
						.setDescription('A clear type to randomise')
						.addChoices(
							{ name: 'Uncleared', value: 'uncleared' },
							{ name: 'Cleared', value: 'cleared' },
							{ name: 'All', value: 'all' },
						),
				)
				.addBooleanOption((DLC) =>
					DLC.setName('dlc').setDescription('Include DLC maps?'),
				)
				.addStringOption((archived) =>
					archived
						.setName('archived')
						.setDescription('Include archived maps? Default is false')
						.addChoices(
							{ name: 'Include', value: 'true' },
							{ name: 'Exclude', value: 'false' },
						),
				),
		),

	run: async ({ interaction }) => {
		async function getSheets() {
			try {
				// Get data from Google Sheets
				const file = await getFile();
				const sheet = await getSheetValues(file[1]);
				const maps = await findMaps(file[0], sheet);
				return maps;
			} catch (error) {
				console.error(error);
				await interaction.editReply(
					`There was an error processing the spreadsheet: ${error.message}. Please try again in a few minutes and if the issue persists then contact \`hyrulemaki\` with the error message.`,
				);
				throw error;
			}
		}

		await interaction.deferReply();

		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'search') {
			const name = interaction.options
				.getString('name')
				.toLowerCase()
				.replaceAll('&', 'and');
			const strict = interaction.options.getBoolean('strict');

			await interaction.editReply(
				`Searching for ${
					strict ? 'a map called' : 'maps containing the name'
				} ${name} <a:CelesteLoad:1236474786155200593>`,
			);

			const sheets = await getSheets();

			let mapResults = [];
			if (strict) {
				for (let i = 0; i < sheets[0].length; i++) {
					mapResults.push(
						...sheets[0][i].filter((item) =>
							item.mapName.toLowerCase().replaceAll('&', 'and').includes(name),
						),
					);
				}
			} else {
				for (let i = 0; i < sheets[0].length; i++) {
					mapResults.push(
						...sheets[0][i].filter((item) =>
							item.mapName.toLowerCase().replaceAll('&', 'and').includes(name),
						),
					);
				}
			}

			const mapFields = [];
			if (mapResults && mapResults.length > 0) {
				const uniqueMapResults = [];
				const mapNamesSet = new Set();

				mapResults.forEach((map) => {
					const mapNameLowerCase = map.mapName.toLowerCase();
					if (!mapNamesSet.has(mapNameLowerCase)) {
						mapNamesSet.add(mapNameLowerCase);

						// Check if there are multiple locations for the same mapName
						const duplicateMaps = mapResults.filter(
							(otherMap) =>
								otherMap.mapName.toLowerCase() === mapNameLowerCase &&
								otherMap !== map,
						);

						if (duplicateMaps.length > 0) {
							// Concatenate locations for duplicates
							const allLocations = [
								map.sheetName,
								...duplicateMaps.map((dupMap) => dupMap.sheetName),
							].join(' | ');
							const allCategories = [
								map.category,
								...duplicateMaps.map((dupMap) => dupMap.category),
							].join(' | ');

							uniqueMapResults.push({
								mapName: map.mapName,
								sheetName: allLocations,
								category: allCategories, // Assuming the category is the same for duplicates
								hyperlink: map.hyperlink, // Assuming the hyperlink is the same for duplicates
							});
						} else {
							// If no duplicates, add the map as is
							uniqueMapResults.push(map);
						}
					}
				});

				uniqueMapResults.forEach((map) => {
					mapFields.push({
						name: `${map.mapName} found in ${
							map.sheetName.includes(' | ')
								? `${map.sheetName.split(' | ').length} locations: ${
										map.sheetName.split(' | ')[0]
								  } under the ${
										map.category.split(' | ')[0]
								  } challenge and in ${
										map.sheetName.split(' | ')[1]
								  } under the ${map.category.split(' | ')[1]} challenge`
								: `${map.sheetName} under the ${map.category} challenge`
						}:`,
						value: map.hyperlink || 'unable to retrieve link\n',
					});
				});

				let mapEmbeds = [];

				const defaultEmbed = new EmbedBuilder().setTitle(
					`Search results for ${name} (${mapFields.length} found)`,
				);

				if (mapFields.length > 10) {
					for (let i = 0; i < mapFields.length; i += 10) {
						mapEmbeds.push(
							new EmbedBuilder(defaultEmbed)
								.setDescription(
									`Results ${i} - ${
										i + 10 > mapFields.length ? mapFields.length : i + 10
									}`,
								)
								.setFields(mapFields.slice(i, i + 10)),
						);
					}
				} else {
					mapEmbeds = new EmbedBuilder()
						.setTitle(`Search results for ${name}`)
						.setFields(mapFields);
				}

				console.log(mapEmbeds);
				console.log(mapEmbeds.length, mapFields.length);

				try {
					if (mapFields.length < 10) {
						interaction.editReply({ content: null, embeds: [mapEmbeds] });
					} else {
						let currentPageNumber = 0;

						const backPage = new ButtonBuilder()
							.setCustomId('backPage')
							.setLabel('PREVIOUS PAGE')
							.setStyle(ButtonStyle.Primary);

						const currentPage = new ButtonBuilder()
							.setCustomId('currentPage')
							.setLabel(`${currentPageNumber + 1}/${mapEmbeds.length}`)
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(true);

						const forwardPage = new ButtonBuilder()
							.setCustomId('forwardPage')
							.setLabel('NEXT PAGE')
							.setStyle(ButtonStyle.Primary);

						const row = new ActionRowBuilder().addComponents(
							backPage,
							currentPage,
							forwardPage,
						);

						const reply = await interaction.editReply({
							content: '',
							embeds: [mapEmbeds[0]],
							components: [row],
						});

						const filter = (i) => i.user.id === interaction.user.id;

						const collector = reply.createMessageComponentCollector({
							componentType: ComponentType.Button,
							filter,
							idle: 60_000,
						});

						collector.on('collect', async (interaction) => {
							switch (interaction.customId) {
								case 'backPage':
									if (currentPageNumber === 0) {
										currentPageNumber = mapEmbeds.length - 1;
									} else {
										currentPageNumber--;
									}

									await row.components[1].setLabel(
										`${currentPageNumber + 1}/${mapEmbeds.length}`,
									);

									await interaction.update({
										content: '',
										embeds: [mapEmbeds[currentPageNumber]],
										components: [row],
									});

									break;
								case 'forwardPage':
									if (currentPageNumber === mapEmbeds.length - 1) {
										currentPageNumber = 0;
									} else {
										currentPageNumber++;
									}

									await row.components[1].setLabel(
										`${currentPageNumber + 1}/${mapEmbeds.length}`,
									);

									await interaction.update({
										content: '',
										embeds: [mapEmbeds[currentPageNumber]],
										components: [row],
									});

									break;
							}
						});

						collector.on('end', async () => {
							row.components.forEach((button) => {
								button.setDisabled(true);
							});

							await interaction.editReply({
								embeds: [mapEmbeds[currentPageNumber]],
								components: [row],
							});
						});
					}
				} catch (error) {
					console.error(error);
					await interaction.editReply(`Error outputting map results.`);
				}
			} else {
				interaction.editReply(
					`No results found for ${name}, make sure you are spelling the name correctly.`,
				);
			}
		} else if (subcommand === 'random') {
			const uncleared = interaction.options?.getString('uncleared') || 'all';
			const filter = interaction.options?.getString('filters') || 'none';
			const dlc = interaction.options?.getBoolean('dlc') || true;
			const archived = interaction.options?.getString('archived') || 'false';
			const randomAmount = interaction.options?.getInteger('amount') || 1;

			let username;

			if (uncleared !== 'all') {
				username = await UserAlias.findOne({
					discordId: interaction.user.id,
				});

				if (!username) {
					await interaction.editReply(
						'You currently do not have a CSR username connected to this Discord account. Please run `/username set` to set one in order to use the cleared/uncleared filter.',
					);
					return;
				}
			}

			await interaction.editReply(
				`Choosing ${randomAmount} random${
					uncleared !== 'all' ? ` ${uncleared}` : ''
				} map${
					randomAmount > 1 ? 's' : ''
				} <a:CelesteLoad:1236474786155200593>`,
			);

			const sheetResultsArray = await getSheets();

			const sheetResults = sheetResultsArray[0] || [];

			const dlcSheets = sheetResults.filter((sheet) =>
				/^DLC \d+$/.test(sheet[0].category),
			);

			if (sheetResults.length > 0) {
				const filteredSheetsLength = !dlc
					? sheetResults.length - dlcSheets.length
					: archived === 'true'
					? sheetResults.length
					: sheetResults.length - 1;
				let filteredMaps = [];
				let sheetIndex = -1;

				if (filter !== 'none') {
					const filterArray = filter.split(', ');

					if (parseInt(filterArray[0]) >= 0) {
						sheetIndex = filterArray[0];
					}

					if (filterArray[1] !== 'none') {
						if (sheetIndex >= 0) {
							filteredMaps = sheetResults[sheetIndex].filter((map) =>
								map.category.toLowerCase().includes(filterArray[1]),
							);
						} else {
							for (let i = 0; i < filteredSheetsLength; i++) {
								filteredMaps.push(
									...sheetResults[i].filter((map) =>
										map.category.toLowerCase().includes(filterArray[1]),
									),
								);
							}
						}
					} else {
						filteredMaps = sheetResults[sheetIndex];
					}
				} else {
					if (archived === 'true') {
						filteredMaps = sheetResults.flat();
					} else {
						const resultsWithoutLast = sheetResults.slice(0, -1);
						filteredMaps = resultsWithoutLast.flat();
					}
				}

				if (username) {
					const userStats = await UserStats.findOne({
						username: username.sheetName,
					});

					if (!userStats) {
						await interaction.editReply(
							`Unable to find clear details for ${username.sheetName}, please make sure you have the correct username and change it with \`/username\`.`,
						);
						return;
					}

					let tempFilteredMaps = [];

					userStats.sheets.forEach((sheet) => {
						if (archived === 'false' && sheet.name === 'Archived') return;

						sheet.challenges.forEach((challenge) => {
							if (uncleared === 'uncleared') {
								tempFilteredMaps.push(
									challenge.modStats.filter((mod) => {
										if (!mod.cleared) {
											return mod;
										}
									}),
								);
							} else if (uncleared === 'cleared') {
								tempFilteredMaps.push(
									challenge.modStats.filter((mod) => {
										if (mod.cleared) {
											return mod;
										}
									}),
								);
							}
						});
					});

					tempFilteredMaps = tempFilteredMaps.flat();

					filteredMaps = filteredMaps.filter((map) =>
						tempFilteredMaps.some((mod) => mod.name === map.mapName),
					);
				}

				if (filteredMaps.length === 0) {
					await interaction.editReply(
						`No maps found with the filters provided. Please try again with different filters.`,
					);
					return;
				}

				const mapFields = [];
				const randomMaps = [];
				const randomNumbers = [];
				const amountToGet =
					randomAmount > filteredMaps.length
						? filteredMaps.length
						: randomAmount;

				for (let i = 0; i < amountToGet; i++) {
					let randomIndex = Math.floor(Math.random() * filteredMaps.length);

					while (randomNumbers.includes(randomIndex)) {
						randomIndex = Math.floor(Math.random() * filteredMaps.length);
					}

					randomNumbers.push(randomIndex);
					randomMaps.push(filteredMaps[randomIndex]);
				}

				try {
					const mapEmbed = new EmbedBuilder();

					if (randomMaps.length === 1) {
						mapEmbed
							.setTitle(`The random map is: ${randomMaps[0].mapName}`)
							.setFields({
								name: `This map is found in ${randomMaps[0].sheetName} under the ${randomMaps[0].category} challenge (row ${randomMaps[0].rowNumber}):`,
								value: randomMaps[0].hyperlink || 'Unable to retrieve link\n',
							});
					} else {
						for (let i = 0; i < randomMaps.length; i++) {
							mapFields.push({
								name: `Map ${i + 1}: ${randomMaps[i].mapName}`,
								value: `This map is found in ${
									randomMaps[i].sheetName
								} under the ${randomMaps[i].category} challenge (row ${
									randomMaps[i].rowNumber
								}):\n${randomMaps[i].hyperlink || 'Unable to retrieve link\n'}`,
							});
						}

						mapEmbed.setTitle(`Random maps`).setFields(mapFields);
					}

					interaction.editReply({ content: null, embeds: [mapEmbed] });
				} catch (error) {
					console.error(error);
					interaction.editReply(`Error fetching map or it's info.`);
				}
			} else {
				interaction.editReply(
					`Error finding a random map, please try again in a few minutes.`,
				);
			}
		}
	},
};
