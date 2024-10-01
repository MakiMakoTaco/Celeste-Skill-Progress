const { SlashCommandBuilder } = require('discord.js');
const {
	getFile,
	getSheetValues,
	findMaps,
	getDefaultUserData,
} = require('../../utils/checkSheets');
const fs = require('fs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('create-jsons')
		.setDescription("Create's the JSONs needed to update the website databse"),

	run: async ({ interaction }) => {
		await interaction.deferReply();

		const file = await getFile();
		const sheetValues = await getSheetValues(file[1]);

		const maps = await findMaps(file[0], sheetValues);
		const stringifiedMaps = JSON.stringify(maps[0]);

		fs.writeFile('maps.json', stringifiedMaps, () => {});

		await interaction.editReply({
			content: 'Here is the maps JSON:',
			files: ['maps.json'],
		});
	},

	options: {
		devOnly: true,
	},
};
