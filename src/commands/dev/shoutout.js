const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const User = require('../../schemas/UserStats');
const {
	getFile,
	getSheetValues,
	getDefaultUserData,
	getUsersData,
} = require('../../utils/checkSheets');

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

		// const channel = await client.channels.fetch('1224754665363738645');
		// const message = await channel.messages.fetch('1225886750539386980');
		// await message.edit('test');
		// return;

		try {
			// Get data from Google Sheets
			const file = await getFile();
			const sheet = await getSheetValues(file[1]);

			// Create a default user object
			const defaultUser = await getDefaultUserData(file[0], sheet);

			// Get data for all users
			const usersData = await getUsersData(file[0], sheet, defaultUser);

			// Comparing changes
			try {
				const shoutoutChannel = await client.channels.fetch(
					'1224754665363738645',
				);

				const guild = await client.guilds.fetch('927897210471989270'); // Fetch CSR server
				const guildRoles = await guild.roles.fetch(); // Fetch all roles in the server
				// const guildMembers = await guild.members.fetch(); // Fetch all members in the server

				usersData.forEach(async (user) => {
					let matchingUser = defaultUser;

					for (const sheet of user.sheets) {
						if (sheet.userColumn !== null) {
							const existingUser = await User.findOne({
								sheets: {
									$elemMatch: {
										name: sheet.name,
										userColumn: sheet.userColumn,
									},
								},
							});

							if (existingUser) {
								matchingUser = existingUser;
								user.roles.push(...existingUser.roles);
							}

							break;
						}
					}

					if (matchingUser.totalClears === user.totalClears) return;

					user.sheets.forEach((sheet) => {
						if (sheet.name.includes('Archived')) return;

						sheet.challenges.forEach((challenge) => {
							if (challenge.totalClears >= challenge.clearsForRank) {
								const role = `${challenge.name}${
									sheet.name.includes('Catstare') ? '' : ` ${sheet.name}`
								}`;

								if (!user.roles.includes(role)) {
									user.roles.push(role);
								}

								if (challenge.totalClears === challenge.clearsForPlusRank) {
									const plusRole = `${challenge.name}+${
										sheet.name.includes('Catstare') ? '' : ` ${sheet.name}`
									}`;

									if (!user.roles.includes(plusRole)) {
										user.roles.push(plusRole);
									}
								}
							}
						});
					});

					// Get the new roles the user should have compared to last saved data
					const newRoles = user.roles?.filter(
						(role) => !matchingUser.roles?.includes(role),
					);

					if (newRoles?.length > 0) {
						try {
							const rolesToGive = [];
							const sortedRoles = [];
							const doneRoles = [];

							newRoles.forEach((role) => {
								rolesToGive.push(guildRoles.find((r) => r.name === role));
							});

							rolesToGive.sort((a, b) => a.rawPosition - b.rawPosition);
							rolesToGive.reverse();

							rolesToGive.forEach((role) => {
								if (doneRoles.includes(role)) return;

								if (
									role.name.includes('+') &&
									newRoles.find((r) => r === role.name.replace('+', ''))
								) {
									const role2 = guildRoles.find(
										(r) => r.name === role.name.replace('+', ''),
									);

									sortedRoles.push([role, role2]);
									doneRoles.push(role2);
								} else {
									sortedRoles.push(role);
								}

								doneRoles.push(role);
							});

							sortedRoles.reverse();
							// console.log(sortedRoles[0].members.size);

							if (user.username === 'IamTNT') {
								let editedMessage = '';
								for (let i = 0; i < sortedRoles.length; i++) {
									editedMessage = `**Congratulations to our newest ${
										sortedRoles[i]?.length > 0
											? `${sortedRoles[i][0]} (and ${sortedRoles[i][1]})`
											: `${sortedRoles[i]}`
									} rank, ${user.username}!**`;

									const message = await shoutoutChannel.send(
										`Congratulations to `,
									);

									await message.edit(editedMessage);
								}
							}

							// try {
							// 	rolesToGive.forEach(role => {

							// 	});
							// } catch (error) {

							// }
						} catch (error) {
							const logChannel = await client.channels.fetch(
								process.env.LOG_CHANNEL_ID,
							);

							console.log(error);
							logChannel.send(`Error messaging in shoutouts: ${error}`);
						}

						// await User.updateOne(matchingUser, user, {
						// 	upsert: true,
						// });
					}
					// }
				});
			} catch (error) {
				console.error(error);
			}
		} catch (error) {
			console.error(error);
		}
	},
};
