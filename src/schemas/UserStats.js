const { Schema, model } = require('mongoose');

const challengeSchema = new Schema({
	name: String,
	totalClears: Number,
	clearsForRank: Number,
	clearsForPlusRank: Number,
	hasRank: Boolean,
	hasPlusRank: Boolean,
	modStats: [
		{
			name: String,
			cleared: String,
			row: Number,
		},
	],
});

const sheetSchema = new Schema({
	name: String,
	userColumn: String,
	totalMods: Number,
	totalClears: Number,
	challenges: [challengeSchema],
});

const userSchema = new Schema(
	{
		username: String,
		discordMember: Object,
		roles: Array,
		totalMods: Number,
		totalClears: Number,
		totalModsIncludingArchived: Number,
		totalClearsIncludingArchived: Number,
		sheets: [sheetSchema],
	},
	{ timestamps: true },
);

module.exports = model('UserStats', userSchema);
