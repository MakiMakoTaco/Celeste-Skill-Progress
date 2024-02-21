// Convert column letter to number (e.g., 'A' => 1, 'Z' => 26, 'AA' => 27)
function columnToNumber(column) {
	let result = 0;
	for (let i = 0; i < column.length; i++) {
		result = result * 26 + column.charCodeAt(i) - 64;
	}
	return result;
}

// Convert column number to letter (e.g., 1 => 'A', 26 => 'Z', 27 => 'AA')
function numberToColumn(number) {
	let result = '';
	while (number > 0) {
		let remainder = (number - 1) % 26;
		result = String.fromCharCode(65 + remainder) + result;
		number = Math.floor((number - 1) / 26);
	}
	return result;
}

module.exports = { columnToNumber, numberToColumn };
