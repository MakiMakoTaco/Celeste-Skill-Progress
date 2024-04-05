const { SlashCommandBuilder } = require('discord.js');
const { google } = require('googleapis');
const credentials = require('../csrCredentials.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear-info')
		.setDescription('Tries accessing the clear info sheet.'),

	run: async ({ interaction, client }) => {
		await interaction.deferReply();

		try {
			// const zelda = await client.users.fetch('442795347849379879');
			// console.log(zelda);
			// return;
			// Create a new instance of the Google Sheets API client      // Move into index file and export
			const googleClient = await google.auth.getClient({
				credentials,
				scopes: ['https://www.googleapis.com/auth/spreadsheets'],
			});

			// Create a new instance of the Google Sheets API
			const sheets = google.sheets({ version: 'v4', auth: googleClient });

			// Now you can use the `sheets` object to interact with the API
			// For example, you can read data from a sheet using the `spreadsheets.values.get` method
			const response = await sheets.spreadsheets.values.get({
				spreadsheetId: process.env.RESPONSE_SHEET_ID,
				range: 'Form Responses 1!B:C', // B and C column of sheet 1, preferably [last saved row] to last row
				majorDimension: 'ROWS',
			});

			console.log('All responses:', response.data.values.length);

			const values = response.data.values;
			values.reverse();

			const users = [];

			values.forEach((row) => {
				const user = {
					id: row[0],
					username: row[1],
				};

				// Check if the id or username already exists
				if (
					!users.some((u) => u.id === user.id || u.username === user.username)
				) {
					users.push(user);
				}
			});

			const guild = await client.guilds.fetch('927897210471989270');
			const discordUser = await guild.members.fetch();

			userInfo = [];

			users.forEach((user) => {
				discordUser.forEach((member) => {
					if (member.user.username === user.username) {
						userInfo.push({
							user: member,
							discordId: member.user.id,
							discordUsername: member.user.username,
							sheetUsername: user,
						});
						console.log(
							`Pairing ${user.username} with ${member.user.username}`,
						);
					}
				});
			});

			console.log(
				discordUser.filter((user) => user.user.discriminator !== '0'),
			);

			console.log(
				userInfo.length,
				users.filter((user) => !user.username.includes('#')).length,
			);
		} catch (error) {
			console.log(error);
		}
	},
};
