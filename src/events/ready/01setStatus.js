const { ActivityType } = require('discord.js');

module.exports = async (client) => {
	if (client.user.id === '1207183419096961074') {
		await client.user.setActivity('Celeste');
	} else {
		await client.user.setActivity('Testing Celeste', {
			type: ActivityType.Custom,
		});
	}
};
