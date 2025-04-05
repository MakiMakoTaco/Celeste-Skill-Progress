const { SlashCommandBuilder } = require('discord.js');
const { getSheetData, shoutouts } = require('../../utils/getData');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('get-test-data')
		.setDescription('tests getting data with new functions'),

	run: async ({ interaction, client }) => {
		await interaction.deferReply();

		try {
			await getSheetData();
			await shoutouts(client);

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
