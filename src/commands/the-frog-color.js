const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('the-frog-color')
		.setDescription('Change the color of your The Frog role.')
		.addStringOption((color) =>
			color
				.setName('color')
				.setDescription('The color you want for your The Frog role')
				.setChoices(
					{ name: 'Red', value: 'red' },
					{ name: 'Orange', value: 'orange' },
					{ name: 'Yellow', value: 'yellow' },
					{ name: 'Green', value: 'green' },
					{ name: 'Blue', value: 'blue' },
					{ name: 'Purple', value: 'purple' },
					{ name: 'Black', value: 'black' },
				)
				.setRequired(true),
		),

	run: async ({ interaction }) => {
		const guildId = interaction.guild?.id;
		const memberRoles = interaction.member.roles;

		const colorOptions = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple'];

		// Check if the command is used in the specified server
		if (guildId !== '773124995684761630' && guildId !== '927897210471989270') {
			return interaction.reply({
				content: 'This command can only be used in the specified server.',
				ephemeral: true,
			});
		}

		if (!memberRoles.cache.some((role) => role.name.startsWith('The Frog'))) {
			return interaction.reply({
				content: 'You do not have a The Frog role.',
				ephemeral: true,
			});
		}

		const color = interaction.options.getString('color');

		// find existing The Frog color role
		const frogRegex = new RegExp(`^The Frog (${colorOptions.join('|')})$`, 'i');
		const existingFrogRole = memberRoles.cache.find((r) =>
			frogRegex.test(r.name),
		);

		if (color === 'black') {
			if (!existingFrogRole) {
				return interaction.reply({
					content: `Your The Frog role is already black.`,
					ephemeral: true,
				});
			} else {
				try {
					await interaction.member.roles.remove(existingFrogRole);
				} catch (err) {
					console.error('Failed to remove existing Frog role:', err);
				}
			}

			return interaction.reply({
				content: `Your The Frog role color has been changed to black.`,
				ephemeral: true,
			});
		}

		if (
			existingFrogRole ===
			interaction.guild.roles.cache.find(
				(r) =>
					r.name ===
					`The Frog ${color.charAt(0).toUpperCase() + color.slice(1)}`,
			)
		) {
			return interaction.reply({
				content: `Your The Frog role is already ${color}.`,
				ephemeral: true,
			});
		}

		const roleName = `The Frog ${
			color.charAt(0).toUpperCase() + color.slice(1)
		}`;
		const role = interaction.guild.roles.cache.find((r) => r.name === roleName);

		if (!role) {
			return interaction.reply({
				content: `Error finding role, please try again later.`,
				ephemeral: true,
			});
		}

		// remove the old color role if present
		if (existingFrogRole) {
			try {
				await interaction.member.roles.remove(existingFrogRole);
			} catch (err) {
				console.error('Failed to remove existing Frog role:', err);
			}
		}

		// add the new color role
		try {
			await interaction.member.roles.add(role);
		} catch (err) {
			console.error('Failed to add new Frog role:', err);
			return interaction.reply({
				content:
					'There was an error changing your role, please try again later.',
				ephemeral: true,
			});
		}

		return interaction.reply({
			content: `Your The Frog role color has been changed to ${color}.`,
			ephemeral: true,
		});
	},
};
