const {
	SlashCommandBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	ComponentType,
} = require('discord.js');
const processSheets = require('../utils/processSheets');

const updateLabels = (
	embeds,
	pageNumber,
	challengeNumber,
	sheetNumber,
	currentPage,
	previousChallenge,
	currentChallenge,
	nextChallenge,
	previousSheet,
	currentSheet,
	nextSheet,
) => {
	const pageLabel = `${pageNumber + 1}/${
		embeds[sheetNumber][challengeNumber].length
	}`;

	const challengeNames = [
		embeds[sheetNumber][
			challengeNumber <= 0
				? embeds[sheetNumber].length - 1
				: challengeNumber - 1
		][0].fields[0].name,
		embeds[sheetNumber][challengeNumber][0].fields[0].name,
		embeds[sheetNumber][
			challengeNumber >= embeds[sheetNumber].length - 1
				? 0
				: challengeNumber + 1
		][0].fields[0].name,
	];

	let previousChallengeName, currentChallengeName, nextChallengeName;
	for (let i = 0; i < challengeNames.length; i++) {
		const splitName = challengeNames[i].split(':');
		const cleanName =
			splitName.length > 2
				? splitName[1].replaceAll('*', '')
				: splitName[0].replaceAll('*', '');

		switch (i) {
			case 0:
				previousChallengeName = cleanName;
				break;
			case 1:
				currentChallengeName = cleanName;
				break;
			case 2:
				nextChallengeName = cleanName;
		}
	}

	const sheetNames = [
		embeds[sheetNumber <= 0 ? embeds.length - 1 : sheetNumber - 1][0][0]
			.description,
		embeds[sheetNumber][0][0].description,
		embeds[sheetNumber >= embeds.length - 1 ? 0 : sheetNumber + 1][0][0]
			.description,
	];

	let previousSheetName, currentSheetName, nextSheetName;
	for (let i = 0; i < sheetNames.length; i++) {
		const splitName = sheetNames[i].split(':');
		const cleanName =
			splitName.length > 2
				? splitName[1].replaceAll('*', '')
				: splitName[0].replaceAll('*', '');

		switch (i) {
			case 0:
				previousSheetName = cleanName;
				break;
			case 1:
				currentSheetName = cleanName;
				break;
			case 2:
				nextSheetName = cleanName;
		}
	}

	const labels = [
		pageLabel,
		previousChallengeName,
		currentChallengeName,
		nextChallengeName,
		previousSheetName,
		currentSheetName,
		nextSheetName,
	];

	currentPage.setLabel(labels[0]);
	previousChallenge.setLabel(labels[1]);
	currentChallenge.setLabel(labels[2]);
	nextChallenge.setLabel(labels[3]);
	previousSheet.setLabel(labels[4]);
	currentSheet.setLabel(labels[5]);
	nextSheet.setLabel(labels[6]);

	return labels;
};

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
				const pageRow = new ActionRowBuilder().addComponents(
					backPage,
					currentPage,
					forwardPage,
				);

				const challengeRow = new ActionRowBuilder().addComponents(
					backChallenge,
					currentChallenge,
					forwardChallenge,
				);

				const sheetRow = new ActionRowBuilder().addComponents(
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

							if (challengeNumber >= embeds[sheetNumber].length) {
								challengeNumber = 0;
							}

							pageNumber = 0;
							break;
						case 'forwardSheet':
							sheetNumber++;

							if (sheetNumber === embeds.length) {
								sheetNumber = 0;
							}

							if (challengeNumber >= embeds[sheetNumber].length) {
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
