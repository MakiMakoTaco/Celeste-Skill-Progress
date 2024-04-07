const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('edit-message')
		.setDescription('Edit a bot message')
		.addStringOption((option) =>
			option
				.setName('messageId')
				.setDescription('The message ID')
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName('message-content')
				.setDescription('The message content')
				.setRequired(true),
		),

	run: async ({ interaction }) => {
		if (interaction.user.id !== '442795347849379879') {
			return interaction.reply('Only the bot owner can run this command.');
		}
		const messageID = interaction.options.getString('messageId');
		const messageContent = interaction.options.getString('message-content');

		try {
			const message = await interaction.channel.messages.fetch(messageID);
			await message.edit(messageContent);
			await interaction.reply(`Edited message with ID ${messageID}`);
		} catch (error) {
			console.error(error);
			await interaction.reply(`Error editing message with ID ${messageID}`);
		}
	},
};
