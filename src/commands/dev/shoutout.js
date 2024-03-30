const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const User = require('../../../in_progress/schemas/UserStats');
const { numberToColumn } = require('../../utils/numberLetterConversion');
const {
	getFile,
	getSheetValues,
	findMaps,
	getUsersData,
} = require('../../../in_progress/utils/checkSheets');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('scan')
		.setDescription(
			'Scans the Google Sheets for the latest data and updates the database.',
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	run: async ({ interaction }) => {
		if (interaction.user.id !== '442795347849379879') {
			return interaction.reply({
				content: 'Only the bot owner can use this command.',
				ephemeral: true,
			});
		}

		await interaction.deferReply();

		try {
			const file = await getFile();

			const sheet = await getSheetValues(file[1]);

			// Getting the latest data
			/**
			 * Run findMaps(change to fetchMaps or something) and change the usersData to take the maps aswell
			 *
			 * Use the maps to get a defualt object for the user
			 * then duplicate the defualt object and change the nessesary values
			 */

			// Comparing changes
			/**
			 * Check the database for the user
			 *
			 * if no user is found then create a defualt and continue
			 *
			 * if found compare the data (if the rank roles have changed to true, should be all I need. Maybe the total clears aswell for that role)
			 * either store changes to do all at once or do as soon as the change has been found
			 *
			 * try adding nessecary role(s) to the user and then send message in the shoutouts channel **without pinging**
			 */

			// Save updated userData to database

			// const maps = await findMaps(file[0], sheet);
			// console.log('maps', maps[0]);

			// const users = await getUsersData(file[0], sheet);
			// console.log(users[0]);
			// console.log(users[3]);
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
