const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('ping').setDescription('Pong!'),

	run: async ({ interaction, client }) => {
		const sent = await interaction.reply({
			content: 'Pinging...',
			fetchReply: true,
		});

		interaction.editReply(
			`Roundtrip latency: ${
				sent.createdTimestamp - interaction.createdTimestamp
			}ms\n${
				client.ws.ping != -1
					? `Websocket heartbeat: ${client.ws.ping}ms`
					: 'Websocket heartbeat currently unavailable'
			}`,
		);
	},
};
