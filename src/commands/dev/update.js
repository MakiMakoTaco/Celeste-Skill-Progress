const { exec } = require('child_process');
const { SlashCommandBuilder } = require('discord.js');
const { restartBot } = require('../..');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('update')
		.setDescription('Updates and restarts the bot'),

	run: async ({ interaction, client, handler }) => {
		await interaction.reply('Pulling from git...');

		// Execute git pull
		exec('git pull', async (error, stdout) => {
			if (error) {
				console.error(`Error executing git pull: ${error.message}`);
				await interaction.editReply(`Error pulling: ${error.message}`);
				return;
			}

			if (stdout.includes('Already up to date.')) {
				await interaction.editReply('Bot is already up to date');
				return;
			}

			await interaction.editReply(
				`Pull successful! \n\`${stdout}\`\nRestarting...`,
			);

			// Restart the bot
			await handler.reloadCommands();
			await handler.reloadEvents();
			await restartBot(client);

			try {
				await interaction.followUp('Bot restarted successfully!');
			} catch (error) {
				await interaction.followUp(`Error restarting bot: ${error.message}`);
			}
		});
	},

	options: {
		devOnly: true,
	},
};
