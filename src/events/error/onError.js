const fs = require('fs');

module.exports = async (error, client, handler) => {
	logErrorToFile(error, client);

	// Restart the bot
	await handler.reloadCommands();
	await handler.reloadEvents();
};

async function logErrorToFile(error, client) {
	try {
		const zelda = await client.users.fetch('442795347849379879');

		await zelda.send(`An error occurred: ${error.message}`);
		console.log(error);
	} catch (error) {
		console.error('Error alerting:', error);
	}

	const currentTime = new Date().toISOString();
	const errorMessage = `${currentTime}: ${error.stack}\n`;

	fs.appendFile('error.log', errorMessage, (err) => {
		if (err) {
			console.error('Error writing to log file:', err);
		}
	});
}
