const { Schema, model } = require('mongoose');

const tierSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	requiredClears: {
		type: Number,
		required: true,
	},
	modCount: Number,
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
