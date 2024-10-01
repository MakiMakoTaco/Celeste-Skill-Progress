module.exports = (interaction) => {
	if (!interaction.isAutocomplete()) return;
	if (interaction.commandName !== 'edit-roles') return;

	const startOptions = [
		// { name: 'A-Side', value: this.name.toLowerCase() },
		// { name: 'B-Side', value: '1, none' },
		// { name: 'C-Side', value: '2, none' },
		// { name: 'Catstare', value: '3, none' },
		// { name: 'Active DLC', value: '4, none' },
		// { name: 'Archived', value: '5, none' },

		// { name: 'Bronze', value: '-1, bronze' },
		// { name: 'Silver', value: '-1, silver' },
		// { name: 'Gold', value: '-1, gold' },
		// { name: 'Amethyst', value: '-1, amethyst' },
		// { name: 'Ruby', value: '-1, ruby' },
		// { name: 'Diamond', value: '-1, diamond' },
		// { name: 'Frog', value: '-1, frog' },

		{ name: 'A-Side: Bronze', value: 'a-side: bronze' },
		{ name: 'A-Side: Silver', value: 'a-side: silver' },
		{ name: 'A-Side: Gold', value: 'a-side: gold' },
		{ name: 'A-Side: Amethyst', value: 'a-side: amethyst' },
		{ name: 'A-Side: Ruby', value: 'a-side: ruby' },
		{ name: 'A-Side: Diamond', value: 'a-side: diamond' },
		{ name: 'A-Side: Frog', value: 'a-side: frog' },

		{ name: 'B-Side: Bronze', value: 'b-side: bronze' },
		{ name: 'B-Side: Silver', value: 'b-side: silver' },
		{ name: 'B-Side: Gold', value: 'b-side: gold' },
		{ name: 'B-Side: Amethyst', value: 'b-side: amethyst' },
		{ name: 'B-Side: Ruby', value: 'b-side: ruby' },
		{ name: 'B-Side: Diamond', value: 'b-side: diamond' },
		{ name: 'B-Side: Frog', value: 'b-side: frog' },

		{ name: 'C-Side: Bronze', value: 'c-side: bronze' },
		{ name: 'C-Side: Silver', value: 'c-side: silver' },
		{ name: 'C-Side: Gold', value: 'c-side: gold' },
		{ name: 'C-Side: Amethyst', value: 'c-side: amethyst' },
		{ name: 'C-Side: Ruby', value: 'c-side: ruby' },
		{ name: 'C-Side: Diamond', value: 'c-side: diamond' },
		{ name: 'C-Side: Frog', value: 'c-side: frog' },

		{ name: 'Catstare: Genesis', value: 'catstare: genesis' },
		{ name: 'Catstare: Exodus', value: 'catstare: exodus' },

		{ name: 'DLC: DLC 7', value: 'dlc 7' },
		{ name: 'DLC: DLC 8', value: 'dlc 8' },

		{ name: 'Archived: DLC 1', value: 'dlc 1' },
		{ name: 'Archived: DLC 2', value: 'dlc 2' },
		{ name: 'Archived: DLC 3', value: 'dlc 3' },
		{ name: 'Archived: DLC 4', value: 'dlc 4' },
		{ name: 'Archived: DLC 5', value: 'dlc 5' },
		{ name: 'Archived: DLC 6', value: 'dlc 6' },
	];

	const filteredChoices = startOptions.filter((option) =>
		option.name
			.toLowerCase()
			.includes(interaction.options.getFocused().toLowerCase()),
	);

	interaction.respond(filteredChoices.splice(0, 25));
};
