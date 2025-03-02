const { SlashCommandBuilder } = require('discord.js');
const { getSheetData } = require('../../utils/getData');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('get-test-data')
		.setDescription('tests getting data with new functions'),

	run: async ({ interaction }) => {
		await interaction.deferReply();

		try {
			await getSheetData();
			await interaction.editReply('Data fetched');
		} catch (e) {
			console.error(e);
			await interaction.editReply('Error fetching data');
		}
	},

	options: {
		devOnly: true,
	},
};
