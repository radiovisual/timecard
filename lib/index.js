#!/usr/bin/env node
'use strict';
import objectAssign from 'object-assign';
import duration from 'pendel';
import validFile from 'valid-file';
import inquirer from 'inquirer';

// refactor these into one
import {errors} from './messages';
import {messages} from './messages';
import {summary} from './messages';
import {prettyprint} from './messages';

export default class TimeCard {
	/**
	 * Initilize a new Timecard
	 *
	 * @param {Object} options
	 * @api public
	 */

	constructor(options) {
		this.options = objectAssign({}, options);

		this.filepath = this.options.filepath || __dirname;
		this.hours = [];
		this.clockoutIsPending = false;
		this.pendingClockoutIndex = null;
		this.totalSeconds = 0;
		this.timecardData = null;
	}

	/**
	 * Create a blank timecard on `timecard new`
	 *
	 */

	async create() {
		var self = this;

		// First check to see if the file already exists
		if (validFile.sync(self.filepath)) {
			var question = [{
				type: 'confirm',
				name: 'eraseCard',
				message: 'A timecard file already exists. Do you want to erase it and start over?',
				default: false
			}];

			inquirer.prompt(question, answer => {
				if (answer.eraseCard === true) {
					self.writeTimeCard('[]').then(() => {
						self.reportSuccessfulNewTimeCard();
					});
				} else {
					process.exit();
				}
			});
		} else {
			self.writeTimeCard('[]').then(() => {
				self.reportSuccessfulNewTimeCard();
			});
		}
	}

	/**
	 * Clockin.
	 *
	 */

	async clockin() {
		const self = this;

		await self.getTimeCardData();
		await self.processTimeCardData();

		if (self.clockoutIsPending) {
			// refactor
			throw new Error(errors.clockOutIsPending);
		}
		const date = new Date().toString();

		const tc = {
			id: self.hours.length,
			date: date.slice(0, 15),
			startTime: date.slice(16, 24)
		};

		self.timecardData.push(tc);

		self.writeTimeCard(JSON.stringify(self.timecardData, null, 2)).then(() => {
			self.reportSuccessfulClockIn();
		});
	}

	/**
	 * Clockout.
	 *
	 */

	async clockout() {
		const self = this;

		await self.getTimeCardData();
		await self.processTimeCardData();

		if (self.clockoutIsPending) {
			const date = new Date().toString();

			self.hours[self.pendingClockoutIndex].endTime = date.slice(16, 24);

			// report the last 'shift' time and the total time to the console.
			const shiftSeconds = duration(self.hours[self.pendingClockoutIndex].startTime, self.hours[self.pendingClockoutIndex].endTime).seconds;
			self.clockoutSummary(shiftSeconds, self.totalSeconds + shiftSeconds);

			self.writeTimeCard(JSON.stringify(self.hours, null, 2)).then(() => {
				self.reportSuccessfulClockOut();
			});
		} else {
			// refactor
			throw new Error(errors.noClockInFound);
		}
	}

	/**
	 * Print the timecard data to the console.
	 *
	 */

	async print() {
		const self = this;

		await self.getTimeCardData();
		await self.processTimeCardData();

		console.log(messages.prettyPrintHeader);

		self.timecardData.map(item => {
			prettyprint(item);
		});

		console.log(messages.prettyPrintBorder);
		summary(self.totalSeconds);
	}
}

objectAssign(TimeCard.prototype, require('./utils.js'));
objectAssign(TimeCard.prototype, require('./messages.js'));
