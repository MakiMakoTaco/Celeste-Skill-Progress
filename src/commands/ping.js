const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('ping').setDescription('Pong!'),

	run: async ({ interaction, client }) => {
		await interaction.deferReply();

		if (client.ws.ping != -1) {
			interaction.editReply(`Pong! ${client.ws.ping}ms`);
		} else {
			interaction.editReply(
				"There was an error getting the bot's ping, please try again in a bit",
			);
		}
	},
};
