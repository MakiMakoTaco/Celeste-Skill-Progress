const { Schema, model } = require('mongoose');

const clearedModsSchema = new Schema(
	{
		sideId: {
			type: Schema.Types.ObjectId,
			ref: 'Sides',
		},
		modId: {
			type: Schema.Types.ObjectId,
			ref: 'Mods',
		},
		link: String,
	},
	{ _id: false },
);

const playerSchema = new Schema({
	name: {
		type: String,
		required: true,
		unique: true,
	},
	clearedMods: [clearedModsSchema],
	roles: Array,
});

module.exports = model('Players', playerSchema);
