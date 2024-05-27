module.exports = (interaction) => {
	if (!interaction.isAutocomplete()) return;
	if (interaction.commandName !== 'user') return;

	const startOptions = [
		{ name: 'A-Side: Bronze', value: '0, 0' },
		{ name: 'A-Side: Silver', value: '0, 1' },
		{ name: 'A-Side: Gold', value: '0, 2' },
		{ name: 'A-Side: Amethyst', value: '0, 3' },
		{ name: 'A-Side: Ruby', value: '0, 4' },
		{ name: 'A-Side: Diamond', value: '0, 5' },
		{ name: 'A-Side: Frog', value: '0, 6' },

		{ name: 'B-Side: Bronze', value: '1, 0' },
		{ name: 'B-Side: Silver', value: '1, 1' },
		{ name: 'B-Side: Gold', value: '1, 2' },
		{ name: 'B-Side: Amethyst', value: '1, 3' },
		{ name: 'B-Side: Ruby', value: '1, 4' },
		{ name: 'B-Side: Diamond', value: '1, 5' },
		{ name: 'B-Side: Frog', value: '1, 6' },

		{ name: 'C-Side: Bronze', value: '2, 0' },
		{ name: 'C-Side: Silver', value: '2, 1' },
		{ name: 'C-Side: Gold', value: '2, 2' },
		{ name: 'C-Side: Amethyst', value: '2, 3' },
		{ name: 'C-Side: Ruby', value: '2, 4' },
		{ name: 'C-Side: Diamond', value: '2, 5' },
		{ name: 'C-Side: Frog', value: '2, 6' },

		{ name: 'Catstare: Genesis', value: '3, 0' },
		{ name: 'Catstare: Exodus', value: '3, 1' },

		{ name: 'DLC: DLC 7', value: '4, 0' },

		{ name: 'Archived: DLC 1', value: '5, 0' },
		{ name: 'Archived: DLC 2', value: '5, 1' },
		{ name: 'Archived: DLC 3', value: '5, 2' },
		{ name: 'Archived: DLC 4', value: '5, 3' },
		{ name: 'Archived: DLC 5', value: '5, 4' },
		{ name: 'Archived: DLC 6', value: '5, 5' },
	];

	const filteredChoices = startOptions.filter((option) =>
		option.name.toLowerCase().includes(interaction.options.getFocused()),
	);

	interaction.respond(filteredChoices.splice(0, 25));
};
