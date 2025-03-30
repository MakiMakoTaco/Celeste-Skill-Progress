const { Schema, model } = require('mongoose');

const playerSchema = new Schema({
	name: {
		type: String,
		required: true,
		unique: true,
	},
	clearedMods: [
		{
			sideId: {
				type: Schema.Types.ObjectId,
				ref: 'Sides',
			},
			id: {
				type: Schema.Types.ObjectId,
				ref: 'Mods',
			},
			link: String,
			archived: {
				type: Boolean,
				default: false,
			},
		},
	],
	roles: Array,
});

module.exports = model('Players', playerSchema);
