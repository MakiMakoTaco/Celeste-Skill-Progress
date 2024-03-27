const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const User = require('../schemas/UserStats');
const {
	getFile,
	getSheetValues,
	findMaps,
	getUsersData,
} = require('../utils/checkSheets');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('scan')
		.setDescription(
			'Scans the Google Sheets for the latest data and updates the database.',
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	run: async ({ interaction }) => {
		await interaction.deferReply();

		try {
			const file = await getFile();
			const sheet = await getSheetValues(file[1]);

			// const maps = await findMaps(file[0], sheet);

			const users = await getUsersData(file[0], sheet);
			console.log(users[0]);
			console.log(users[3]);
			interaction.editReply('Data found');

			// await User.deleteMany({});
			// interaction.followUp('Cleared database');

			// await User.insertMany(users);
			// interaction.followUp('Data inserted to database');
		} catch (error) {
			interaction.editReply(`Error: ${error.message}`);
		}
	},
};
