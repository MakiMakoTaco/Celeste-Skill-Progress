const {
	SlashCommandBuilder,
	ComponentType,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
} = require('discord.js');
const UserAlias = require('../schemas/UserAlias');
const { getSubmissionStatus } = require('../utils/checkForms');
const { filterUserSubmissions } = require('../utils/userSubmissions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('submission')
		.setDescription('Commands related to submissions')
		.addSubcommandGroup((subcommandgroup) =>
			subcommandgroup
				.setName('status')
				.setDescription('Check the status of submissions')
				.addSubcommand((subcommand) =>
					subcommand
						.setName('all')
						.setDescription('Get the status of all submissions')
						.addStringOption((option) =>
							option
								.setName('username')
								.setDescription('Your google sheets username'),
						),
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName('specific')
						.setDescription('Get the status of a submission(s)')
						.addIntegerOption((option) =>
							option
								.setName('amount')
								.setDescription('The most recent [amount] submission(s)')
								.setMinValue(1)
								.setRequired(true),
						)
						.addStringOption((option) =>
							option
								.setName('username')
								.setDescription('Your google sheets username'),
						),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand.setName('form').setDescription('Link to the submission form'),
		),

	run: async ({ interaction }) => {
		await interaction.deferReply();

		const subcommandgroup = await interaction.options.getSubcommandGroup();
		const subcommand = await interaction.options.getSubcommand();

		if (subcommandgroup === 'status') {
			if (subcommand === 'all') {
				const username =
					(await interaction.options?.getString('username')) ||
					(await UserAlias.findOne({
						discordId: `${interaction.user.id}`,
					}).then((user) => user.sheetName));

				await interaction.editReply(
					`Checking submission status for ${username} <a:CelesteLoad:1236474786155200593>`,
				);

				const submissionStatus = await getSubmissionStatus();
				const embeds = await filterUserSubmissions(
					interaction,
					submissionStatus,
					username,
				);

				if (embeds.length <= 0) {
					return;
				} else if (embeds.length === 1) {
					await interaction.editReply({
						content: '',
						embeds: [embeds[0]],
					});
				} else {
					let currentPageNumber = 0;

					const backPage = new ButtonBuilder()
						.setCustomId('backPage')
						.setLabel('PREVIOUS PAGE')
						.setStyle(ButtonStyle.Primary);

					const currentPage = new ButtonBuilder()
						.setCustomId('currentPage')
						.setLabel(`${currentPageNumber + 1}/${embeds.length}`)
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
						embeds: [embeds[0]],
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
									currentPageNumber = embeds.length - 1;
								} else {
									currentPageNumber--;
								}

								await row.components[1].setLabel(
									`${currentPageNumber + 1}/${embeds.length}`,
								);

								await interaction.update({
									content: '',
									embeds: [embeds[currentPageNumber]],
									components: [row],
								});

								break;
							case 'forwardPage':
								if (currentPageNumber === embeds.length - 1) {
									currentPageNumber = 0;
								} else {
									currentPageNumber++;
								}

								await row.components[1].setLabel(
									`${currentPageNumber + 1}/${embeds.length}`,
								);

								await interaction.update({
									content: '',
									embeds: [embeds[currentPageNumber]],
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
							embeds: [embeds[currentPageNumber]],
							components: [row],
						});
					});
				}
			} else if (subcommand === 'specific') {
				const amount = await interaction.options.getInteger('amount');
				const username =
					(await interaction.options.getString('username')) ||
					(await UserAlias.findOne({ discordId: interaction.user.id })
						.sheetName);

				await interaction.editReply(`Specific submissions: ${amount}`);
			}
		} else if (!subcommandgroup) {
			if (subcommand === 'form') {
				await interaction.reply('<https://forms.gle/fck6B3Q1Zq53WJdp6>');
			}
		}
	},

	options: {
		devOnly: true,
	},
};
