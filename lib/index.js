import {eraseThenCreatePrompt, createPrompt} from './prompts.js';
import objectAssign from 'object-assign';
import convert from 'convert-seconds';
import validFile from 'valid-file';
import inquirer from 'inquirer';
import duration from 'pendel';
import path from 'path';

// help node 0.10 with Promises
require('native-promise-only');

export default class TimeCard {
	/**
	 * Initilize a new Timecard
	 *
	 * @param {Object} options
	 * @api public
	 */

	constructor(options) {
		this.options = objectAssign({}, options);

		this.filepath = this.options.filepath ? path.join(this.options.filepath, '.timecard.json') : path.join(__dirname, '.timecard.json');
		this.name = process.cwd().split(path.sep).pop();
		this.prompt = this.options.prompt;
		this.clockoutIsPending = false;
		this.pendingClockoutIndex = null;
		this.totalSeconds = 0;
		this.timecardData = null;
		this.shifts = [];
	}

	/**
	 * Create a blank timecard on `timecard new`
	 *
	 */

	async create() {
		var self = this;

		return new Promise(resolve => {
			if (self.prompt) {
				let questions = createPrompt();

				// First check to see if the file already exists
				if (validFile.sync(self.filepath)) {
					questions = eraseThenCreatePrompt();
				}

				inquirer.prompt(questions, answers => {
					if (answers.eraseCard === false) {
						process.exit();
					} else {
						self.writeTimeCard(self.blankTimecard(answers.projectName)).then(() => {
							self.reportSuccessfulNewTimeCard();
							resolve(self);
						});
					}});
			} else {
				self.writeTimeCard(self.blankTimecard(self.name)).then(() => {
					self.reportSuccessfulNewTimeCard();
					resolve(self);
				});
			}
		});
	}

	/**
	 * Clockin.
	 *
	 */

	async clockin() {
		const self = this;

		if (validFile.sync(self.filepath) === false) {
			console.log(self.errors.noTimeCardFoundForClockin);
			process.exit(1);
		}

		return new Promise(async resolve => {
			await self.getTimeCardData();

			if (self.clockoutIsPending) {
				console.log(self.errors.clockOutIsPending);
				process.exit();
			}

			const date = new Date().toString();

			const tc = {
				id: self.shifts.length,
				date: date.slice(0, 15),
				startTime: date.slice(16, 24)
			};

			self.timecardData.shifts.push(tc);

			self.writeTimeCard(JSON.stringify(self.timecardData, null, 2)).then(() => {
				self.reportSuccessfulClockIn();
				resolve(self);
			});
		});
	}

	/**
	 * Clockout.
	 *
	 */

	async clockout() {
		const self = this;

		if (validFile.sync(self.filepath) === false) {
			console.log(self.errors.noTimeCardFoundForClockout);
			process.exit(1);
		}

		return new Promise(async resolve => {
			await self.getTimeCardData();

			if (self.clockoutIsPending) {
				const date = new Date().toString();

				self.shifts[self.pendingClockoutIndex].endTime = date.slice(16, 24);

				// report the last 'shift' time and the total time to the console.
				const shiftSeconds = duration(self.shifts[self.pendingClockoutIndex].startTime, self.shifts[self.pendingClockoutIndex].endTime).seconds;
				console.log(self.clockoutSummary(shiftSeconds, self.totalSeconds + shiftSeconds));

				self.totalSeconds += shiftSeconds;
				self.timecardData.totals = convert(self.totalSeconds);

				self.writeTimeCard(JSON.stringify(self.timecardData, null, 2)).then(() => {
					self.reportSuccessfulClockOut();
					resolve(self);
				});
			} else {
				console.log(self.errors.noClockInFound);
				process.exit();
			}
		});
	}

	/**
	 * Print the timecard data to the console.
	 *
	 */

	async printTimecard() {
		const self = this;

		return new Promise(async resolve => {
			await self.getTimeCardData();

			let output = self.prettyPrintHeader();
			self.timecardData.shifts.map(item => {
				output += self.prettyPrintEntry(item);
			});
			output += self.messages.prettyPrintBorder;
			output += self.summary(self.totalSeconds);
			console.log(output);
			resolve(output);
		});
	}
}

objectAssign(TimeCard.prototype, require('./utils.js'));
objectAssign(TimeCard.prototype, require('./messages.js'));
