const { SlashCommandBuilder, ComponentType } = require('discord.js');
const UserAlias = require('../schemas/UserAlias');
const UserStats = require('../schemas/UserStats');
const {
	createButtons,
	createRows,
	updateLabels,
	updateRows,
} = require('../utils/updateComponents');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('Finds the clear details about a user')
		.addStringOption((name) =>
			name
				.setName('username')
				.setDescription('The name of the user on the google sheets'),
		)
		.addStringOption((start) =>
			start
				.setName('start')
				.setDescription(
					'The position to start at (currently only if clears is empty)',
				)
				.setAutocomplete(true),
		)
		.addStringOption((clears) =>
			clears
				.setName('clears')
				.setDescription('The clear filter to start with')
				.setChoices(
					{ name: 'All', value: 'all' },
					{ name: 'Cleared', value: 'cleared' },
					{ name: 'Uncleared', value: 'uncleared' },
				),
		),

	run: async ({ interaction }) => {
		await interaction.deferReply();

		const startPos = [];
		const start = interaction.options?.getString('start');
		let clearOption = interaction.options?.getString('clears') || 'all';

		if (start) {
			start.split(', ').forEach((index) => {
				startPos.push(parseInt(index));
			});
		} else {
			startPos.push(0);
			startPos.push(0);
		}

		try {
			let username = interaction.options?.getString('username');

			if (!username) {
				const userAlias = await UserAlias.findOne({
					discordId: interaction.user.id,
				});

				if (userAlias) {
					username = userAlias.sheetName;
				} else {
					interaction.followUp({
						content:
							'You currently do not have a CSR username connected to this Discord account. Please either enter a username when running this command or connect one by running `/username`.',
						ephemeral: true,
					});

					return;
				}
			}

			interaction.editReply(
				`Getting user stats for ${username} <a:CelesteLoad:1236474786155200593>`,
			);

			const userData = await UserStats.findOne({ username: username });

			if (!userData || userData.totalClears === 0) {
				interaction.editReply(
					`Could not find ${username}. Make sure you have spelt the name correctly, if you are on the google sheets but still failing to appear please contact \`hyrulemaki\``,
				);
			} else {
				// const embeds = []; // Array to store the current sheet embeds
				const embeds = { all: [], cleared: [], uncleared: [] };

				for (const sheet of userData.sheets) {
					const sheetEmbeds = [];
					const sheetClearedEmbeds = [];
					const sheetUnclearedEmbeds = [];

					const title = `${userData.username} has cleared ${
						userData.totalClears
					} out of ${userData.totalMods} total mods (${
						userData.totalMods - userData.totalClears
					} left)`;
					const description = `**${sheet.name}**: ${sheet.totalClears}/${sheet.totalMods} clears`;

					for (const challenge of sheet.challenges) {
						let challengeEmbeds = [];
						let clearedEmbeds = [];
						let unclearedEmbeds = [];

						let challengeField = {};
						let currentFields = [];
						let currentClearFields = [];
						let currentUnclearFields = [];

						const challengeInfoName = `${challenge.name}: ${challenge.totalClears}/${challenge.clearsForPlusRank} clears`;
						const challengeInfoValue = `${
							challenge.totalClears >= challenge.clearsForRank
								? `${challenge.name}${
										challenge.totalClears == challenge.clearsForPlusRank
											? '+'
											: ''
								  }`
								: 'No'
						} rank achieved`;

						// Push challenge info to the fields
						challengeField = {
							name: challengeInfoName,
							value: challengeInfoValue,
						};

						// Push modStats to the fields, up to a limit
						const maxModsToShow = 15;

						let clear = false;
						let unclear = false;
						for (const mod of challenge.modStats) {
							const field = {
								name: `${mod.name}: ${
									mod.cleared ? 'Cleared!' : 'Uncompleted'
								}`,
								value: '\n',
							};

							currentFields.push(field);

							if (mod.cleared) {
								clear = true;
								currentClearFields.push(field);
							} else {
								unclear = true;
								currentUnclearFields.push(field);
							}

							// If there are more mods, create a new element in the fields array
							if (currentFields.length >= maxModsToShow) {
								challengeEmbeds.push({
									title,
									description,
									fields: [challengeField, ...currentFields],
								});

								// Reset fields for the next set of mods
								currentFields = [];
							}

							if (currentClearFields.length >= maxModsToShow) {
								clearedEmbeds.push({
									title,
									description,
									fields: [challengeField, ...currentClearFields],
								});

								// Reset fields for the next set of mods
								currentClearFields = [];
							}

							if (currentUnclearFields.length >= maxModsToShow) {
								unclearedEmbeds.push({
									title,
									description,
									fields: [challengeField, ...currentUnclearFields],
								});

								// Reset fields for the next set of mods
								currentUnclearFields = [];
							}
						}

						// If there are remaining mods, create an additional element in the fields array
						if (currentFields.length > 0) {
							challengeEmbeds.push({
								title,
								description,
								fields: [challengeField, ...currentFields],
							});
						}

						if (currentClearFields.length > 0) {
							clearedEmbeds.push({
								title,
								description,
								fields: [challengeField, ...currentClearFields],
							});
						}

						if (currentUnclearFields.length > 0) {
							unclearedEmbeds.push({
								title,
								description,
								fields: [challengeField, ...currentUnclearFields],
							});
						}

						sheetEmbeds.push(challengeEmbeds);

						if (clear === true) {
							sheetClearedEmbeds.push(clearedEmbeds);
						}
						if (unclear === true) {
							sheetUnclearedEmbeds.push(unclearedEmbeds);
						}
					}

					embeds.all.push(sheetEmbeds);
					if (sheetClearedEmbeds?.length > 0) {
						embeds.cleared.push(sheetClearedEmbeds);
					}
					if (sheetUnclearedEmbeds?.length > 0) {
						embeds.uncleared.push(sheetUnclearedEmbeds);
					}
				}

				if (embeds.cleared.length === 0) {
					embeds.cleared.push({ title: 'No cleared mods' });
				}
				if (embeds.uncleared.length === 0) {
					embeds.uncleared.push({
						title: 'No uncleared mods',
						description: 'Congrats, you have cleared all mods! Now what?',
					});
				}

				let currentEmbed = embeds[clearOption];

				let sheetNumber =
					startPos[0] > currentEmbed.length || clearOption !== 'all'
						? 0
						: startPos[0];
				let challengeNumber =
					startPos[1] > currentEmbed[sheetNumber].length ||
					clearOption !== 'all'
						? 0
						: startPos[1];
				let pageNumber = 0;

				let page = currentEmbed[sheetNumber][challengeNumber][pageNumber];

				// Create buttons to navigate through sheets and pages
				const buttons = createButtons(
					pageNumber,
					challengeNumber,
					sheetNumber,
					page,
				);

				let rows = createRows(buttons);

				const allRows = rows;
				updateRows(
					rows,
					buttons,
					currentEmbed,
					clearOption,
					pageNumber,
					challengeNumber,
					sheetNumber,
				);

				// Set labels
				updateLabels(
					buttons,
					currentEmbed,
					pageNumber,
					challengeNumber,
					sheetNumber,
				);

				const reply = await interaction.editReply({
					content: '',
					embeds: [page],
					components: allRows,
				});

				const filter = (i) => i.user.id === interaction.user.id;

				const collector = reply.createMessageComponentCollector({
					componentType: ComponentType.Button,
					filter,
					idle: 60_000,
				});

				collector.on('collect', async (interaction) => {
					const oldSheetNumber = sheetNumber || 0;

					switch (interaction.customId) {
						case 'backPage':
							pageNumber--;

							if (pageNumber === -1) {
								pageNumber =
									currentEmbed[sheetNumber][challengeNumber].length - 1;
							}

							break;
						case 'forwardPage':
							pageNumber++;

							if (
								pageNumber === currentEmbed[sheetNumber][challengeNumber].length
							) {
								pageNumber = 0;
							}

							break;
						case 'challenge1':
							challengeNumber--;

							if (challengeNumber === -1) {
								challengeNumber = currentEmbed[sheetNumber].length - 1;
							}

							pageNumber = 0;
							break;
						case 'challenge3':
							challengeNumber++;

							if (challengeNumber === currentEmbed[sheetNumber].length) {
								challengeNumber = 0;
							}

							pageNumber = 0;
							break;
						case 'sheet1':
							sheetNumber--;

							if (sheetNumber === -1) {
								sheetNumber = currentEmbed.length - 1;
							}

							if (
								challengeNumber >= currentEmbed[sheetNumber].length ||
								currentEmbed[oldSheetNumber].length !==
									currentEmbed[sheetNumber].length
							) {
								challengeNumber = 0;
							}

							pageNumber = 0;
							break;
						case 'sheet3':
							sheetNumber++;

							if (sheetNumber === currentEmbed.length) {
								sheetNumber = 0;
							}

							if (
								challengeNumber >= currentEmbed[sheetNumber].length ||
								currentEmbed[oldSheetNumber].length !==
									currentEmbed[sheetNumber].length
							) {
								challengeNumber = 0;
							}

							pageNumber = 0;
							break;
						case 'all':
							clearOption = 'all';
							pageNumber = 0;
							challengeNumber = 0;
							sheetNumber = 0;
							break;
						case 'cleared':
							clearOption = 'cleared';
							pageNumber = 0;
							challengeNumber = 0;
							sheetNumber = 0;
							break;
						case 'uncleared':
							clearOption = 'uncleared';
							pageNumber = 0;
							challengeNumber = 0;
							sheetNumber = 0;
							break;
					}

					currentEmbed = embeds[clearOption];

					// Update labels and rows
					updateLabels(
						buttons,
						currentEmbed,
						pageNumber,
						challengeNumber,
						sheetNumber,
					);

					updateRows(
						rows,
						buttons,
						currentEmbed,
						clearOption,
						pageNumber,
						challengeNumber,
						sheetNumber,
					);

					// Update embed
					page = currentEmbed[sheetNumber][challengeNumber][pageNumber];
					interaction.update({
						embeds: [page],
						components: allRows,
					});
				});

				collector.on('end', () => {
					allRows.forEach((row) => {
						row.components.forEach((button) => {
							button.setDisabled(true);
						});
					});

					interaction.editReply({
						embeds: [page],
						components: allRows,
					});
				});
			}
		} catch (error) {
			console.log(`There was an error in ${__dirname}: `, error);
			interaction.followUp(
				'There was an unknown error running this command. Please try again in a minute and if the issue persists ping or contact `hyrulemaki`',
			);
		}
	},
};
