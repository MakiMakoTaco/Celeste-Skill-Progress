const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('quick-installer')
		.setDescription('Gives the link to a quick installer')
		.addStringOption((installer) =>
			installer
				.setName('side')
				.setDescription('The side you want the quick installer for')
				.setChoices(
					{ name: 'A-Side', value: 'a-side' },
					{ name: 'B-Side', value: 'b-side' },
					{ name: 'C-Side', value: 'c-side' },
					{ name: 'Catstare', value: 'catstare' },
					{ name: 'Active DLC', value: 'dlc' },
				)
				.setRequired(true),
		),

	run: async ({ interaction }) => {
		const side = interaction.options.getString('side');

		let sideResponse = side;
		let installer = '';

		switch (side) {
			case 'a-side':
				sideResponse = 'A-Side';
				installer = 'https://gamebanana.com/tools/16083';
				break;
			case 'b-side':
				sideResponse = 'B-Side';
				installer = 'https://gamebanana.com/tools/11922';
				break;
			case 'c-side':
				sideResponse = 'C-Side';
				installer = 'https://gamebanana.com/tools/15836';
				break;
			case 'catstare':
				sideResponse = 'Catstare';
				installer = 'https://gamebanana.com/tools/11923';
				break;
			case 'dlc':
				sideResponse = 'Active DLC';
				installer = 'https://gamebanana.com/tools/16587';
				break;
		}

		await interaction.reply(`${sideResponse} quick installer: <${installer}>`);
	},
};
