const { Schema, model } = require('mongoose');

const modSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	tier: [
		{
			id: {
				type: Schema.Types.ObjectId,
				ref: 'Tiers',
				required: true,
			},
			position: Number,
		},
	],
	row: Number,
	link: String,
	notes: String,
});

module.exports = model('Mods', modSchema);
