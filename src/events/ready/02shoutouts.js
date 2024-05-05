// const Shoutout = require('../../schemas/Shoutout');
// const User = require('../../schemas/UserStats');
// const { checkForms, getMember } = require('../../utils/checkForms');
// const {
// 	getFile,
// 	getSheetValues,
// 	getDefaultUserData,
// 	getUsersData,
// } = require('../../utils/checkSheets');

// module.exports = async (client) => {
// 	const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);

// 	const guildId = '927897210471989270'; // CSR server
// 	// const guildId = '773124995684761630'; // test server

// 	let shoutout = await Shoutout.findOne({ serverId: guildId }); // CSR server
// 	// let shoutout = await Shoutout.findOne({ serverId: '927897210471989270' });

// 	const guild = await client.guilds.fetch(guildId); // Fetch CSR server
// 	const guildRoles = await guild.roles.fetch(); // Fetch all roles in the server

// 	// Extract the number from the role name using regular expressions
// 	const roleNumbers = [];
// 	guildRoles.forEach((role) => {
// 		const match = role.name.match(/(\d+) clears/);
// 		if (match) {
// 			roleNumbers.push([parseInt(match[1]), role.name]);
// 		}
// 	});

// 	const shoutoutChannel = await guild.channels.fetch('927897791932542986'); // CSR shoutout channel
// 	// const shoutoutChannel = await guild.channels.fetch('1224754665363738645'); // test channel

// 	if (shoutout.enabled) {
// 		shoutouts();
// 	}

// 	async function shoutouts() {
// 		try {
// 			const members = await guild.members.fetch(); // Fetch all members in the server

// 			// Get data from Google Sheets
// 			const file = await getFile();
// 			const sheet = await getSheetValues(file[1]);

// 			// Create a default user object
// 			const defaultUser = await getDefaultUserData(file[0], sheet);

// 			// Get data for all users
// 			const usersData = await getUsersData(file[0], sheet, defaultUser);

// 			const formValues = await checkForms();

// 			// Comparing changes
// 			try {
// 				usersData.forEach(async (user) => {
// 					let matchingUser = defaultUser;
// 					let matchSheet = '';
// 					let matchColumn = '';

// 					for (const sheet of user.sheets) {
// 						if (sheet.userColumn !== null) {
// 							const existingUser = await User.findOne({
// 								sheets: {
// 									$elemMatch: {
// 										name: sheet.name,
// 										userColumn: sheet.userColumn,
// 									},
// 								},
// 							});

// 							if (existingUser) {
// 								matchingUser = existingUser;
// 								matchSheet = sheet.name;
// 								matchColumn = sheet.userColumn;
// 								user.roles.push(...existingUser.roles);
// 							}

// 							break;
// 						}
// 					}

// 					if (matchingUser.totalClears === user.totalClears) return;

// 					roleNumbers.forEach(([number, role]) => {
// 						if (user.totalClears >= number) {
// 							if (!user.roles.includes(role)) {
// 								user.roles.push(role);
// 							}
// 						}
// 					});

// 					user.sheets.forEach((sheet) => {
// 						if (sheet.name.includes('Archived')) return;

// 						sheet.challenges.forEach((challenge) => {
// 							if (challenge.totalClears >= challenge.clearsForRank) {
// 								const role = `${challenge.name}${
// 									!sheet.name.includes('-Side') ? '' : ` ${sheet.name}`
// 								}`;

// 								if (!user.roles.includes(role)) {
// 									user.roles.push(role);
// 								}

// 								if (challenge.totalClears === challenge.clearsForPlusRank) {
// 									const plusRole = `${challenge.name}+${
// 										!sheet.name.includes('-Side') ? '' : ` ${sheet.name}`
// 									}`;

// 									if (!user.roles.includes(plusRole)) {
// 										user.roles.push(plusRole);
// 									}
// 								}
// 							}
// 						});
// 					});

// 					// Get the new roles the user should have compared to last saved data
// 					const newRoles = user.roles?.filter(
// 						(role) => !matchingUser.roles?.includes(role),
// 					);

// 					if (newRoles?.length > 0) {
// 						try {
// 							const rolesToGive = [];
// 							const sortedRoles = [];
// 							const doneRoles = [];

// 							newRoles.forEach((role) => {
// 								rolesToGive.push(guildRoles.find((r) => r.name === role));
// 							});

// 							rolesToGive.sort((a, b) => b.rawPosition - a.rawPosition);

// 							rolesToGive.forEach((role) => {
// 								if (doneRoles.includes(role)) return;

// 								if (
// 									roleNumbers.find(
// 										([number, roleName]) => roleName === role.name,
// 									)
// 								) {
// 									return;
// 								}

// 								if (
// 									role.name.includes('+') &&
// 									newRoles.find((r) => r === role.name.replace('+', ''))
// 								) {
// 									const role2 = guildRoles.find(
// 										(r) => r.name === role.name.replace('+', ''),
// 									);

// 									sortedRoles.push([role, role2]);
// 									doneRoles.push(role2);
// 								} else {
// 									sortedRoles.push(role);
// 								}

// 								doneRoles.push(role);
// 							});

// 							sortedRoles.reverse();

// 							if (sortedRoles.length !== 0) {
// 								let editedMessage = '';
// 								for (let i = 0; i < sortedRoles.length; i++) {
// 									editedMessage = `**Congrats to our newest ${
// 										sortedRoles[i]?.length > 0
// 											? `${sortedRoles[i][0]} (and ${sortedRoles[i][1]})`
// 											: `${sortedRoles[i]}`
// 									} rank, ${user.username}!**`;

// 									const message = await shoutoutChannel.send(`Congrats to `);

// 									await message.edit(editedMessage);
// 								}
// 							}

// 							// Give the user the new roles
// 							try {
// 								const member = await getMember(
// 									formValues,
// 									members,
// 									user.username,
// 								);

// 								if (member) {
// 									const memberRoles = await member.roles.cache;
// 									for (const role of user.roles) {
// 										if (memberRoles.find((r) => r.name === role)) {
// 											continue;
// 										} else {
// 											try {
// 												const roleToAdd = guildRoles.find(
// 													(r) => r.name === role,
// 												);

// 												if (roleToAdd) {
// 													await member.roles.add(roleToAdd);
// 												}
// 											} catch (error) {
// 												console.log(error);
// 												logChannel.send(
// 													`Error adding ${role} to ${user.username}: ${error}`,
// 												);
// 											}

// 											logChannel.send(`Added ${role} to ${user.username}`);
// 										}
// 									}
// 								} else {
// 									logChannel.send(
// 										`Error getting member ${user.username} for roles`,
// 									);
// 								}
// 							} catch (error) {
// 								console.log(error);
// 								logChannel.send(
// 									`Error adding roles to ${user.username}: ${error}`,
// 								);
// 							}
// 						} catch (error) {
// 							console.log(error);
// 							logChannel.send(`Error messaging in shoutouts: ${error}`);
// 						}

// 						await User.updateOne(
// 							{
// 								sheets: {
// 									$elemMatch: {
// 										name: matchSheet,
// 										userColumn: matchColumn,
// 									},
// 								},
// 							},
// 							user,
// 							{
// 								upsert: true,
// 							},
// 						);
// 					}
// 				});
// 			} catch (error) {
// 				console.error(error);
// 			}
// 		} catch (error) {
// 			console.error(error);
// 		}

// 		setTimeout(async () => {
// 			shoutout = await Shoutout.findOne({ serverId: guildId });
// 			if (shoutout.enabled) {
// 				shoutouts();
// 			}
// 		}, 600_000);
// 	}
// };
