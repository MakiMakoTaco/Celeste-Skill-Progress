const { Schema, model } = require('mongoose');

const tierSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	clearsForRank: {
		type: Number,
		required: true,
	},
	side: {
		id: {
			type: Schema.Types.ObjectId,
			ref: 'Sides',
			required: true,
		},
		position: Number,
	},
	quickInstaller: String,
});

module.exports = model('Tiers', tierSchema);
