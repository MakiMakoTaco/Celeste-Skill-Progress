const { getSheetData, shoutouts } = require('../../utils/getData');

module.exports = async (client) => {
	const test = client.user.id === '1207183419096961074';

	while (client) {
		try {
			await getSheetData();
			await shoutouts(client, test);
		} catch (e) {
			console.error(e);

			const guild = test
				? client.guilds.cache.get('773124995684761630') ??
				  (await client.guilds.fetch('773124995684761630')) // Get Testing server if test = true
				: client.guilds.cache.get('927897210471989270') ??
				  (await client.guilds.fetch('927897210471989270')); // Get CSR server if test = false

			const errorChannel = test
				? guild.channels.cache.get('1225142448737620124') ??
				  (await guild.channels.fetch('1225142448737620124')) // Get Testing shoutout channel if test = true
				: guild.channels.cache.get('1358900120321654925') ??
				  (await guild.channels.fetch('1358900120321654925')); // Get CSR shoutout channel if test = false

			await errorChannel.send(`Error running shoutouts: ${e.message}`);
		}
	}
};
