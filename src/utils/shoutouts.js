// const Shoutout = require('../schemas/Shoutout');
const User = require('../schemas/UserStats');
const { checkForms, getMember } = require('./checkForms');
const {
	getFile,
	getSheetValues,
	getDefaultUserData,
	getUsersData,
} = require('./checkSheets');

// Change so I fetch guild roles before entering/check if they're already fetched
// I can map the guildRoles when I fetch the number milestones
async function addRolesToMember(guildRoles, member, userRoles, errorChannel) {
	let currentMemberRoles = new Set();
	try {
		const fetchedMemberRoles = member.roles.cache;
		currentMemberRoles = new Set(fetchedMemberRoles.map((r) => r.name)) ?? [];
	} catch (error) {
		console.error('Failed to fetch member roles:', error);
		errorChannel.send(`Failed to fetch member roles: ${error}`);
	}

	const rolesToAdd = [];
	const invalidRoles = [];

	for (const role of userRoles) {
		if (currentMemberRoles.has(role)) {
			continue; // Member already has the role
		}

		const roleToAdd = guildRoles.get(role);
		if (roleToAdd) {
			rolesToAdd.push(roleToAdd);
		} else {
			invalidRoles.push(role);
			await errorChannel.send(`Error getting ${role} in mapped roles`);
		}
	}

	if (rolesToAdd.length > 0) {
		try {
			// Assuming the API supports adding multiple roles at once
			await member.roles.add(rolesToAdd);
		} catch (error) {
			console.log(error);
			invalidRoles.push(...rolesToAdd.map((r) => r.name));

			await errorChannel.send(
				`Error adding ${invalidRoles.join(', ')} to ${
					member.user.username
				}: ${error}`,
			);

			const tart = await client.users.fetch('596456704720502797');
			await tart.send(
				`Could not add ${invalidRoles.join(', ')} to ${member.user.username}`,
			);
		}
	}
}

/**
 * Needed changes:
 *
 * - bulk update to Mongo
 * - move guild and shoutout channel to later when shoutouts actually happen
 */

async function shoutouts(client) {
	/**
	 * Foreach guild, check if shoutouts are enabled and run function
	 * Maybe check once user is being shouted out
	 */

	/**
	 * Check enabled status when ready to do the shoutouts, one run of everything and then checks.
	 * Maybe change to Shoutouts.find({ enabled: true }) to see if there's at least one enabled, otherwise leave it
	 *
	 * Is likely enabled in CSR server so is just a fail-safe, as is uncommon maybe just the when shoutout part
	 */

	/**
	 * Grab the userIds or sheet names of the people to do the shoutouts as an array, find the servers who want them to be shouted out and run the roles (if needed) and shoutout
	 */

	// shoutout = await Shoutout.findOne({ serverId: guildId });
	// const shoutout = await Shoutout.findOne({ serverId: '927897210471989270' });

	const errorChannel =
		client.channels.cache.get(process.env.ERROR_CHANNEL_ID) ??
		(await client.channels.fetch(process.env.ERROR_CHANNEL_ID));

	// let timeoutMinutes;
	let updateRoleNumbers = true;
	let roleNumbers = [];
	let guildRolesMap = new Map();
	// let getRoleNumbers;

	const guildId = '927897210471989270'; // CSR server
	// const guildId = '773124995684761630'; // test server

	const guild = client.guilds.cache.get(guildId); // Get CSR server from cache

	const shoutoutChannel =
		guild.channels.cache.get('927897791932542986') ??
		(await guild.channels.fetch('927897791932542986')); // CSR shoutout channel
	// const shoutoutChannel =
	// 	guild.channels.cache.get('1224754665363738645') ??
	// 	(await guild.channels.fetch('1224754665363738645')); // test channel

	// timeoutMinutes = 2;

	if (updateRoleNumbers) {
		// Get clear number milestones from roles every 24 hours
		async function getRoleNumbers() {
			roleNumbers = []; // Reset role numbers
			guildRolesMap = new Map(); // Reset guild roles

			// const guild2 = await client.guilds.fetch('927897210471989270');
			// guild2
			guild.roles
				.fetch()
				.then((roles) => {
					roles.forEach((role) => {
						const match = role.name.match(/(\d+) clears/);
						if (match) {
							roleNumbers.push([parseInt(match[1]), role.name]);
						}
					});

					guildRolesMap = new Map(roles.map((r) => [r.name, r]));
				})
				.catch((error) => {
					console.error('Failed to fetch guild role numbers:', error);
					errorChannel.send(`Failed to fetch guild role numbers: ${error}`);
				});

			updateRoleNumbers = false;
		}

		await getRoleNumbers();

		setTimeout(() => {
			updateRoleNumbers = true;
		}, 1000 * 60 * 60 * 24);
	}

	try {
		// Get data from Google Sheets and check forms in parallel
		const [file, formValues] = await Promise.all([getFile(), checkForms()]);

		// Get data from Google Sheets
		// const file = await getFile();
		const sheet = await getSheetValues(file[1]);

		// Create a default user object
		const defaultUser = await getDefaultUserData(file[0], sheet);

		// Get data for all users
		const usersData = await getUsersData(file[0], sheet, defaultUser);

		// Comparing changes
		try {
			usersData.forEach(async (user) => {
				try {
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

							break;
						}
					}

					if (
						matchingUser.totalClearsIncludingArchived ===
						user.totalClearsIncludingArchived
					)
						return;

					roleNumbers.forEach(([number, roleName]) => {
						if (user.totalClears >= number) {
							if (!user.roles.includes(roleName)) {
								user.roles.push(roleName);
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
							const guildRoles = Array.from(guildRolesMap.values());

							const rolesToGive = [];
							const sortedRoles = [];
							const doneRoles = [];

							newRoles.forEach((role) => {
								rolesToGive.push(guildRoles.find((r) => r.name === role));
							});

							rolesToGive.sort((a, b) => b.rawPosition - a.rawPosition);

							for (const role of rolesToGive) {
								if (doneRoles.includes(role)) continue;

								if (
									roleNumbers.find(
										([number, roleName]) => roleName === role.name,
									)
								) {
									continue;
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
							}

							sortedRoles.reverse();

							if (sortedRoles.length !== 0) {
								let editedMessage = '';
								for (let i = 0; i < sortedRoles.length; i++) {
									editedMessage = `**Congrats to our newest ${
										sortedRoles[i]?.length > 0
											? `${sortedRoles[i][0]} (and ${sortedRoles[i][1]})`
											: `${sortedRoles[i]}`
									} rank, ${user.username}!**`;

									const message = await shoutoutChannel.send('Congrats to ');

									await message.edit(editedMessage);
								}
							}

							// Give the user the new roles
							try {
								// Finding user and adding roles
								let [member, username] = await getMember(
									formValues,
									guild,
									user.username,
								);

								if (member) {
									await addRolesToMember(
										guildRolesMap,
										member,
										user.roles,
										errorChannel,
									);
								} else {
									errorChannel.send(
										`Error getting member ${user.username} for roles. Inputted username: ${username}`,
									);

									const tart = await client.users.fetch('596456704720502797');
									await tart.send(
										`Error getting a member for roles: Inputted username: ${username} (from sheet name: ${user.username})`,
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
								`Unknown error shouting out ${
									user.username
								} with the ${newRoles.join(
									', ',
								)} roles in shoutouts channel: ${error}`,
							);
						}
					}

					// Update user in database
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
				} catch (error) {
					console.error('Error processing user data:', error);
					errorChannel.send(`Error processing user data: ${error}`);
				}
			});

			// Update all users in database if major changes

			setTimeout(() => {
				shoutouts(client);
			}, 1000 * 60 * 60);
		} catch (error) {
			console.error(error);
			errorChannel.send(`Error comparing user data: ${error}`);
		}
	} catch (error) {
		console.error(error);
		errorChannel.send(`Error in shoutout file: ${error}`);
	}
}

module.exports = { shoutouts };
