function updateLabels(
	embeds,
	pageNumber,
	challengeNumber,
	sheetNumber,
	currentPage,
	previousChallenge,
	currentChallenge,
	nextChallenge,
	previousSheet,
	currentSheet,
	nextSheet,
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

	currentPage.setLabel(labels[0]);
	previousChallenge.setLabel(labels[1]);
	currentChallenge.setLabel(labels[2]);
	nextChallenge.setLabel(labels[3]);
	previousSheet.setLabel(labels[4]);
	currentSheet.setLabel(labels[5]);
	nextSheet.setLabel(labels[6]);

	return labels;
}

module.exports = updateLabels;
