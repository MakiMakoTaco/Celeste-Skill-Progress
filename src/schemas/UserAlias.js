const { Schema, model } = require('mongoose');

const userAliasSchema = new Schema({
	discordId: {
		type: String,
		required: true,
		unique: true,
	},
	sheetName: {
		type: String,
		required: true,
	},
	verified: {
		type: Boolean,
		default: false,
		required: true,
	},
});

module.exports = model('UserAlias', userAliasSchema);
