module.exports = async (client) => {
	const logChannel = await client.channels.fetch('1207190273596063774');

	await logChannel.send('Bot online');
	console.log('Bot online');
};
