import path from 'path';
import objectAssign from 'object-assign';
import convert from 'convert-seconds';
import validFile from 'valid-file';
import inquirer from 'inquirer';
import duration from 'pendel';
import chalk from 'chalk';
import {eraseThenCreatePrompt, createPrompt} from './prompts.js';

export default class TimeCard {
	/**
	 * Initialize a new Timecard
	 *
	 * @param {Object} options
	 * @api public
	 */

	constructor(options) {
		this.options = objectAssign({}, options);

		this.filepath = this.options.filepath ? path.join(this.options.filepath, '.timecard.json') : path.join(__dirname, '.timecard.json');
		this.name = process.cwd().split(path.sep).pop();
		this.prompt = typeof this.options.prompt === 'boolean' ? this.options.prompt : true;
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
		var msg = `${chalk.gray(self.filepath)} \n ${self.messages.createdNewTimeCard}`;

		return new Promise(resolve => {
			if (self.prompt === true) {
				let questions = createPrompt();

				// First check to see if the file already exists
				if (validFile.sync(self.filepath) === true) {
					questions = eraseThenCreatePrompt();
				}

				inquirer.prompt(questions, answers => {
					if (typeof answers.eraseCard === 'undefined' || answers.eraseCard === true) {
						self.writeTimeCard(self.blankTimecard(answers.projectName)).then(() => {
							resolve(msg);
						});
					}
				});
			} else {
				self.writeTimeCard(self.blankTimecard(self.name)).then(() => {
					resolve(msg);
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

		return new Promise(async (resolve, reject) => {
			if (validFile.sync(self.filepath) === false) {
				reject(self.errors.noTimeCardFoundForClockin);
			}

			// process timecard to see if a clockout is pending.
			await self.processTimeCardData();

			if (self.clockoutIsPending) {
				reject(self.errors.clockOutIsPending);
			} else {
				const date = new Date().toString();

				const tc = {
					id: self.shifts.length,
					date: date.slice(0, 15),
					startTime: date.slice(16, 24)
				};

				self.timecardData.shifts.push(tc);

				self.writeTimeCard(JSON.stringify(self.timecardData, null, 2)).then(() => {
					resolve(self.messages.successfulClockin);
				});
			}
		});
	}

	/**
	 * Clockout.
	 *
	 */

	async clockout() {
		const self = this;

		return new Promise(async (resolve, reject) => {
			if (validFile.sync(self.filepath) === false) {
				reject(self.errors.noTimeCardFoundForClockout);
			}

			await self.processTimeCardData();

			if (self.clockoutIsPending) {
				const date = new Date().toString();

				self.shifts[self.pendingClockoutIndex].endTime = date.slice(16, 24);

				// report the last 'shift' time and the total time to the console.
				const shiftSeconds = duration(self.shifts[self.pendingClockoutIndex].startTime, self.shifts[self.pendingClockoutIndex].endTime).seconds;
				const clockOutSummary = self.clockoutSummary(shiftSeconds, self.totalSeconds + shiftSeconds);

				self.totalSeconds += shiftSeconds;
				self.timecardData.totals = convert(self.totalSeconds);

				self.writeTimeCard(JSON.stringify(self.timecardData, null, 2)).then(() => {
					resolve(`${clockOutSummary}\n ${self.messages.successfulClockout}`);
				});
			} else {
				reject(self.errors.noClockInFound);
			}
		});
	}

	/**
	 * Print the timecard data to the console.
	 *
	 */

	async printTimecard() {
		const self = this;

		await self.processTimeCardData();

		let output = self.prettyPrintHeader();
		self.timecardData.shifts.forEach(item => {
			output += self.prettyPrintEntry(item);
		});
		output += self.messages.prettyPrintBorder;
		output += self.summary(self.totalSeconds);
		return Promise.resolve(output);
	}
}

objectAssign(TimeCard.prototype, require('./utils.js'));
objectAssign(TimeCard.prototype, require('./messages.js'));
