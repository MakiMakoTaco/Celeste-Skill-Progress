const Shoutout = require('../../src/schemas/Shoutout');
const User = require('../../src/schemas/UserStats');
const { checkForms, getMember } = require('../../src/utils/checkForms');
const {
	getFile,
	getSheetValues,
	getDefaultUserData,
	getUsersData,
} = require('../../src/utils/checkSheets');

module.exports = async (client) => {
	const errorChannel = await client.channels.fetch(
		process.env.ERROR_CHANNEL_ID,
	);

	// const guildId = '927897210471989270'; // CSR server
	const guildId = '773124995684761630'; // test server

	// let shoutout = await Shoutout.findOne({ serverId: guildId }); // CSR server
	// let shoutout = await Shoutout.findOne({ serverId: '927897210471989270' });

	const guild = client.guilds.cache.get(guildId); // Get CSR server from cache

	// const guildRoles = await guild.roles.fetch(); // Fetch all roles in the server
	let getRoleByName = async (name) => {
		let role = guild.roles.cache.find((r) => r.name === name);
		if (!role) {
			const allRoles = await guild.roles.fetch();
			role = allRoles.find((r) => r.name === name);
		}
		return role;
	}; // Get/fetch roles once needed

	// let members = await guild.members.fetch(); // Fetch all members in the server
	// Function to get member
	let getMemberById = async (id) => {
		let member = guild.members.cache.get(id);
		if (!member) {
			member = await guild.members.fetch(id);
		}
		return member;
	}; // Get/fetch member once needed

	// Extract the number from the role name using regular expressions
	const roleNumbers = [];

	// Get clear number milestones from roles every 24 hours
	setInterval(() => {
		guild.roles.fetch().then((roles) => {
			roles.forEach((role) => {
				const match = role.name.match(/(\d+) clears/);
				if (match) {
					roleNumbers.push([parseInt(match[1]), role.name]);
				}
			});
		});
	}, 24 * 60 * 60 * 1000);

	// const shoutoutChannel = await guild.channels.fetch('927897791932542986'); // CSR shoutout channel
	const shoutoutChannel =
		guild.channels.cache.get('1224754665363738645') ??
		(await guild.channels.fetch('1224754665363738645')); // test channel

	// if (shoutout.enabled) {
	shoutouts();
	// } else {
	// 	// Call function to check if shoutouts are enabled (every hour(?))
	// 	return;
	// }

	async function shoutouts() {
		// shoutout = await Shoutout.findOne({ serverId: guildId });
		const shoutout = await Shoutout.findOne({ serverId: '927897210471989270' });

		if (!shoutout.enabled) {
			// Call function to check if shoutouts are enabled (every hour(?))
			return;
		}

		try {
			// Get data from Google Sheets and check forms in parallel
			const [file, formValues] = await Promise.all([getFile(), checkForms()]);

			// Get data from Google Sheets
			// const file = await getFile();
			const sheet = await getSheetValues(file[1]);

			/**
			 * Make default user a global variable
			 * so that if there's changes to total clears in the first db user compared to the sheets,
			 * we update everyone, whether they have a shoutout/roles to add or not
			 */
			// Create a default user object
			const defaultUser = await getDefaultUserData(file[0], sheet);

			// Get data for all users
			const usersData = await getUsersData(file[0], sheet, defaultUser);

			// const formValues = await checkForms();

			// Comparing changes
			try {
				usersData.forEach(async (user) => {
					let matchingUser = defaultUser;
					let matchSheet = '';
					let matchColumn = '';

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
								matchSheet = sheet.name;
								matchColumn = sheet.userColumn;
								user.roles.push(...existingUser.roles);
							}

							return;
						}
					}

					if (
						matchingUser.totalClearsIncludingArchived ===
						user.totalClearsIncludingArchived
					)
						return;

					roleNumbers.forEach(([number, role]) => {
						if (user.totalClears >= number) {
							if (!user.roles.includes(role)) {
								user.roles.push(role);
							}
						}
					});

					user.sheets.forEach((sheet) => {
						if (sheet.name.includes('Archived')) return;

						sheet.challenges.forEach((challenge) => {
							if (challenge.totalClears >= challenge.clearsForRank) {
								const role = `${challenge.name}${
									!sheet.name.includes('-Side') ? '' : ` ${sheet.name}`
								}`;

								if (!user.roles.includes(role)) {
									user.roles.push(role);
								}

								if (challenge.totalClears === challenge.clearsForPlusRank) {
									const plusRole = `${challenge.name}+${
										!sheet.name.includes('-Side') ? '' : ` ${sheet.name}`
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

							rolesToGive.sort((a, b) => b.rawPosition - a.rawPosition);

							rolesToGive.forEach((role) => {
								if (doneRoles.includes(role)) return;

								if (
									roleNumbers.find(
										([number, roleName]) => roleName === role.name,
									)
								) {
									return;
								}

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

							if (sortedRoles.length !== 0) {
								let editedMessage = '';
								for (let i = 0; i < sortedRoles.length; i++) {
									editedMessage = `**Congrats to our newest ${
										sortedRoles[i]?.length > 0
											? `${sortedRoles[i][0]} (and ${sortedRoles[i][1]})`
											: `${sortedRoles[i]}`
									} rank, ${user.username}!**`;

									const message = await shoutoutChannel.send(`Congrats to `);

									await message.edit(editedMessage);
								}
							}

							// Give the user the new roles
							try {
								let member = await getMember(
									formValues,
									members,
									user.username,
								);

								if (!member) {
									members = await guild.members.fetch();

									member = await getMember(formValues, members, user.username);
								}

								if (member) {
									const memberRoles = await member.roles.cache;
									for (const role of user.roles) {
										if (memberRoles.find((r) => r.name === role)) {
											continue;
										} else {
											try {
												const roleToAdd = guildRoles.find(
													(r) => r.name === role,
												);

												if (roleToAdd) {
													await member.roles.add(roleToAdd);
												}
											} catch (error) {
												console.log(error);
												errorChannel.send(
													`Error adding ${role} to ${user.username}: ${error}`,
												);
											}
										}
									}
								} else {
									errorChannel.send(
										`Error getting member ${user.username} for roles`,
									);
								}
							} catch (error) {
								console.log(error);
								errorChannel.send(
									`Error adding roles to ${user.username}: ${error}`,
								);
							}
						} catch (error) {
							console.log(
								error,
								'Username:',
								user.username,
								'Roles:',
								newRoles,
							);
							errorChannel.send(
								`Error shouting out ${user.username} with the ${newRoles.join(
									', ',
								)} roles in shoutouts channel: ${error}`,
							);
						}
					}

					await User.updateOne(
						{
							sheets: {
								$elemMatch: {
									name: matchSheet,
									userColumn: matchColumn,
								},
							},
						},
						user,
						{
							upsert: true,
						},
					);
				});
			} catch (error) {
				console.error(error);
			}
		} catch (error) {
			console.error(error);
		}
	}
};
