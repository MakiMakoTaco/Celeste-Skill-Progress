const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('ping').setDescription('Pong!'),

	run: async ({ interaction, client }) => {
		const sent = await interaction.reply({
			content: 'Pinging...',
			withResponsee: true,
		});

		console.log(sent);

		interaction.editReply(
			`Roundtrip latency: ${
				sent.readyTimestamp - interaction.createdTimestamp
			}ms\n${
				client.ws.ping != -1
					? `Websocket heartbeat: ${client.ws.ping}ms`
					: 'Websocket heartbeat currently unavailable'
			}`,
		);
	},
};
