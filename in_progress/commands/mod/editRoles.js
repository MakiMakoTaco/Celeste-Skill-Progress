const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('edit-roles')
		.setDescription('Edit the saved database roles for a user.')
		.addStringOption((sheetName) =>
			sheetName
				.setName('sheet-name')
				.setDescription('The name of the user on the sheet.')
				.setRequired(true),
		)
		.addStringOption((role) =>
			role
				.setName('roles')
				.setDescription(
					'The role(s) to add or remove. *Separate multiple roles with a comma and space.*',
				)
				.setAutocomplete(true)
				.setRequired(true),
		)
		.addStringOption((action) =>
			action
				.setName('action')
				.setDescription('The action to perform on the role.')
				.setChoices(
					{ name: 'Add', value: 'add' },
					{ name: 'Remove', value: 'remove' },
				)
				.setRequired(true),
		),

	run: ({ interaction }) => {
		interaction.reply('This command is not yet implemented.');
	},
};
