import fs from 'fs';
import pendel from 'pendel';
import trim from 'trim';

/**
 * Count the Total Seconds in all the shifts
 * @param {object} shifts - the shifts object you want to check
 */
 export function getTotalSeconds(shifts) {
   let seconds = 0;
   Object.keys(shifts).forEach(shiftId => {
     const shift = shifts[shiftId];
     if (shift.startTime && shift.endTime) {
       seconds += pendel.date(shift.startTime, shift.endTime).seconds;
     }
   });
	return seconds;
 }

/**
 * Check for a pending clockout.
 * @param {object} shifts - The shifts object you want to check
 * @returns {string|undefined}
 */
 export function getPendingClockoutId(shifts) {
   const pendingIds = Object.keys(shifts).filter(shiftId => {
     const shift = shifts[shiftId];
     return shift.startTime && !shift.endTime;
   });

   if (pendingIds.length > 0) {
     return pendingIds.pop();
   }
   return undefined;
 }

/**
 * Get an array of shift ids in order
 * @param {object} shifts - The shifts object you want to order
*/
export function getShiftOrder(shifts) {
  return Object.keys(shifts).sort((a, b) => {
    return parseInt(a, 10) - parseInt(b, 10);
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

/**
 * Get a trimmed string or undefined.
 *
 * @param {string|undefined} value - The value to check for string or undefined.
 * @returns {number}
*/
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
 * @param {object} timecard - The timecard object to use.
 * @returns {number}
*/
export function getNextShiftId(timecard) {
	const self = timecard;

	const lastShiftId = self.shiftOrder.length > 0 ? parseInt(self.shiftOrder[self.shiftOrder.length - 1], 10) : 0;
	return lastShiftId + 1;
}

/**
 * Physically write the timecard data to the json file.
 *
 * @param {string} path - the path to write the file to
 * @param {object} data - the json data to write
 */
export function writeTimeCard(path, data) {
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
 * @param {string} filepath - the filepath to look for a timecard file.
 * @returns {*} Promise
 */
export function getTimeCard(filepath) {
  let timecardData = this.blankTimecard(filepath);

  return new Promise((resolve, reject) => {
    try {
      timecardData = fs.readFileSync(filepath, 'utf8');
    } catch (err) {
      if (err.code !== 'ENOENT') {
        reject(err);
      }
    }
    resolve(timecardData);
	});
}

/**
 * Get a blank timecard object.
 *
 * @param {string} name - the project name to feed the timecard object
 * @returns {string}
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
export function isTimeCardValid(timecardJson) {
  let data;

  if (typeof timecardJson === 'string') {
    try {
      data = JSON.parse(timecardJson);
    } catch (err) {
      return false;
    }
  }

  if (typeof timecardJson === 'object') {
    data = timecardJson;
  }

  return data.project && data.shifts && data.totals && true;
}

/**
 * Create a Timecard object for saving.
 *
 * @param {object} timecard - the Timecard instance
 * @returns {string}
 */
 export function getTimecardString(timecard) {
   const obj = {
     project: timecard.name,
     shifts: timecard.shifts || {},
     totals: timecard.totals || {hours: 0, minutes: 0, seconds: 0}
   };
   return JSON.stringify(obj, null, 2);
 }
