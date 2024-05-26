module.exports = async (client) => {
	const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);

	await logChannel.send('Bot online');
	console.log('Bot online');
};
