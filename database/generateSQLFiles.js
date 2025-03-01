require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { getSheetData } = require('./utils/checkSheets');
// const { getData } = require('./utils/checkSheets');
// const { checkForms } = require('./utils/checkForms');

function setupSQLFiles(filePath = path.join(__dirname, './sqlFiles')) {
	if (!fs.existsSync(filePath)) {
		fs.mkdirSync(filePath);
	}

	fs.writeFileSync(
		path.join(filePath, 'sides.sql'),
		'INSERT INTO `sides`(`name`, `type`) VALUES',
	);

	fs.writeFileSync(
		path.join(filePath, 'tiers.sql'),
		'INSERT INTO `tiers`(`name`, `color`, `color_plus`, `clears_for_rank`, `side_id`, `side_index`) VALUES',
	);

	fs.writeFileSync(
		path.join(filePath, 'mods.sql'),
		'INSERT INTO `mods`(`name`, `submitter_id`, `category`, `version`, `gb_page`, `gb_download_page`, `description`, `text`, `media`, `tags`, `feedback_instructions`, `notes`, `created_at`) VALUES',
	);

	fs.writeFileSync(
		path.join(filePath, 'mod_tiers.sql'),
		'INSERT INTO `mod_tiers`(`mod_id`, `tier_id`) VALUES',
	);

	fs.writeFileSync(
		path.join(filePath, 'download_links.sql'),
		'INSERT INTO `download_links`(`mod_id`, `order_index`, `file_name`, `file_size`, `description`, `manual_url`, `everest_url`) VALUES',
	);

	fs.writeFileSync(
		path.join(filePath, 'mod_requirements.sql'),
		'INSERT INTO `mod_requirements`(`mod_id`, `order_index`, `name`, `url`) VALUES',
	);

	fs.writeFileSync(
		path.join(filePath, 'mod_submitter.sql'),
		'INSERT INTO `mod_submitter`(`name`, `profile_url`, `avatar_url`) VALUES',
	);

	fs.writeFileSync(
		path.join(filePath, 'credit_groups.sql'),
		'INSERT INTO `credit_groups`(`mod_id`, `order_index`, `name`) VALUES',
	);

	fs.writeFileSync(
		path.join(filePath, 'authors.sql'),
		'INSERT INTO `authors`(`group_id`, `name`, `role_name`, `profile_url`, `extra_url`) VALUES',
	);

	fs.writeFileSync(
		path.join(filePath, 'players.sql'),
		'INSERT INTO `players`(`name`) VALUES',
	);

	fs.writeFileSync(
		path.join(filePath, 'player_progress.sql'),
		'INSERT INTO `players-progress`(`name`) VALUES',
	);
}
exports.setupSQLFiles = setupSQLFiles;

async function testGBAPI() {
	const requestOptions = {
		method: 'GET',
		redirect: 'follow',
	};

	const gbResult = await fetch(
		// If link == /Collection/[id] url = /Collection/[id]/Items and foreach item in "_aRecords" as well as profile page and get _sName else:
		'https://gamebanana.com/apiv11/Mod/554453/ProfilePage',
		requestOptions,
	);

	const jsonResult = await gbResult.json();

	console.log(jsonResult._aFiles[0]._sFile);

	/**
	 * optional all below just incase
	 *
	 * ._tsDateAdded, ._sProfileUrl(Mod Page), ._sName, ._sDownloadUrl(Downloads Page), ._sDescription, ._sText, ._sFeedbackInstructions, ._sVersion, ._aEmbeddedMedia
	 * ._aTags[foreach]: ._sValue //
	 * ._aCategory: ._sName
	 * ._aSubmitter: ._sName, ._sProfileUrl, ._sAvatarUrl
	 * ._aRequirements[foreach]: name: [0], link: [1]
	 * ._aFiles[foreach]: ._sFile(Downloaded file name), ._nFilesize, ._sDescription, ._sDownloadUrl
	 * ._aFiles._aModManagerIntegrations[0]: ._sDownloadUrl
	 * ._aCredits[foreach]: ._sGroupName
	 * ._aCredits._aAuthors[foreach]: ._sRole, ._sName, ._sProfileUrl, ._sUrl(external url like youtube)
	 */

	/**
	 * Get mod by name
	 */

	// fetch(
	// 	'https://gamebanana.com/apiv11/Game/6460/Subfeed?_csvModelInclusions=Mod&_nPage=1&_sName=Cat',
	// 	requestOptions,
	// )
	// 	.then((response) => response.text())
	// 	.then((result) => console.log(result))
	// 	.catch((error) => console.error(error));
}

// // Create Google Sheets API client
// const sheetsAPI = google.sheets({
// 	version: 'v4',
// 	auth: process.env.GOOGLE_API_KEY,
// });

// // Define the spreadsheet ID
// const spreadsheetId = '1XTAL3kgpX0bG6SBfznPX8z7Qdb7lGnQRuxeUfPZMFoU';

// // Define the fields to be fetched from the spreadsheet
// const spreadsheetFields =
// 	'sheets(properties(title,sheetId,index,gridProperties(rowCount,columnCount)),data.rowData.values(formattedValue,effectiveFormat.backgroundColor,note,hyperlink))';

async function generateSQLFiles() {
	// setupSQLFiles();

	console.log('Starting processing sheets');
	await getSheetData();
}

// async function main() {
// 	const data = await getData();
// }

// async function generateSQLFiles() {
// 	try {
// 		const mongoUri = process.env.MONGODB_URI;
// 		if (!mongoUri) {
// 			throw new Error('MONGODB_URI environment variable is not defined.');
// 		}
// 		await mongoose.connect(mongoUri);
// 		console.log('Connected to DB.');

// 		const users = await UserStats.find();
// 		const filePath = path.join(__dirname, './sqlFiles');

// 		if (!fs.existsSync(filePath)) {
// 			fs.mkdirSync(filePath);
// 		}

// 		// Generate SQL for players and player_progress
// 		const playerSQL = [];
// 		const playerProgressSQL = [];
// 		const sidesSQL = new Map();
// 		const tiersSQL = new Map();
// 		const mapsSQL = new Map();
// 		const mapTiersSQL = new Set();

// 		let playerId = 1;
// 		let progressId = 1;
// 		let mapId = 1;
// 		let tierId = 1;
// 		let sideId = 1;

// 		users.forEach((user) => {
// 			playerSQL.push(
// 				`INSERT INTO players(id, name) VALUES ('${playerId}', '${user.username}');`,
// 			);

// 			user.sheets.forEach((sheet) => {
// 				if (!sidesSQL.has(sheet.name)) {
// 					sidesSQL.set(sheet.name, sideId);
// 					sideId++;
// 				}

// 				sheet.challenges.forEach((challenge) => {
// 					const tierKey = `${challenge.name}-${sidesSQL.get(sheet.name)}`;
// 					if (!tiersSQL.has(tierKey)) {
// 						tiersSQL.set(tierKey, tierId);
// 						tierId++;
// 					}

// 					challenge.modStats.forEach((mod) => {
// 						if (!mapsSQL.has(mod.name)) {
// 							mapsSQL.set(mod.name, mapId);
// 							mapId++;
// 						}

// 						const mapTierKey = `${mapsSQL.get(mod.name)}-${tiersSQL.get(
// 							tierKey,
// 						)}`;
// 						if (!mapTiersSQL.has(mapTierKey)) {
// 							mapTiersSQL.add(mapTierKey);
// 						}

// 						playerProgressSQL.push(
// 							`INSERT INTO player_progress(id, player_id, map_id, cleared) VALUES ('${progressId}', '${playerId}', '${mapsSQL.get(
// 								mod.name,
// 							)}', '${mod.cleared}');`,
// 						);
// 						progressId++;
// 					});
// 				});
// 			});
// 			playerId++;
// 		});

// 		fs.writeFileSync(path.join(filePath, 'players.sql'), playerSQL.join('\n'));
// 		fs.writeFileSync(
// 			path.join(filePath, 'player_progress.sql'),
// 			playerProgressSQL.join('\n'),
// 		);

// 		const sidesSQLArray = Array.from(sidesSQL.entries()).map(
// 			([name, id]) =>
// 				`INSERT INTO sides(id, name) VALUES ('${id}', '${name}');`,
// 		);
// 		const tiersSQLArray = Array.from(tiersSQL.entries()).map(([key, id]) => {
// 			const [name, sideId] = key.split('-');
// 			return `INSERT INTO tiers(id, name, clears_for_rank, side_id, side_index) VALUES ('${id}', '${name}', '', '${sideId}', '${id}');`;
// 		});
// 		const mapsSQLArray = Array.from(mapsSQL.entries()).map(
// 			([name, id]) =>
// 				`INSERT INTO maps(id, name, download_link, notes) VALUES ('${id}', '${name}', '', '');`,
// 		);
// 		const mapTiersSQLArray = Array.from(mapTiersSQL).map((key) => {
// 			const [mapId, tierId] = key.split('-');
// 			return `INSERT INTO map_tiers(id, map_id, tier_id) VALUES ('${mapId}', '${mapId}', '${tierId}');`;
// 		});

// 		fs.writeFileSync(
// 			path.join(filePath, 'sides.sql'),
// 			sidesSQLArray.join('\n'),
// 		);
// 		fs.writeFileSync(
// 			path.join(filePath, 'tiers.sql'),
// 			tiersSQLArray.join('\n'),
// 		);
// 		fs.writeFileSync(path.join(filePath, 'maps.sql'), mapsSQLArray.join('\n'));
// 		fs.writeFileSync(
// 			path.join(filePath, 'map_tiers.sql'),
// 			mapTiersSQLArray.join('\n'),
// 		);

// 		// Generate SQL for submissions
// 		const formResponses = await checkForms();
// 		const submissionsSQL = [];

// 		formResponses.reverse().forEach((response, index) => {
// 			const playerName = response[0];
// 			const proof = response[1];
// 			const mapsString = response[2];

// 			if (mapsString) {
// 				const maps = mapsString.split(',').map((map) => map.trim());

// 				maps.forEach((map, mapIndex) => {
// 					submissionsSQL.push(
// 						`INSERT INTO submissions(id, player_id, map_id, proof, submitted_date) VALUES ('${
// 							index + 1 + mapIndex
// 						}', '${playerName}', '${map}', '${proof}', '${new Date().toISOString()}');`,
// 					);
// 				});
// 			}
// 		});

// 		fs.writeFileSync(
// 			path.join(filePath, 'submissions.sql'),
// 			submissionsSQL.join('\n'),
// 		);

// 		console.log('SQL files generated successfully.');
// 	} catch (error) {
// 		console.error('An error occurred:', error);
// 	} finally {
// 		mongoose.disconnect();
// 	}
// }

generateSQLFiles();
// testGBAPI();
