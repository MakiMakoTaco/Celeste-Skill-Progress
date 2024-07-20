module.exports = async (client) => {
	if (client.user.id === '1207183419096961074') {
		const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);

		await logChannel.send('Bot online');
		console.log('Bot online');
	}
};
