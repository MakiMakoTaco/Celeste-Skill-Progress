// const { shoutouts } = require('../../utils/shoutouts');

// module.exports = async (client) => {
// 	if (client.user.id === '1207183419096961074') {
// 		let isRunning = false;

// 		const runShoutouts = async () => {
// 			if (isRunning) return; // Prevent overlapping
// 			isRunning = true;

// 			try {
// 				await shoutouts(client); // Ensure async completion
// 			} catch (error) {
// 				console.error('Error in shoutouts:', error);
// 			} finally {
// 				isRunning = false; // Unlock after execution
// 			}
// 		};

// 		// Run immediately and then schedule the interval
// 		runShoutouts();
// 		setInterval(runShoutouts, 1000 * 60 * 60); // 1 hour
// 	}
// };
