const { Schema, model } = require('mongoose');

const sideSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	position: Number,
});

module.exports = model('Sides', sideSchema);
