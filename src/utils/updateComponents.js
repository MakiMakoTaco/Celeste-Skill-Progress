const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

function createButtons(pageNumber, challengeNumber, sheetNumber, embeds) {
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
	const backChallenge = new ButtonBuilder()
		.setCustomId('backChallenge')
		.setLabel('PREVIOUS CHALLENGE')
		.setStyle(ButtonStyle.Primary);

	const currentChallenge = new ButtonBuilder()
		.setCustomId('currentChallenge')
		.setLabel('CURRENT CHALLENGE')
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(true);

	const forwardChallenge = new ButtonBuilder()
		.setCustomId('forwardChallenge')
		.setLabel('NEXT CHALLENGE')
		.setStyle(ButtonStyle.Primary);

	// Sheet buttons
	const backSheet = new ButtonBuilder()
		.setCustomId('backSheet')
		.setLabel('PREVIOUS SHEET')
		.setStyle(ButtonStyle.Primary);

	const currentSheet = new ButtonBuilder()
		.setCustomId('currentSheet')
		.setLabel('CURRENT SHEET')
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(true);

	const forwardSheet = new ButtonBuilder()
		.setCustomId('forwardSheet')
		.setLabel('NEXT SHEET')
		.setStyle(ButtonStyle.Primary);

	return {
		page: [backPage, currentPage, forwardPage],
		challenge: [backChallenge, currentChallenge, forwardChallenge],
		sheet: [backSheet, currentSheet, forwardSheet],
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

	return { pageRow, challengeRow, sheetRow };
	// setComponents(pageRow, challengeRow, sheetRow);
}

function updateRows(
	rows,
	buttons,
	embeds,
	pageNumber,
	challengeNumber,
	sheetNumber,
	oldSheetNumber,
) {
	// Adjust page row depending on the number of pages
	if (embeds[sheetNumber][challengeNumber].length > 2) {
		rows.pageRow.setComponents(
			buttons.page[0],
			buttons.page[1],
			buttons.page[2],
		);
	} else {
		if (embeds[sheetNumber][challengeNumber].length === 1) {
			rows.pageRow.setComponents(buttons.page[1]);
		} else {
			if (pageNumber === 0) {
				rows.pageRow.setComponents(buttons.page[1], buttons.page[2]);
			} else {
				rows.pageRow.setComponents(buttons.page[0], buttons.page[1]);
			}
		}
	}

	// Adjust challenge row depending on the number of challenges
	if (embeds[sheetNumber].length !== 3 || oldSheetNumber !== sheetNumber) {
		rows.challengeRow
			.setComponents(
				buttons.challenge[0],
				buttons.challenge[1],
				buttons.challenge[2],
			)
			.components.forEach((button) => {
				if (button.data.custom_id !== 'currentChallenge') {
					button.setStyle(ButtonStyle.Primary).setDisabled(false);
				} else {
					button.setStyle(ButtonStyle.Secondary).setDisabled(true);
				}
			});
	}

	if (embeds[sheetNumber].length <= 3) {
		if (embeds[sheetNumber].length === 1) {
			rows.challengeRow.components.shift().pop();
		} else if (embeds[sheetNumber].length === 2) {
			rows.challengeRow.components.shift();

			if (oldSheetNumber === sheetNumber) {
				rows.challengeRow.components.reverse();
			}
		} else {
			if (challengeNumber === 0) {
				rows.challengeRow.components.shift();
				rows.challengeRow.components.push(buttons.challenge[0]);
			} else if (challengeNumber === 2) {
				rows.challengeRow.components.pop();
				rows.challengeRow.components.unshift(buttons.challenge[2]);
			}
		}

		rows.challengeRow.components.forEach((button) =>
			button.setStyle(ButtonStyle.Primary).setDisabled(false),
		);

		rows.challengeRow.components[challengeNumber]
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(true);
	}

	return rows;
}

function updateLabels(
	embeds,
	pageNumber,
	challengeNumber,
	sheetNumber,
	buttons,
	// currentPage,
	// previousChallenge,
	// currentChallenge,
	// nextChallenge,
	// previousSheet,
	// currentSheet,
	// nextSheet,
) {
	const pageLabel = `${pageNumber + 1}/${
		embeds[sheetNumber][challengeNumber].length
	}`;

	const challengeNames = [
		embeds[sheetNumber][
			challengeNumber <= 0
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
		embeds[sheetNumber <= 0 ? embeds.length - 1 : sheetNumber - 1][0][0]
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

	// currentPage.setLabel(labels[0]);
	// previousChallenge.setLabel(labels[1]);
	// currentChallenge.setLabel(labels[2]);
	// nextChallenge.setLabel(labels[3]);
	// previousSheet.setLabel(labels[4]);
	// currentSheet.setLabel(labels[5]);
	// nextSheet.setLabel(labels[6]);

	return labels;
}

module.exports = { createButtons, createRows, updateRows, updateLabels };
