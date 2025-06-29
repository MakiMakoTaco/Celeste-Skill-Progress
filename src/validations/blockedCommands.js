const allowedCommands = [
	'submissions'
	'create-jsons',
	'get-data',
	'reload',
	'test-shoutout',
	'update',
	'discord',
	'invite',
	'ping',
	'quick-installer',
	'kill',
];
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
