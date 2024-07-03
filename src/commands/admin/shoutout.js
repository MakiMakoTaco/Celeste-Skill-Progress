// const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
// const Shoutout = require('../../schemas/Shoutout');

// module.exports = {
// 	data: new SlashCommandBuilder()
// 		.setName('shoutout')
// 		.setDescription('Enable or disable shoutouts.')
// 		.addBooleanOption((option) =>
// 			option
// 				.setName('enabled')
// 				.setDescription('Enable shoutouts.')
// 				.setRequired(true),
// 		)
// 		.setDMPermission(false)
// 		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

// 	run: async ({ interaction }) => {
// 		if (
// 			interaction.user.id !== '442795347849379879' &&
// 			interaction.guild.id !== '927897210471989270'
// 		) {
// 			return interaction.reply({
// 				content: 'You do not have permission to use this command.',
// 				ephemeral: true,
// 			});
// 		}

// 		const enabled = interaction.options.getBoolean('enabled');

// 		const shoutout = await Shoutout.findOne({ serverId: '927897210471989270' });

// 		if (!shoutout) {
// 			await Shoutout.create({
// 				serverId: '927897210471989270',
// 				enabled,
// 			});

// 			return interaction.reply({
// 				content: `Shoutouts have been ${enabled ? 'enabled' : 'disabled'}.`,
// 				ephemeral: true,
// 			});
// 		}

// 		if (enabled !== shoutout.enabled) {
// 			shoutout.enabled = !shoutout.enabled;
// 			await shoutout.save();
// 		}

// 		return interaction.reply({
// 			content: `Shoutouts have been ${enabled ? 'enabled' : 'disabled'}.`,
// 			ephemeral: true,
// 		});
// 	},
// };
