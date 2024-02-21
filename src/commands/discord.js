const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('discord')
		.setDescription(
			'Sends the link to the Celeste Skill Rating Discord server',
		),

	run: ({ interaction }) => {
		interaction.reply('https://discord.gg/3A65eGSy3n');
	},
};
