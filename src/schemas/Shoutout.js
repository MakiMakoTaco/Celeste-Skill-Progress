const { Schema, model } = require('mongoose');

const shoutoutSchema = new Schema({
	serverId: {
		type: String,
		required: true,
		unique: true,
	},
	enabled: {
		type: Boolean,
		required: true,
	},
});

module.exports = model('Shoutouts', shoutoutSchema);
