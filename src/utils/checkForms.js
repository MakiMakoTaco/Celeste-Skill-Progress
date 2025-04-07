const { google } = require('googleapis');
const credentials = require('../../csrCredentials.json');

async function checkForms() {
	// Create a new instance of the Google Sheets API client
	const googleClient = await google.auth.getClient({
		credentials,
		scopes: ['https://www.googleapis.com/auth/spreadsheets'],
	});

	// Create a new instance of the Google Sheets API
	const sheets = google.sheets({ version: 'v4', auth: googleClient });

	const response = await sheets.spreadsheets.values.get({
		spreadsheetId: process.env.RESPONSE_SHEET_ID,
		range: 'Form Responses 1!B:C', // B and C column of sheet 1, preferably [last saved row] to last row
		majorDimension: 'ROWS',
	});

	const values = response.data.values;
	return values.reverse();
}

async function getSubmissionStatus() {
	// Create a new instance of the Google Sheets API client
	const googleClient = await google.auth.getClient({
		credentials,
		scopes: ['https://www.googleapis.com/auth/spreadsheets'],
	});

	// Create a new instance of the Google Sheets API
	const sheets = google.sheets({ version: 'v4', auth: googleClient });

	const response = await sheets.spreadsheets.values.batchGet({
		spreadsheetId: process.env.RESPONSE_SHEET_ID,
		ranges: ['Form Responses 1', 'acceptance_status'], // Get all values from both submission sheets
		majorDimension: 'ROWS',
	});

	const submissionValues = response.data.valueRanges[0].values;
	const acceptanceValues = response.data.valueRanges[1].values;

	return [submissionValues, acceptanceValues];
}

async function getMember(values, guild, sheetName) {
	try {
		const memberInfo = values.find((username) => username[0] === sheetName);
		if (!memberInfo) return [null, null];

		const username = memberInfo[1];

		// Attempt to find the member in the cache by username or displayName
		let member = guild.members.cache.find(
			(member) =>
				member.user.username.toLowerCase() === username.toLowerCase() ||
				member.displayName === username,
		);

		// console.log(member, username);

		// if (member) {
		// 	const exactMember = fetchedMembers.find(
		// 		(member) =>
		// 			member.user.username.toLowerCase() === username ||
		// 			member.displayName.toLowerCase() === username,
		// 	);

		// 	member = exactMember || null;
		// }

		// If not found in cache, fetch from the API
		if (!member) {
			try {
				const fetchedMembers = await guild.members.fetch({ query: username });
				member =
					fetchedMembers.find(
						(member) =>
							member.user.username.toLowerCase() === username.toLowerCase() ||
							member.displayName === username,
					) || null;
			} catch (error) {
				console.error(error);
				member = null;
			}
		}

		return [member, username];
	} catch (error) {
		console.error(error);
		return [null, null];
	}
}

module.exports = {
	checkForms,
	getSubmissionStatus,
	getMember,
};
