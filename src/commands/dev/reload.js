const { SlashCommandBuilder } = require('discord.js');
const { restartBot } = require('../..');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reload')
		.setDescription('Reloads something within the bot.')
		.addSubcommand((subcommand) =>
			subcommand.setName('commands').setDescription('Reloads all commands.'),
		)
		.addSubcommand((subcommand) =>
			subcommand.setName('events').setDescription('Reloads all events.'),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('all')
				.setDescription('Reloads all commands and events.'),
		),

	run: async ({ interaction, client, handler }) => {
		await interaction.deferReply();

		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'commands') {
			await interaction.reply('Reloading commands');
			await handler.reloadCommands();
			await interaction.editReply('Commands reloaded');
		} else if (subcommand === 'events') {
			await interaction.reply('Reloading events');
			await handler.reloadEvents();
			await restartBot(client);
			await interaction.editReply('Events reloaded');
		} else if (subcommand === 'all') {
			await handler.reloadCommands();
			await handler.reloadEvents();
			await restartBot(client);
			await interaction.editReply('Commands and events reloaded');
		}
	},

	options: {
		devOnly: true,
	},
};
