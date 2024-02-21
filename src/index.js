require('dotenv').config();
const path = require('path');
const { Client, IntentsBitField } = require('discord.js');
const { CommandKit } = require('commandkit');
const mongoose = require('mongoose');

const client = new Client({
	intents: IntentsBitField.Flags.MessageContent,
});

(async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);

		console.log('Connected to DB.');

		new CommandKit({
			client, // Discord.js client object | Required by default
			commandsPath: path.join(__dirname, 'commands'), // The commands directory
			eventsPath: path.join(__dirname, 'events'), // The events directory
			// validationsPath: path.join(__dirname, 'validations'), // Only works if commandsPath is provided
			devGuildIds: ['773124995684761630'], // To register commands to dev guilds
			devUserIds: ['442795347849379879'],
			// devRoleIds: ['DEV_ROLE_ID_1', 'DEV_ROLE_ID_2'],
			// skipBuiltInValidations: true,
			bulkRegister: true,
		});

		client.login(process.env.TOKEN);
	} catch (error) {
		console.log(`Error: ${error}`);
	}
})();
