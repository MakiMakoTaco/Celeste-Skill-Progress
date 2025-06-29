const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('submissions')
		.setDescription('submission information'),

	run: async ({ interaction }) => {
		interaction.reply(
			'This is a common question we see from newcomers! Submissions can be added to the sheet in two ways.\n\nA submissions script will run twice a day, at <t:1735693200:t> and <t:1735736400:t>. At this time, all submissions that are correctly formatted will be added to the sheet, and shoutouts will be made! (Roles are not currently given out automatically, but mods try to apply them as they come up. If yours is missed, ping a mod!)\n\nIf your submission is not formatted correctly, or if it is a submission for the Catstare or DLC tabs, it will have to be manually reviewed by a moderator of the sheet, which can take some time. Note, resubmitting will likely not make this faster. Be sure to format your submissions properly, and be patient!',
		);
	},
};
