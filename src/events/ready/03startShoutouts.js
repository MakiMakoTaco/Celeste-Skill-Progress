const { shoutouts } = require('../../utils/shoutouts');

module.exports = async (client) => {
	if (client.user.id === '1207183419096961074') {
		shoutouts(client);
	}
};
