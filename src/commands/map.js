const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const processSheets = require('../utils/processSheets');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('map')
		.setDescription('Find a map')
		.addSubcommand((search) =>
			search
				.setName('search')
				.setDescription(
					'Searches for a specific map or maps including a phrase',
				)
				.addStringOption((name) =>
					name
						.setName('name')
						.setDescription('The name of the map or included in the map name')
						.setRequired(true),
				)
				.addBooleanOption((strict) =>
					strict
						.setName('strict')
						.setDescription(
							'Sets if the search results look for an exact match or allow any map that includes the name',
						)
						.setRequired(true),
				),
		)
		.addSubcommand(
			(random) =>
				random
					.setName('random')
					.setDescription('Randomly picks a map')
					.addStringOption((archived) =>
						archived
							.setName('archived')
							.setDescription('Wether or not to include archived maps')
							.addChoices(
								{ name: 'Include', value: 'true' },
								{ name: 'Exclude', value: 'false' },
							)
							.setRequired(false),
					),
			// .addStringOption((filters) =>
			// 	filters
			// 		.setName('filters')
			// 		.setDescription('A specific filter to apply to the random selector') // allow multiple in the future
			// 		.setAutocomplete(true),
			// ),
		),

	run: async ({ interaction }) => {
		async function getSheets() {
			try {
				const sheet = await processSheets.findMaps();
				return sheet;
			} catch (error) {
				console.error(error);
				interaction.editReply(
					`There was an error processing the spreadsheet: ${error.message}. Please try again in a few minutes and if the issue persists then contact \`hyrulemaki\` with the error message.`,
				);
				throw error;
			}
		}

		await interaction.deferReply();

		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'search') {
			const name = interaction.options
				.getString('name')
				.toLowerCase()
				.replaceAll('&', 'and');
			const strict = interaction.options.getBoolean('strict');

			await interaction.editReply(
				`Searching for ${
					strict ? 'a map called' : 'maps containing the name'
				} ${name}...`,
			);

			const sheets = await getSheets();

			let mapResults = [];
			if (strict) {
				for (let i = 0; i < sheets[0].length; i++) {
					mapResults.push(
						...sheets[0][i].filter((item) =>
							item.mapName.toLowerCase().replaceAll('&', 'and').includes(name),
						),
					);
				}
			} else {
				for (let i = 0; i < sheets[0].length; i++) {
					mapResults.push(
						...sheets[0][i].filter((item) =>
							item.mapName.toLowerCase().replaceAll('&', 'and').includes(name),
						),
					);
				}
			}

			const mapFields = [];
			if (mapResults && mapResults.length > 0) {
				const uniqueMapResults = [];
				const mapNamesSet = new Set();

				mapResults.forEach((map) => {
					const mapNameLowerCase = map.mapName.toLowerCase();
					if (!mapNamesSet.has(mapNameLowerCase)) {
						mapNamesSet.add(mapNameLowerCase);

						// Check if there are multiple locations for the same mapName
						const duplicateMaps = mapResults.filter(
							(otherMap) =>
								otherMap.mapName.toLowerCase() === mapNameLowerCase &&
								otherMap !== map,
						);

						if (duplicateMaps.length > 0) {
							// Concatenate locations for duplicates
							const allLocations = [
								map.sheetName,
								...duplicateMaps.map((dupMap) => dupMap.sheetName),
							].join(' | ');
							const allCategories = [
								map.category,
								...duplicateMaps.map((dupMap) => dupMap.category),
							].join(' | ');

							uniqueMapResults.push({
								mapName: map.mapName,
								sheetName: allLocations,
								category: allCategories, // Assuming the category is the same for duplicates
								hyperlink: map.hyperlink, // Assuming the hyperlink is the same for duplicates
							});
						} else {
							// If no duplicates, add the map as is
							uniqueMapResults.push(map);
						}
					}
				});

				uniqueMapResults.forEach((map) => {
					mapFields.push({
						name: `${map.mapName} found in ${
							map.sheetName.includes(' | ')
								? `${map.sheetName.split(' | ').length} locations: ${
										map.sheetName.split(' | ')[0]
								  } under the ${
										map.category.split(' | ')[0]
								  } challenge and in ${
										map.sheetName.split(' | ')[1]
								  } under the ${map.category.split(' | ')[1]} challenge`
								: `${map.sheetName} under the ${map.category} challenge`
						}:`,
						value: map.hyperlink || 'unable to retrieve link\n',
					});
				});

				const mapEmbed = new EmbedBuilder()
					.setTitle(`Search results for ${name}`)
					.setFields(mapFields);
				interaction.editReply({ content: null, embeds: [mapEmbed] });
			} else {
				interaction.editReply(
					`No results found for ${name}, make sure you are spelling the name correctly.`,
				);
			}
		} else if (subcommand === 'random') {
			const archived = interaction.options?.getString('archived') || 'false';
			// const filter = filter

			const sheetResultsArray = await getSheets();

			const sheetResults = sheetResultsArray[0] || [];

			if (sheetResults.length > 0) {
				const filteredSheetsLength =
					archived === 'true' ? sheetResults.length : sheetResults.length - 1;
				let totalMaps = 0;

				for (let i = 0; i < filteredSheetsLength; i++) {
					totalMaps += sheetResults[i].length;
				}

				let randomMap;
				const mapFields = [];
				// Randomly select a map from the results
				let randomIndex = Math.floor(Math.random() * totalMaps);

				console.log(
					archived,
					filteredSheetsLength,
					sheetResults.length,
					totalMaps,
					randomIndex,
				);

				for (let i = 0; i < filteredSheetsLength; i++) {
					if (randomIndex > sheetResults[i].length) {
						randomIndex -= sheetResults[i].length;
					} else {
						randomMap = sheetResults[i][randomIndex];
						break;
					}
				}

				mapFields.push({
					name: `This map is found in ${randomMap.sheetName} under the ${randomMap.category} challenge (row ${randomMap.rowNumber}):`,
					value: randomMap.hyperlink || 'Unable to retrieve link\n',
				});

				const mapEmbed = new EmbedBuilder()
					.setTitle(`The random map is: ${randomMap.mapName}`)
					.setFields(mapFields);
				interaction.editReply({ content: null, embeds: [mapEmbed] });
			} else {
				interaction.editReply(
					`Error finding a random map, please try again in a few minutes.`,
				);
			}
		}
	},
};
