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

async function getMember(values, members, sheetName) {
	try {
		const memberInfo = values.find((username) => username[0] === sheetName);
		const username = memberInfo[1].toLowerCase();

		if (!memberInfo) return [null, null];

		let member = members.find((member) => member.user.username === username);

		if (!member) {
			member = members.find((member) => member.nickname === memberInfo[1]);
		}

		return [member, memberInfo[1]];
	} catch (error) {
		console.error(error);
	}
}

module.exports = {
	checkForms,
	getSubmissionStatus,
	getMember,
};
