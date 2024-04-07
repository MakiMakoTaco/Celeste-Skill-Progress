const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

function createButtons() {
	// Page buttons
	const backPage = new ButtonBuilder()
		.setCustomId('backPage')
		.setLabel('PREVIOUS PAGE')
		.setStyle(ButtonStyle.Primary);

	const currentPage = new ButtonBuilder()
		.setCustomId('currentPage')
		.setLabel('CURRENT PAGE')
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(true);

	const forwardPage = new ButtonBuilder()
		.setCustomId('forwardPage')
		.setLabel('NEXT PAGE')
		.setStyle(ButtonStyle.Primary);

	// Category buttons
	const challenge1 = new ButtonBuilder()
		.setCustomId('challenge1')
		.setLabel('PREVIOUS CHALLENGE')
		.setStyle(ButtonStyle.Primary);

	const challenge2 = new ButtonBuilder()
		.setCustomId('challenge2')
		.setLabel('CURRENT CHALLENGE')
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(true);

	const challenge3 = new ButtonBuilder()
		.setCustomId('challenge3')
		.setLabel('NEXT CHALLENGE')
		.setStyle(ButtonStyle.Primary);

	// Sheet buttons
	const sheet1 = new ButtonBuilder()
		.setCustomId('sheet1')
		.setLabel('PREVIOUS SHEET')
		.setStyle(ButtonStyle.Primary);

	const sheet2 = new ButtonBuilder()
		.setCustomId('sheet2')
		.setLabel('CURRENT SHEET')
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(true);

	const sheet3 = new ButtonBuilder()
		.setCustomId('sheet3')
		.setLabel('NEXT SHEET')
		.setStyle(ButtonStyle.Primary);

	const allStats = new ButtonBuilder()
		.setCustomId('all')
		.setLabel('ALL')
		.setStyle(ButtonStyle.Primary);

	const clears = new ButtonBuilder()
		.setCustomId('cleared')
		.setLabel('CLEARS')
		.setStyle(ButtonStyle.Primary);

	const uncleared = new ButtonBuilder()
		.setCustomId('uncleared')
		.setLabel('NOT CLEARED')
		.setStyle(ButtonStyle.Primary);

	return {
		page: [backPage, currentPage, forwardPage],
		challenge: [challenge1, challenge2, challenge3],
		sheet: [sheet1, sheet2, sheet3],
		clears: [allStats, clears, uncleared],
	};
}

function createRows(buttons) {
	const pageRow = new ActionRowBuilder().addComponents(
		buttons.page[0],
		buttons.page[1],
		buttons.page[2],
	);

	const challengeRow = new ActionRowBuilder().addComponents(
		buttons.challenge[0],
		buttons.challenge[1],
		buttons.challenge[2],
	);

	const sheetRow = new ActionRowBuilder().addComponents(
		buttons.sheet[0],
		buttons.sheet[1],
		buttons.sheet[2],
	);

	const statsRow = new ActionRowBuilder().addComponents(
		buttons.clears[0],
		buttons.clears[1],
		buttons.clears[2],
	);

	return [pageRow, challengeRow, sheetRow, statsRow];
}

function updateRows(
	rows,
	buttons,
	embeds,
	clearOption,
	pageNumber,
	challengeNumber,
	sheetNumber,
) {
	// Adjust page row depending on the number of pages
	if (embeds[sheetNumber][challengeNumber].length > 2) {
		rows[0].setComponents(buttons.page[0], buttons.page[1], buttons.page[2]);
	} else {
		if (embeds[sheetNumber][challengeNumber].length === 1) {
			rows[0].setComponents(buttons.page[1]);
		} else {
			if (pageNumber === 0) {
				rows[0].setComponents(buttons.page[1], buttons.page[2]);
			} else {
				rows[0].setComponents(buttons.page[0], buttons.page[1]);
			}
		}
	}

	// Adjust challenge row depending on the number of challenges
	rows[1]
		.setComponents(
			buttons.challenge[0],
			buttons.challenge[1],
			buttons.challenge[2],
		)
		.components.forEach((button) => {
			if (button.data.custom_id !== 'challenge2') {
				button.setStyle(ButtonStyle.Primary).setDisabled(false);
			} else {
				button.setStyle(ButtonStyle.Secondary).setDisabled(true);
			}
		});

	if (embeds[sheetNumber].length <= 3) {
		if (embeds[sheetNumber].length === 1) {
			rows[1].components.shift();
			rows[1].components.pop();
		} else if (embeds[sheetNumber].length === 2) {
			if (challengeNumber === 0) {
				rows[1].components.shift();
			} else {
				rows[1].components.pop();
			}
		} else {
			if (challengeNumber === 0) {
				const movedButton = rows[1].components.shift();
				rows[1].components.push(movedButton);
			} else if (challengeNumber === 2) {
				const movedButton = rows[1].components.pop();
				rows[1].components.unshift(movedButton);
			}
		}

		rows[1].components.forEach((button) =>
			button.setStyle(ButtonStyle.Primary).setDisabled(false),
		);

		rows[1].components[challengeNumber]
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(true);
	}

	// Adjust sheet row depending on the number of sheets
	rows[2]
		.setComponents(buttons.sheet[0], buttons.sheet[1], buttons.sheet[2])
		.components.forEach((button) => {
			if (button.data.custom_id !== 'sheet2') {
				button.setStyle(ButtonStyle.Primary).setDisabled(false);
			} else {
				button.setStyle(ButtonStyle.Secondary).setDisabled(true);
			}
		});

	if (embeds.length <= 3) {
		if (embeds.length === 1) {
			rows[2].components.shift();
			rows[2].components.pop();
		} else if (embeds.length === 2) {
			if (sheetNumber === 0) {
				rows[2].components.shift();
			} else {
				rows[2].components.pop();
			}
		} else {
			if (sheetNumber === 0) {
				const movedButton = rows[2].components.shift();
				rows[2].components.push(movedButton);
			} else if (sheetNumber === 2) {
				const movedButton = rows[2].components.pop();
				rows[2].components.unshift(movedButton);
			}
		}

		rows[2].components.forEach((button) =>
			button.setStyle(ButtonStyle.Primary).setDisabled(false),
		);

		rows[2].components[sheetNumber]
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(true);
	}

	rows[3]
		.setComponents(buttons.clears[0], buttons.clears[1], buttons.clears[2])
		.components.forEach((button) => {
			if (button.data.custom_id !== clearOption) {
				button.setStyle(ButtonStyle.Primary).setDisabled(false);
			} else {
				button.setStyle(ButtonStyle.Secondary).setDisabled(true);
			}
		});

	return rows;
}

function updateLabels(
	buttons,
	embeds,
	pageNumber,
	challengeNumber,
	sheetNumber,
) {
	const pageLabel = `${pageNumber + 1}/${
		embeds[sheetNumber][challengeNumber].length
	}`;

	const challengeNames = [
		embeds[sheetNumber][
			challengeNumber === 0
				? embeds[sheetNumber].length - 1
				: challengeNumber - 1
		][0].fields[0].name,
		embeds[sheetNumber][challengeNumber][0].fields[0].name,
		embeds[sheetNumber][
			challengeNumber >= embeds[sheetNumber].length - 1
				? 0
				: challengeNumber + 1
		][0].fields[0].name,
	];

	let previousChallengeName, currentChallengeName, nextChallengeName;
	for (let i = 0; i < challengeNames.length; i++) {
		const splitName = challengeNames[i].split(':');
		const cleanName =
			splitName.length > 2
				? splitName[1].replaceAll('*', '')
				: splitName[0].replaceAll('*', '');

		switch (i) {
			case 0:
				previousChallengeName = cleanName;
				break;
			case 1:
				currentChallengeName = cleanName;
				break;
			case 2:
				nextChallengeName = cleanName;
		}
	}

	const sheetNames = [
		embeds[sheetNumber === 0 ? embeds.length - 1 : sheetNumber - 1][0][0]
			.description,
		embeds[sheetNumber][0][0].description,
		embeds[sheetNumber >= embeds.length - 1 ? 0 : sheetNumber + 1][0][0]
			.description,
	];

	let previousSheetName, currentSheetName, nextSheetName;
	for (let i = 0; i < sheetNames.length; i++) {
		const splitName = sheetNames[i].split(':');
		const cleanName =
			splitName.length > 2
				? splitName[1].replaceAll('*', '')
				: splitName[0].replaceAll('*', '');

		switch (i) {
			case 0:
				previousSheetName = cleanName;
				break;
			case 1:
				currentSheetName = cleanName;
				break;
			case 2:
				nextSheetName = cleanName;
		}
	}

	const labels = [
		pageLabel,
		previousChallengeName,
		currentChallengeName,
		nextChallengeName,
		previousSheetName,
		currentSheetName,
		nextSheetName,
	];

	buttons.page[1].setLabel(labels[0]);
	buttons.challenge[0].setLabel(labels[1]);
	buttons.challenge[1].setLabel(labels[2]);
	buttons.challenge[2].setLabel(labels[3]);
	buttons.sheet[0].setLabel(labels[4]);
	buttons.sheet[1].setLabel(labels[5]);
	buttons.sheet[2].setLabel(labels[6]);

	return labels;
}

module.exports = { createButtons, createRows, updateRows, updateLabels };
