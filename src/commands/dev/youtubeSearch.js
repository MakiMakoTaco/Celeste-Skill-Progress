const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const getVideos = require('../../utils/checkYouTube');
const he = require('he');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('youtube-search')
		.setDescription('Search for a video on YouTube')
		.addStringOption((option) =>
			option
				.setName('query')
				.setDescription('The search query')
				.setRequired(true),
		),

	run: async ({ interaction }) => {
		await interaction.reply('Fetching results...');

		const query = interaction.options.getString('query');

		const videoResults = await getVideos(query);

		const videosEmbed = new EmbedBuilder()
			.setTitle(`\nVideo results for ${query}`)
			// .setDescription(
			// 	`Found ${
			// 		videoResults.pageInfo.totalResults >= 1000000
			// 			? `over ${videoResults.pageInfo.totalResults}`
			// 			: videoResults.pageInfo.totalResults
			// 	} results`,
			// )
			.setFields(
				videoResults.items.slice(0, 10).map((video, index) => {
					return {
						name: `${index + 1}. ${he.decode(video.snippet.title)}`,
						value: `**Description**: ${he.decode(
							video.snippet.description,
						)}\n**Link**: https://www.youtube.com/watch?v=${video.id.videoId}`,
					};
				}),
			);

		await interaction.editReply({
			content: '',
			embeds: [videosEmbed],
		});
	},

	options: {
		devOnly: true,
	},
};
