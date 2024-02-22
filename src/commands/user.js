const {
	SlashCommandBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	ComponentType,
} = require('discord.js');
const processSheets = require('../utils/processSheets');
const updateLabels = require('../utils/updateLabels');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('Finds the clear details about a user')
		.addStringOption((name) =>
			name
				.setName('username')
				.setDescription('The name of the user on the google sheets')
				.setRequired(true),
		),

	run: async ({ interaction }) => {
		await interaction.deferReply();

		try {
			const username = interaction.options.getString('username');

			const userData = await processSheets.getUserData(username);

			if (!userData) {
				interaction.editReply(
					`Could not find ${username}. Make sure you have spelt the name correctly, if you are on the google sheets but still failing to appear please contact \`hyrulemaki\``,
				);
			} else {
				const embeds = []; // Array to store the current sheet embeds

				for (const sheet of userData.sheets) {
					const sheetEmbeds = [];

					const title = `${userData.username} has cleared ${userData.totalClears} out of ${userData.totalMods} total mods`;
					const description = `**${sheet.name}**: ${sheet.totalClears}/${sheet.totalMods} clears`;

					for (const challenge of sheet.challenges) {
						let challengeEmbeds = [];
						let challengeField = {};
						let currentFields = [];

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
						for (const mod of challenge.modStats) {
							currentFields.push({
								name: `${mod.name}: ${
									mod.cleared ? 'Cleared!' : 'Uncompleted'
								}`,
								value: '\n',
							});

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
						}

						// If there are remaining mods, create an additional element in the fields array
						if (currentFields.length > 0) {
							challengeEmbeds.push({
								title,
								description,
								fields: [challengeField, ...currentFields],
							});
						}

						sheetEmbeds.push(challengeEmbeds);
					}

					embeds.push(sheetEmbeds);
				}

				// Create buttons to navigate through sheets and pages
				// Page buttons
				const backPage = new ButtonBuilder()
					.setCustomId('backPage')
					.setLabel('PREVIOUS PAGE')
					.setStyle(ButtonStyle.Primary);

				const currentPage = new ButtonBuilder()
					.setCustomId('currentPage')
					.setLabel('CURRENT PAGE')
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true);

				const forwardPage = new ButtonBuilder()
					.setCustomId('forwardPage')
					.setLabel('NEXT PAGE')
					.setStyle(ButtonStyle.Primary);

				// Category buttons
				const backChallenge = new ButtonBuilder()
					.setCustomId('backChallenge')
					.setLabel('PREVIOUS CHALLENGE')
					.setStyle(ButtonStyle.Primary);

				const currentChallenge = new ButtonBuilder()
					.setCustomId('currentChallenge')
					.setLabel('CURRENT CHALLENGE')
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true);

				const forwardChallenge = new ButtonBuilder()
					.setCustomId('forwardChallenge')
					.setLabel('NEXT CHALLENGE')
					.setStyle(ButtonStyle.Primary);

				// Sheet buttons
				const backSheet = new ButtonBuilder()
					.setCustomId('backSheet')
					.setLabel('PREVIOUS SHEET')
					.setStyle(ButtonStyle.Primary);

				const currentSheet = new ButtonBuilder()
					.setCustomId('currentSheet')
					.setLabel('CURRENT SHEET')
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true);

				const forwardSheet = new ButtonBuilder()
					.setCustomId('forwardSheet')
					.setLabel('NEXT SHEET')
					.setStyle(ButtonStyle.Primary);

				let pageNumber = 0;
				let challengeNumber = 0;
				let sheetNumber = 0;
				let page = embeds[sheetNumber][challengeNumber][pageNumber];

				// Set labels
				updateLabels(
					embeds,
					pageNumber,
					challengeNumber,
					sheetNumber,
					currentPage,
					backChallenge,
					currentChallenge,
					forwardChallenge,
					backSheet,
					currentSheet,
					forwardSheet,
				);

				// Create rows
				let pageRow = new ActionRowBuilder().addComponents(
					backPage,
					currentPage,
					forwardPage,
				);

				let challengeRow = new ActionRowBuilder().addComponents(
					backChallenge,
					currentChallenge,
					forwardChallenge,
				);

				let sheetRow = new ActionRowBuilder().addComponents(
					backSheet,
					currentSheet,
					forwardSheet,
				);

				const allRows = [pageRow, challengeRow, sheetRow];

				const reply = await interaction.editReply({
					embeds: [page],
					components: allRows,
				});

				const filter = (i) => i.user.id === interaction.user.id;

				const collector = reply.createMessageComponentCollector({
					componentType: ComponentType.Button,
					filter,
					idle: 60_000,
				});

				collector.on('collect', (interaction) => {
					const oldSheetNumber = sheetNumber || 0;

					switch (interaction.customId) {
						case 'backPage':
							pageNumber--;

							if (pageNumber === -1) {
								pageNumber = embeds[sheetNumber][challengeNumber].length - 1;
							}

							break;
						case 'forwardPage':
							pageNumber++;

							if (pageNumber === embeds[sheetNumber][challengeNumber].length) {
								pageNumber = 0;
							}

							break;
						case 'backChallenge':
							challengeNumber--;

							if (challengeNumber === -1) {
								challengeNumber = embeds[sheetNumber].length - 1;
							}

							pageNumber = 0;
							break;
						case 'forwardChallenge':
							challengeNumber++;

							if (challengeNumber === embeds[sheetNumber].length) {
								challengeNumber = 0;
							}

							pageNumber = 0;
							break;
						case 'backSheet':
							sheetNumber--;

							if (sheetNumber === -1) {
								sheetNumber = embeds.length - 1;
							}

							if (
								challengeNumber >= embeds[sheetNumber].length ||
								embeds[oldSheetNumber].length !== embeds[sheetNumber].length
							) {
								challengeNumber = 0;
							}

							pageNumber = 0;
							break;
						case 'forwardSheet':
							sheetNumber++;

							if (sheetNumber === embeds.length) {
								sheetNumber = 0;
							}

							if (
								challengeNumber >= embeds[sheetNumber].length ||
								embeds[oldSheetNumber].length !== embeds[sheetNumber].length
							) {
								challengeNumber = 0;
							}

							pageNumber = 0;
							break;
					}

					// Update labels
					updateLabels(
						embeds,
						pageNumber,
						challengeNumber,
						sheetNumber,
						currentPage,
						backChallenge,
						currentChallenge,
						forwardChallenge,
						backSheet,
						currentSheet,
						forwardSheet,
					);

					// Adjust page row depending on the number of pages
					if (
						embeds[sheetNumber][challengeNumber].length > 2
						// ||
						// oldSheetNumber !== sheetNumber
					) {
						pageRow.setComponents(backPage, currentPage, forwardPage);
						// .components.forEach((button) => {
						// 	if (button.data.custom_id !== 'currentChallenge') {
						// 		button.setStyle(ButtonStyle.Primary).setDisabled(false);
						// 	} else {
						// 		button.setStyle(ButtonStyle.Secondary).setDisabled(true);
						// 	}
						// });
					} else {
						if (embeds[sheetNumber][challengeNumber].length === 1) {
							pageRow.setComponents(currentPage);
						} else {
							if (pageNumber === 0) {
								pageRow.setComponents(currentPage, forwardPage);
							} else {
								pageRow.setComponents(backPage, currentPage);
							}
						}
					}

					// Adjust challenge row depending on the number of challenges
					if (
						embeds[sheetNumber].length !== 3 ||
						oldSheetNumber !== sheetNumber
					) {
						challengeRow
							.setComponents(backChallenge, currentChallenge, forwardChallenge)
							.components.forEach((button) => {
								if (button.data.custom_id !== 'currentChallenge') {
									button.setStyle(ButtonStyle.Primary).setDisabled(false);
								} else {
									button.setStyle(ButtonStyle.Secondary).setDisabled(true);
								}
							});
					}

					if (embeds[sheetNumber].length <= 3) {
						if (embeds[sheetNumber].length === 1) {
							challengeRow.components.shift().pop();
						} else if (embeds[sheetNumber].length === 2) {
							challengeRow.components.shift();

							if (oldSheetNumber === sheetNumber) {
								challengeRow.components.reverse();
							}
						} else {
							if (challengeNumber === 0) {
								challengeRow.components.shift();
								challengeRow.components.push(backChallenge);
							} else if (challengeNumber === 2) {
								challengeRow.components.pop();
								challengeRow.components.unshift(forwardChallenge);
							}
						}

						challengeRow.components.forEach((button) =>
							button.setStyle(ButtonStyle.Primary).setDisabled(false),
						);

						challengeRow.components[challengeNumber]
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(true);
					}

					// Update embed
					page = embeds[sheetNumber][challengeNumber][pageNumber];
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
						embeds: [embeds[sheetNumber][challengeNumber][pageNumber]],
						components: allRows,
					});
				});
			}
		} catch (error) {
			console.log(`There was an error in ${__dirname}: `, error);
			interaction.editReply(
				'There was an unknown error running this command. Please try again in a minute and if the issue persists ping or contact `hyrulemaki`',
			);
		}
	},
};
