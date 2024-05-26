const { EmbedBuilder } = require('discord.js');

async function filterUserSubmissions(interaction, allSubmissions, username) {
	const [submissions, status] = allSubmissions;

	const userSubmissions = submissions.filter(
		(submission) => submission[1].toLowerCase() === username.toLowerCase(),
	);

	if (userSubmissions.length === 0) {
		await interaction.editReply(`No submissions found for ${username}`);
		return null;
	}

	const userSubmissionStatus = status.filter((status) => {
		if (status[0]) {
			const lowerStatus = status[0]
				.toLowerCase()
				.startsWith(`name:${username.toLowerCase()}`);

			return lowerStatus;
		}
	});

	const submissionStatus = [];

	for (let i = 0; i < userSubmissions.length; i++) {
		const submission = userSubmissions[i];
		const status = userSubmissionStatus?.[i]
			? userSubmissionStatus[i][0]
					.split('map:')[1]
					.split(userSubmissions[i][3])[1]
					.trim()
			: null;

		submissionStatus.push([submission, status]);
	}

	submissionStatus.reverse();

	const submissionEmbed = new EmbedBuilder()
		.setTitle('Submission Status')
		.setDescription(
			`${username} has ${userSubmissions.length} submission${
				userSubmissions.length === 1 ? '' : 's'
			}.`,
		)
		.setFields({
			name: 'The timestamps below are in UTC',
			value: '\n',
		});

	const embeds = [new EmbedBuilder(submissionEmbed)];

	for (let i = 0; i < submissionStatus.length; i++) {
		const embed = embeds[embeds.length - 1];
		const statusSplit = submissionStatus[i][1]?.split(' ') ?? null;

		let modString = `${submissionStatus[i][0][3]}`;
		const statusString = `${
			statusSplit
				? `${
						statusSplit[1]
				  } This submission has been ${statusSplit[0].toLowerCase()}`
				: 'This submission is pending.'
		}`;

		// Remove spaces after commas
		modString = modString.replace(/,\s*/g, ', ');

		// Count the number of mods
		let modCount = (modString.match(/,/g) || []).length + 1;

		// If there are more than 5 mods, truncate the string to only include the first 5
		if (modCount > 5) {
			let mods = modString.split(',');
			modString = mods.slice(0, 5).join(',');
		}

		// Replace the last comma with ' and '
		modString = modString.replace(/,([^,]*)$/, ' and$1');

		if (embed.data.fields.length < 10) {
			embed.addFields({
				name: `${modString} was submitted on ${submissionStatus[
					i
				][0][0].replace(' ', ' at ')}`,
				value: statusString,
			});
		} else {
			embeds.push(
				new EmbedBuilder(submissionEmbed).addFields({
					name: `${modString} was submitted on ${submissionStatus[
						i
					][0][0].replace(' ', ' at ')}`,
					value: statusString,
				}),
			);
		}
	}

	return embeds;
}

module.exports = { filterUserSubmissions };
