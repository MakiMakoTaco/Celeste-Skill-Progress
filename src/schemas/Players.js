const { Schema, model } = require('mongoose');

const playerSchema = new Schema({
	name: {
		type: String,
		required: true,
		unique: true,
	},
	clearedMods: [
		{
			id: {
				type: Schema.Types.ObjectId,
				ref: 'Mods',
			},
			archived: {
				type: Boolean,
				default: false,
			},
		},
	],
	roles: Array,
});

module.exports = model('Players', playerSchema);
