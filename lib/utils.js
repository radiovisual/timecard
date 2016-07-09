'use strict';
import fs from 'fs';
import duration from 'pendel';
import sort from 'lodash.sortby';
import happyAsJson from 'happy-json';
// import {errors} from './messages.js';

// help node 0.10 with Promises
require('native-promise-only');

/**
 * Read the json file with the timecard data and set Timecard state.
 *
 * @returns {*} Promise
 */
export function processTimeCardData() {
	const self = this;

	return new Promise((resolve, reject) => {
		self.getTimeCard().then(data => {
			self.timecardData = JSON.parse(data);
			self.name = self.timecardData.name;
			const shifts = self.timecardData.shifts;

			// reset to zero each time the timecard data is read
			self.totalSeconds = 0;

			if (shifts.length > 0) {
				self.shifts = sort(shifts, shift => {
					return shift.id;
				});

				const lastShift = self.shifts[self.shifts.length - 1];
				if (lastShift && lastShift.startTime && !lastShift.endTime) {
					self.clockoutIsPending = true;
					self.pendingClockoutIndex = lastShift.id;
				}
				self.shifts.forEach(item => {
					if (item.startTime && item.endTime) {
						self.totalSeconds += duration(item.startTime, item.endTime).totalSeconds;
					}
				});
				resolve(self.shifts);
			} else {
				self.shifts = [];
				resolve(self.timecardData);
			}
		}).catch(err => {
			reject(err);
		});
	});
}

/**
 * Physically write the timecard data to the json file.
 *
 * @param {object} data - the json data to write
 */
export function writeTimeCard(data) {
	const self = this;

	return new Promise((resolve, reject) => {
		fs.writeFile(self.filepath, data, err => {
			if (err) {
				reject(err);
			}
			resolve();
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
	return `{\n  "project": "${name}",\n  "shifts": [],\n  "totals": {\n    "hours": 0,\n    "minutes": 0,\n    "seconds": 0\n  }\n}`;
}

/**
 * Check if .timecard.json is in a valid json format.
 */
export function checkForValidTimecard() {
	this.getTimeCard().then(data => {
		return happyAsJson(data);
	}).catch(() => {
		return false;
	});
}
