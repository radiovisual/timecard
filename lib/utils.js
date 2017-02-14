import fs from 'fs';
import pendel from 'pendel';
import trim from 'trim';

/**
 * Read the json file with the timecard data and set Timecard state.
 *
 * @returns {*} Promise
 */
export function processTimeCardData() {
	const self = this;

	return new Promise((resolve, reject) => {
		self.getTimeCard().then(async data => {
			self.timecardData = JSON.parse(data);
			self.name = self.timecardData.project;
			self.shifts = self.timecardData.shifts;

			// reset to zero each time the timecard data is read
			self.totalSeconds = 0;

			if (Object.keys(self.shifts).length > 0) {
				// get the sortOrder of the shifts
				await getShiftOrder(self.shifts).then(response => {
					self.shiftOrder = response;
				});

				const lastShiftId = self.shiftOrder[self.shiftOrder.length - 1];

				// Check if there is a pending clockout
				const lastShift = self.shifts[lastShiftId];
				if (lastShift && lastShift.startTime && !lastShift.endTime) {
					self.clockoutIsPending = true;
					self.pendingClockoutIndex = lastShiftId;
				}

				// Count the number of seconds in all the shifts
				self.shiftOrder.forEach(shiftId => {
					const shift = self.shifts[shiftId];
					if (shift.startTime && shift.endTime) {
						self.totalSeconds += pendel.date(shift.startTime, shift.endTime).seconds;
					}
				});

				resolve(self.shifts);
			} else {
				self.shifts = {};
				resolve(self.timecardData);
			}
		}).catch(err => {
			reject(err);
		});
	});
}

/**
 * Get shiftOrder
 *
*/
export function getShiftOrder(obj) {
	return new Promise(resolve => {
		const sorted = Object.keys(obj).sort((a, b) => {
			var na = Number(a);
			var nb = Number(b);

			if (na > nb) {
				return 1;
			} else if (na < nb) {
				return -1;
			}
			return 0;
		});
		resolve(sorted);
	});
}

/**
 * Get a new shift object.
 *
 * @param {string} _message - an optional message to include on the shift
*/
export function getNewShift(_message) {
	let messages = [];

	let message = this.stringOrUndefined(_message);

	if (message) {
			messages.push(message);
	}

	const date = new Date();
	return {
		startTime: date.toString(),
		messages: messages
	};
}

export function stringOrUndefined(value) {
	if (!value) {
		return undefined;
	}

	if (typeof value === 'string') {
		const trimmed = trim(value);

		if (trimmed.length === 0) {
			return undefined;
		}
		return trimmed;
	}
}

/**
 * Get the next shift id.
 *
*/
export function getNextShiftId() {
	const self = this;

	const lastShiftId = self.shiftOrder.length > 0 ? parseInt(self.shiftOrder[self.shiftOrder.length - 1], 10) : 0;
	return lastShiftId + 1;
}

/**
 * Physically write the timecard data to the json file.
 *
 * @param {object} data - the json data to write
 * @param {string} path - the path to write the fileto
 */
export function writeTimeCard(data, path) {
	const self = this;
	if (!path) {
		path = self.filepath;
	}

	return new Promise((resolve, reject) => {
		fs.writeFile(path, data, err => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

/**
 * Read the .timecard.json file from disk and return its contents
 *
 * @returns {*} Promise
 */
export function getTimeCard() {
	const self = this;

	return new Promise((resolve, reject) => {
		fs.readFile(self.filepath, 'utf8', (err, data) => {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
}

/**
 * The blank .timecard.json value.
 */
export function blankTimecard(name) {
	const blank = {
		project: name,
		shifts: {},
		totals: {
			hours: 0,
			minutes: 0,
			seconds: 0
		}
	};
	return JSON.stringify(blank, null, 2);
}

/**
 * Check if .timecard.json is in a valid json format.
 *
 * @returns {*} Promise
 */
export function checkForValidTimecard() {
	const self = this;

	return new Promise(async resolve => {
		var data = await self.getTimeCard().catch(() => {
			resolve(false);
		});

		let json;

		try {
			json = JSON.parse(data);
		} catch (err) {
			resolve(false);
		}
		resolve(json && json.project && json.totals && json.shifts && true);
	});
}
