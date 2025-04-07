const allowedCommands = ['discord', 'invite', 'ping', 'quick-installer'];
const { MessageFlags } = require('discord.js');

module.exports = ({ interaction, commandObj }) => {
	if (!allowedCommands.includes(commandObj.data.name)) {
		interaction.reply({
			content: 'Commands are currerently being reworked',
			flags: MessageFlags.Ephemeral,
		});

		return true;
	}
};
