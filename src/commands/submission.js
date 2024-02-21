const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('submission')
		.setDescription('Sends the link to send a submission application'),

	run: ({ interaction }) => {
		interaction.reply('<https://forms.gle/fck6B3Q1Zq53WJdp6>');
	},
};
