const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('edit-messages')
		.setDescription('Edit a bot message'),
	// .addStringOption((option) =>
	// 	option
	// 		.setName('message_id')
	// 		.setDescription('The message ID')
	// 		.setRequired(true),
	// )
	// .addStringOption((option) =>
	// 	option
	// 		.setName('message-content')
	// 		.setDescription('The message content')
	// 		.setRequired(true),
	// ),

	run: async ({ interaction, client }) => {
		if (interaction.user.id !== '442795347849379879') {
			return interaction.reply('Only the bot owner can run this command.');
		}
		// const messageID = interaction.options.getString('message_id');
		// const messageContent = interaction.options.getString('message-content');

		try {
			const channel = await client.channels.fetch('927897791932542986');
			const message1 = await channel.messages.fetch('1226503832314581093');
			const message2 = await channel.messages.fetch('1225913836083740824');
			await message1.edit(
				'**Congrats to our newest <@&1193247988269723669> rank, Yohan!**',
			);
			await message2.edit(
				'**Congrats to our newest <@&1193248165676204043> (and <@&1193248143438000158>) rank, touhoe!** _This is a test_',
			);

			await interaction.reply('Edited messages');
		} catch (error) {
			console.error(error);
			await interaction.reply('Error editing messages');
		}
	},
};
