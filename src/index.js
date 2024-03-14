require('dotenv').config();
const path = require('path');
const { Client, IntentsBitField } = require('discord.js');
const { CommandKit } = require('commandkit');
const mongoose = require('mongoose');
const fs = require('fs');

const client = new Client({
	intents: IntentsBitField.Flags.MessageContent,
});

// Log unhandled exceptions
process.on('uncaughtException', (error) => {
	logErrorToFile(error);
	console.error('Unhandled Exception:', error);
	process.exit(1);
});

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection at:', promise, 'reason:', reason);
	logErrorToFile(reason);
});

(async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);

		console.log('Connected to DB.');

		new CommandKit({
			client,
			commandsPath: path.join(__dirname, 'commands'),
			eventsPath: path.join(__dirname, 'events'),
			devGuildIds: ['773124995684761630'],
			devUserIds: ['442795347849379879'],
			bulkRegister: true,
		});

		client.login(process.env.TOKEN);
	} catch (error) {
		logErrorToFile(error);
		console.error('An error occurred:', error);
		process.exit(1);
	}
})();

async function logErrorToFile(error) {
	try {
		const zelda = await client.users.fetch('442795347849379879');

		await zelda.send(`An error occurred: ${error.message}`);
	} catch (error) {
		console.error('Error alerting:', error);
	}

	const currentTime = new Date().toISOString();
	const errorMessage = `${currentTime}: ${error.stack}\n`;

	fs.appendFile('error.log', errorMessage, (err) => {
		if (err) {
			console.error('Error writing to log file:', err);
		} else {
			console.log('Error logged to error.log file.');
		}
	});
}
