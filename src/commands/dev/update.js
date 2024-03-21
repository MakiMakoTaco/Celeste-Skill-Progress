const { exec } = require('child_process');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('update')
		.setDescription('Updates and restarts the bot'),

	run: async ({ interaction, client, handler }) => {
		if (interaction.user.id !== '442795347849379879')
			return interaction.reply('Only the bot owner can run this command');
		await interaction.reply('Updating and restarting...');

		// Execute git pull
		exec('git pull', async (error, stdout, stderr) => {
			if (error) {
				console.error(`Error executing git pull: ${error.message}`);
				await interaction.editReply(`Error updating: ${error.message}`);
				return;
			}

			console.log(`stdout: ${stdout}`);
			console.error(`stderr: ${stderr}`);

			await interaction.editReply('Update successful! Restarting...');

			// Restart the bot
			handler.reloadCommands();
		});
	},

	options: {
		devOnly: true,
	},
};
