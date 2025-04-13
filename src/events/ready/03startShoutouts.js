const { getSheetData, shoutouts } = require('../../utils/getData');

module.exports = async (client) => {
	if (!client) return;

	const test = client.user.id !== '1207183419096961074';

	const interval = 30 * 60 * 1000; // Run every 30 minutes

	// Function to handle the shoutouts process
	const runShoutouts = async () => {
		try {
			await getSheetData();
			await shoutouts(client, test);
		} catch (error) {
			console.error('Error in shoutouts process:', error);

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

			await errorChannel.send(`Error running shoutouts: ${error.message}`);
		}
	};

	// Run once immediately
	await runShoutouts();

	// Set interval to run every 60 seconds
	const intervalId = setInterval(runShoutouts, interval);

	// Clear interval on shutdown
	process.on('SIGINT', () => {
		clearInterval(intervalId);
		console.log('Shutting down...');
		process.exit();
	});
};
