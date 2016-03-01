'use strict';
import fs from 'fs';
import duration from 'pendel';
import sort from 'lodash.sortby';

// help node 0.10 with Promises
require('native-promise-only');

/**
 * Read the json file with the timecard data and set Timecard state.
 *
 * @returns {*} Promise
 */

export function getTimeCardData() {
	const self = this;

	return new Promise(function (resolve, reject) {
		fs.readFile(self.filepath, 'utf8', (err, data) => {
			if (err) {
				reject(err);
			} else {
				const json = JSON.parse(data);

				// reset to zero each time the timecard data is read
				self.totalSeconds = 0;

				if (json.length > 0) {
					self.timecardData = sort(json, shift => {
						return shift.id;
					});

					const lastShift = self.timecardData[self.timecardData.length - 1];
					if (lastShift.hasOwnProperty('startTime') && lastShift.hasOwnProperty('endTime') === false) {
						self.clockoutIsPending = true;
						self.pendingClockoutIndex = lastShift.id;
					}
					self.timecardData.map(item => {
						if (item.hasOwnProperty('startTime') && item.hasOwnProperty('endTime')) {
							self.totalSeconds += duration(item.startTime, item.endTime).totalSeconds;
						}
					});
					resolve(self.timecardData);
				} else {
					self.timecardData = [];
					resolve(self.timecardData);
				}
			}
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

