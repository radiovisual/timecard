'use strict';
import fs from 'fs';
import duration from 'pendel';

/**
 * Record the times and look for conditions on the timecard data.
 *
 * @param timeCardData
 * @returns {*} Promise
 */

export async function processTimeCardData(timeCardData) {
	const self = this;

	return await Promise.all(timeCardData.map((item, index) => {
		return new Promise(resolve => {
			if (item.hasOwnProperty('startTime') && !item.hasOwnProperty('endTime')) {
				self.clockoutIsPending = true;
				self.pendingClockoutIndex = index;
			}

			// get the number of seconds for all completed timecard sessions
			if (item.hasOwnProperty('startTime') && item.hasOwnProperty('endTime')) {
				self.totalSeconds += duration(item.startTime, item.endTime).totalSeconds;
			}

			self.hours.push(item);
			resolve(timeCardData);
		});
	}));
}

/**
 * Read the json file with the timecard data.
 *
 * @param filepath - the filepath to search for the timecard data
 * @returns {*} Promise
 */

export async function getTimeCardData() {
	const self = this;

	return new Promise(function (resolve, reject) {
		fs.readFile(self.filepath, 'utf8', (err, data) => {
			if (err) {
				reject(err);
			} else {
				resolve(JSON.parse(data));
				self.timecardData = data;
			}
		});
	});
}

/**
 * Physically write the timecard data to the json file.
 *
 * @param {object} data - the json data to write
 */

export async function writeTimeCard(data) {
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
