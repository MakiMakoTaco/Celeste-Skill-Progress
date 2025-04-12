const { exec } = require('child_process');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kill')
		.setDescription('Stops the bot by running pm2 stop "CSR".'),

	run: async ({ interaction }) => {
		const userId = interaction.user.id;
		const guildId = interaction.guild?.id;

		// Check if the server ID matches and the user has admin permissions, unless the user ID is 927897210471989270
		if (guildId !== '927897210471989270' && userId !== '442795347849379879') {
			return interaction.reply({
				content:
					'This command can only be used in the specified server or by Zelda.',
				ephemeral: true,
			});
		}

		if (
			!interaction.member.permissions.has('ADMINISTRATOR') ||
			userId !== '442795347849379879'
		) {
			return interaction.reply({
				content: 'You do not have permission to use this command.',
				ephemeral: true,
			});
		}

		// Inform the user that the bot is shutting down
		await interaction.reply('The bot is shutting down...');

		// Execute the PM2 stop command
		exec('pm2 stop "CSR"', (error, stdout, stderr) => {
			if (error) {
				console.error(`Error stopping the bot: ${error.message}`);
			}

			if (stderr) {
				console.error(`stderr: ${stderr}`);
			}

			console.log(`stdout: ${stdout}`);
		});
	},
};
