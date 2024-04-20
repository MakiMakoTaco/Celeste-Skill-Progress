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

async function getMember(values, members, sheetName) {
	try {
		const memberInfo = values.find((username) => username[0] === sheetName);

		if (!memberInfo) return null;

		const member = members.find(
			(member) => member.user.username === memberInfo[1].toLowerCase(),
		);

		return member;
	} catch (error) {
		console.log(error);
	}
}

module.exports = { checkForms, getMember };
