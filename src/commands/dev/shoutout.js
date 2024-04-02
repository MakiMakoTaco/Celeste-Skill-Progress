const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	Client,
} = require('discord.js');
const User = require('../../../in_progress/schemas/UserStats');
const {
	getFile,
	getSheetValues,
	getDefaultUserData,
	getUsersData,
} = require('../../../in_progress/utils/checkSheets');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('scan')
		.setDescription(
			'Scans the Google Sheets for the latest data and updates the database.',
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	run: async ({ interaction, client }) => {
		if (interaction.user.id !== '442795347849379879') {
			return interaction.reply({
				content: 'Only the bot owner can use this command.',
				ephemeral: true,
			});
		}

		await interaction.deferReply();

		try {
			// Get data from Google Sheets
			const file = await getFile();
			const sheet = await getSheetValues(file[1]);

			// Create a default user object
			const defaultUser = await getDefaultUserData(file[0], sheet);

			const usersData = await getUsersData(file[0], sheet, defaultUser);
			console.log(usersData[0]);

			usersData.forEach((user) => {
				user.sheets.forEach((sheet) => {
					sheet.challenges.forEach((challenge) => {
						if (challenge.totalClears >= challenge.clearsForRank) {
							user.roles.push(
								`${challenge.name}${
									sheet.name.includes('Archived') ||
									sheet.name.includes('Catstare')
										? ''
										: ` ${sheet.name}`
								}`,
							);

							if (challenge.totalClears === challenge.clearsForPlusRank) {
								user.roles.push(
									`${challenge.name}+${
										sheet.name.includes('Archived') ||
										sheet.name.includes('Catstare')
											? ''
											: ` ${sheet.name}`
									}`,
								);
							}
						}
					});
				});
			});

			console.log(usersData[0].roles);

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

			try {
				const existingUsersData = await User.find({});

				usersData.forEach(async (user) => {
					const matchingUser =
						existingUsersData.find((u) => u.username === user.username) ||
						defaultUser;

					const newRoles = user.roles?.filter(
						(role) => !matchingUser.roles?.includes(role),
					);

					if (newRoles?.length > 0) {
						if (user.username === 'touhoe') {
							try {
								const guild = await client.guilds.fetch('927897210471989270');
								const guildRoles = await guild.roles.fetch();

								// const rankRoles = guildRoles.filter((role) =>
								// 	newRoles.includes(role.name),
								// );

								// const mappedRoles = rankRoles.map((role) => role);

								const sortedRoles = [];
								if (newRoles.includes('+')) {
									const plusRoles = newRoles.filter((role) =>
										role.includes('+'),
									);

									plusRoles.forEach((role) => {
										const rankRole = guildRoles.find(role);
										const rankRole2 = guildRoles.find((r) => role.includes(r));

										if (doubleRole) {
											sortedRoles.push(rankRole2, rankRole);
										} else {
											sortedRoles.push(rankRole);
										}
									});
								}

								console.log(sortedRoles);

								let editedMessage = '';
								for (let i = 0; i < sortedRoles.length; i++) {
									editedMessage = `**Congratulations to our newest ${
										sortedRoles[0].length > 0
											? `${sortedRoles[0][0]} (and ${sortedRoles[0][1]})`
											: `${sortedRoles[0]}`
									} rank, ${user.username}!**`;

									const shoutoutChannel = await client.channels.fetch(
										'1224754665363738645',
									);

									const message = await shoutoutChannel.send(
										`Congratulations to `,
									);

									await message.edit(editedMessage);
								}

								await User.findOneAndUpdate(
									{ username: user.username },
									{ $addToSet: { roles: { $each: newRoles } } },
									{ upsert: true },
								);
							} catch (error) {
								const logChannel = await client.channels.fetch(
									'1207190273596063774',
								);

								logChannel.send(`Error messaging in shoutouts: ${error}`);
							}
						}
					}
				});
			} catch (error) {
				console.error(error);
			}
		} catch (error) {
			interaction.editReply(`Error: ${error.message}`);

			console.error(error);
		}
	},
};
