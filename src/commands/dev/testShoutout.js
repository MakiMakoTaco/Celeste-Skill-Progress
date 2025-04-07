const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test-shoutout')
		.setDescription('tests getting data with new functions'),

	run: async ({ interaction, client }) => {
		await interaction.deferReply();

		const guild =
			client.guilds.cache.get('773124995684761630') ??
			(await client.guilds.fetch('773124995684761630')); // Get Testing server if test = true

		const shoutoutChannel =
			guild.channels.cache.get('1224754665363738645') ??
			(await guild.channels.fetch('1224754665363738645')); // Get Testing shoutout channel if test = true

		const errorChannel =
			guild.channels.cache.get('1225142448737620124') ??
			(await guild.channels.fetch('1225142448737620124')); // Get Testing shoutout channel if test = true

		const name = 'PrincessZelda';
		const player = [
			{ role: 'Bronze+ A-Side', first: true },
			{ role: 'Bronze A-Side', first: false },
			{ role: 'Silver A-Side', first: false },
		];
		let playerRoles = [];

		for (let i = 0; i < player.length; i++) {
			let plus = false;
			const roleData = player[i];

			try {
				// Attempt to get roles from the cache
				const cachedRoles = guild.roles.cache.filter((role) =>
					player.some(
						(roleData) => roleData.role && role.name === roleData.role,
					),
				);

				// If all roles are found in the cache, use them
				if (cachedRoles.size === player.length) {
					playerRoles = cachedRoles.map((role) => [role.name, role.id]); // Extract only the role IDs and names
				} else {
					// Fetch all roles from the guild if some are missing in the cache
					const roles = await guild.roles.fetch();

					// Match roles with the player's roles
					playerRoles = roles
						.filter((role) =>
							player.some(
								(roleData) => roleData.role && role.name === roleData.role,
							),
						)
						.map((role) => [role.name, role.id]); // Extract only the role IDs
				}
			} catch (e) {
				console.error(`Error fetching roles for ${name}:`, e);
			}

			console.log(playerRoles);

			if (
				roleData.role.includes('+') &&
				player[i + 1]?.role ===
					roleData.role
						.split(' ')
						.map((str, index, arr) =>
							index === arr.length - 2 ? str.slice(0, -1).trim() : str.trim(),
						)
						.join(' ')
			) {
				plus = true;
				i++;
			}

			try {
				const shoutoutMessage = await shoutoutChannel.send(
					`**Congrats to our ${roleData.first ? 'first' : 'newest'} ${
						roleData.role
					}${
						plus && roleData.first && !player[i].first
							? ` (and our newest ${player[i].role})`
							: plus
							? ` (and ${player[i].role})`
							: ''
					} rank, ${name}!**`,
				);

				try {
					console.log(playerRoles.find((role) => role[0] === roleData.role));

					const editedMessage = `**Congrats to our ${
						roleData.first ? 'first' : 'newest'
					} <@&${playerRoles.find((role) => role[0] === roleData.role)[1]}>${
						plus && roleData.first && !player[i].first
							? ` (and our newest <@&${
									playerRoles.find((role) => role[0] === player[i].role)[1]
							  }>)`
							: plus
							? ` (and <@&${
									playerRoles.find((role) => role[0] === player[i].role)[1]
							  }>)`
							: ''
					} rank, ${name}!**`;

					console.log(editedMessage);

					await shoutoutMessage.edit(editedMessage);
				} catch (e) {
					await errorChannel.send(
						`Error editing shoutout message: https://discord.com/channels/${guild.id}/${shoutoutChannel.id}/${shoutoutMessage.id}`,
					);
					console.error(
						`Error editing message for ${name} with ${roleData.role}`,
					);
				}
			} catch (e) {
				await errorChannel.send(
					`Error sending shoutout message for ${name} with the roles: ${player
						.map((p) => p.role)
						.join(', ')}`,
				);
				console.error(
					`Error sending shoutout message for ${name} with the roles: ${player
						.map((p) => p.role)
						.join(', ')}`,
				);
			}
		}
	},

	options: {
		devOnly: true,
	},
};
