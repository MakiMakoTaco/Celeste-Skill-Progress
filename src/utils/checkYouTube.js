const { google } = require('googleapis');

const YouTubeAPI = google.youtube({
	version: 'v3',
	auth: process.env.GOOGLE_API_KEY,
});

async function getVideos(query) {
	const response = await YouTubeAPI.search.list({
		part: 'snippet',
		q: `celeste ${query}`,
		type: 'video',
	});

	console.log(response.data);

	return response.data;
}

module.exports = getVideos;
