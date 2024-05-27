module.exports = (interaction) => {
	if (!interaction.isAutocomplete()) return;
	if (interaction.commandName !== 'map') return;

	const startOptions = [
		{ name: 'A-Side', value: '0, none' },
		{ name: 'B-Side', value: '1, none' },
		{ name: 'C-Side', value: '2, none' },
		{ name: 'Catstare', value: '3, none' },
		{ name: 'Active DLC', value: '4, none' },
		{ name: 'Archived', value: '5, none' },

		{ name: 'Bronze', value: '-1, bronze' },
		{ name: 'Silver', value: '-1, silver' },
		{ name: 'Gold', value: '-1, gold' },
		{ name: 'Amethyst', value: '-1, amethyst' },
		{ name: 'Ruby', value: '-1, ruby' },
		{ name: 'Diamond', value: '-1, diamond' },
		{ name: 'Frog', value: '-1, frog' },

		{ name: 'A-Side: Bronze', value: '0, bronze' },
		{ name: 'A-Side: Silver', value: '0, silver' },
		{ name: 'A-Side: Gold', value: '0, gold' },
		{ name: 'A-Side: Amethyst', value: '0, amethyst' },
		{ name: 'A-Side: Ruby', value: '0, ruby' },
		{ name: 'A-Side: Diamond', value: '0, diamond' },
		{ name: 'A-Side: Frog', value: '0, frog' },

		{ name: 'B-Side: Bronze', value: '1, bronze' },
		{ name: 'B-Side: Silver', value: '1, silver' },
		{ name: 'B-Side: Gold', value: '1, gold' },
		{ name: 'B-Side: Amethyst', value: '1, amethyst' },
		{ name: 'B-Side: Ruby', value: '1, ruby' },
		{ name: 'B-Side: Diamond', value: '1, diamond' },
		{ name: 'B-Side: Frog', value: '1, frog' },

		{ name: 'C-Side: Bronze', value: '2, bronze' },
		{ name: 'C-Side: Silver', value: '2, silver' },
		{ name: 'C-Side: Gold', value: '2, gold' },
		{ name: 'C-Side: Amethyst', value: '2, amethyst' },
		{ name: 'C-Side: Ruby', value: '2, ruby' },
		{ name: 'C-Side: Diamond', value: '2, diamond' },
		{ name: 'C-Side: Frog', value: '2, frog' },

		{ name: 'Catstare: Genesis', value: '3, genesis' },
		{ name: 'Catstare: Exodus', value: '3, exodus' },

		{ name: 'DLC: DLC 7', value: '4, dlc 7' },

		{ name: 'Archived: DLC 1', value: '5, dlc 1' },
		{ name: 'Archived: DLC 2', value: '5, dlc 2' },
		{ name: 'Archived: DLC 3', value: '5, dlc 3' },
		{ name: 'Archived: DLC 4', value: '5, dlc 4' },
		{ name: 'Archived: DLC 5', value: '5, dlc 5' },
		{ name: 'Archived: DLC 6', value: '5, dlc 6' },
	];

	const filteredChoices = startOptions.filter((option) =>
		option.name.toLowerCase().includes(interaction.options.getFocused()),
	);

	interaction.respond(filteredChoices.splice(0, 25));
};
