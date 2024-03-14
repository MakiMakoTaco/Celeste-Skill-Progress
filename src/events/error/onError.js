const fs = require('fs');

module.exports = async (error, client, handler) => {
	logErrorToFile(error);

	// Restart the bot
	await handler.reloadCommands();
};

// Function to log error to a file
function logErrorToFile(error) {
	const currentTime = new Date().toISOString();
	const errorMessage = `${currentTime}: ${error.stack}\n`;

	// Append error message to a file named 'error.log'
	fs.appendFile('error.log', errorMessage, (err) => {
		if (err) console.error('Error writing to log file:', err);
	});
}

// // Function to restart the bot
// function restartBot() {
//   // Destroy the current client instance
//   client.destroy();

//   // Create a new client instance
//   const newClient = new Discord.Client();

//   // Re-run your bot initialization code here
//   // For example, you can login again
//   newClient.login('your-bot-token');
// }
