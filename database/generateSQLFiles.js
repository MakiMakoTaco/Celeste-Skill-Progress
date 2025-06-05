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

	fs.writeFileSync(path.join(filePath, 'no_gb_mods.txt'), '');

	fs.writeFileSync(
		path.join(filePath, 'sides.sql'),
		`INSERT INTO \`sides\`(\`id\`, \`name\`, \`type\`) VALUES

(1, 'A-Side', 'standard')
(2, 'B-Side', 'standard')
(3, 'C-Side', 'standard')
(4, 'D-Side', 'standard')

(1000, 'Catstare', 'catstare')

(1001, 'DLC', 'dlc')
(1002, 'Archived', 'other')`,
	);

	fs.writeFileSync(
		path.join(filePath, 'tiers.sql'),
		'INSERT INTO `tiers`(`id`, `name`, `color`, `color_plus`, `clears_for_rank`, `side_id`, `side_index`) VALUES',
	);

	fs.writeFileSync(
		path.join(filePath, 'mods.sql'),
		'INSERT INTO `mods`(`id`, `name`, `gb_name`, `is_child`, `parent_id`, `submitter_id`, `category`, `version`, `gb_page`, `gb_download_page`, `description`, `text`, `media`, `tags`, `feedback_instructions`, `notes`, `created_at`) VALUES',
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
		'INSERT INTO `mod_submitter`(`id`, `name`, `profile_url`, `avatar_url`) VALUES',
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
		'INSERT INTO `players`(`id`, `name`) VALUES',
	);

	fs.writeFileSync(
		path.join(filePath, 'player_progress.sql'),
		'INSERT INTO `player_progress`(`player_id`, `mod_id`, `cleared`, `proof`, `submitted_at`) VALUES',
	);
}

async function generateSQLFiles() {
	setupSQLFiles();

	console.log('Starting processing sheets');
	await getSheetData();

	console.log('Finished processing sheets and generating SQL files');
}

// async function testGBAPI() {
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
// }

generateSQLFiles();
