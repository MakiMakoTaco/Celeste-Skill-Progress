const {
	SlashCommandBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	ComponentType,
} = require('discord.js');
const { checkUserExists } = require('../utils/processSheets');
const UserAlias = require('../schemas/UserAlias');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('username')
		.setDescription('Commands for connected username')
		.addSubcommand((set) =>
			set
				.setName('set')
				.setDescription('Sets your CSR username for this account')
				.addStringOption((name) =>
					name
						.setName('username')
						.setDescription('Your CSR username')
						.setRequired(true),
				),
		)
		.addSubcommand((check) =>
			check
				.setName('check')
				.setDescription('Checks your CSR username for this account'),
		)
		.addSubcommand((remove) =>
			remove
				.setName('remove')
				.setDescription('Removes your CSR username from this account'),
		),

	run: async ({ interaction }) => {
		const subcommand = interaction.options.getSubcommand();
		const userId = interaction.user.id;

		if (subcommand === 'set') {
			// Set the username
			const alreadySet = await UserAlias.findOne({ discordId: userId });

			if (alreadySet) {
				interaction.reply(
					`You already have a CSR username set, please remove it first as Zelda is too lazy to implement an update function atm.`,
				);
				return;
			}

			const username = interaction.options.getString('username');

			await interaction.deferReply();

			const userExists = await checkUserExists(username);

			if (!userExists) {
				const confirm = new ButtonBuilder()
					.setCustomId('confirm')
					.setLabel('Confirm')
					.setStyle(ButtonStyle.Success);

				const cancel = new ButtonBuilder()
					.setCustomId('cancel')
					.setLabel('Cancel')
					.setStyle(ButtonStyle.Primary);

				const row = new ActionRowBuilder().addComponents(confirm, cancel);

				const reply = await interaction.editReply({
					content: `${username} does not currently exist in the sheets, if you want to save this username anyways please confirm.\n\nIf you spelt the username correctly and got this message please contact \`hyrulemaki\``,
					components: [row],
				});

				const filter = (i) => i.user.id === interaction.user.id;

				const collector = reply.createMessageComponentCollector({
					componentType: ComponentType.Button,
					filter,
					time: 120_000,
				});

				collector.on('collect', (i) => {
					if (i.customId === 'cancel') {
						interaction.editReply({
							content: 'Cancelled setting username',
							components: [],
						});
					} else if (i.customId === 'confirm') {
						UserAlias.create({
							discordId: userId,
							sheetName: username,
						})
							.then(() => {
								interaction.editReply({
									content: `Your CSR username has been set to ${username}`,
									components: [],
								});
							})
							.catch((error) => {
								console.error(error);
								interaction.editReply({
									content: 'There was an error setting your username',
									components: [],
								});
							});
					}
				});

				collector.on('end', () => {
					interaction.editReply({
						content: 'Setting username timed out',
						components: [],
					});
				});
			} else {
				UserAlias.create({
					discordId: userId,
					sheetName: username,
				})
					.then(() => {
						interaction.editReply({
							content: `Your CSR username has been set to ${username}`,
							components: [],
						});
					})
					.catch((error) => {
						console.error(error);
						interaction.editReply({
							content: 'There was an error setting your username',
							components: [],
						});
					});
			}

			// interaction.reply(`Your CSR username has been set to ${username}`);
		} else if (subcommand === 'check') {
			// Check the username
			await interaction.deferReply();

			const user = await UserAlias.findOne({ discordId: userId });

			if (user) {
				interaction.editReply(
					`Your CSR username is currently set to ${user.sheetName}`,
				);
			} else {
				interaction.editReply(`You do not yet have a CSR username set`);
			}
		} else if (subcommand === 'remove') {
			// Remove the username
			const user = await UserAlias.findOne({ discordId: userId });

			if (user) {
				await user.deleteOne();

				interaction.reply(`Your CSR username has been removed`);
			} else {
				interaction.reply(`You do not yet have a CSR username set`);
			}
		}
	},
};
