const { SlashCommandBuilder } = require('discord.js');
const { getSheetData, shoutouts } = require('../../utils/getData');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('get-data')
		.setDescription('tests getting data with new functions'),

	run: async ({ interaction, client }) => {
		await interaction.reply('Starting data processing');

		try {
			await getSheetData(client, interaction, true);
			await shoutouts(client, true);

			await interaction.editReply('Shoutouts sucessful');
		} catch (e) {
			console.error(e);
			await interaction.editReply(e.message);
		}
	},

	options: {
		devOnly: true,
	},
};
