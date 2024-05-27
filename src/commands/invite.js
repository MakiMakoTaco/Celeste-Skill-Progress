const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('invite')
		.setDescription('Sends an invite link to add the bot'),

	run: ({ interaction }) => {
		interaction.reply({
			content:
				'https://discord.com/oauth2/authorize?client_id=1207183419096961074&permissions=275146656832&scope=bot',
			ephemeral: true,
		});
	},
};
