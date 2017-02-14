import path from 'path';
import findUp from 'find-up';
import objectAssign from 'object-assign';
import convert from 'convert-seconds';
import validFile from 'valid-file';
import inquirer from 'inquirer';
import pendel from 'pendel';
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

		const pkgRoot = findUp.sync('package.json');
		const root = pkgRoot ? path.dirname(pkgRoot) : process.cwd();
		this.filepath = this.options.filepath ? path.join(this.options.filepath, '.timecard.json') : path.join(root, '.timecard.json');
		this.name = null;
		this.prompt = typeof this.options.prompt === 'boolean' ? this.options.prompt : true;
		this.clockoutIsPending = false;
		this.pendingClockoutIndex = null;
		this.totalSeconds = 0;
		this.timecardData = null;
		this.shiftOrder = [];
		this.shifts = {};
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
	 * @param {string} _message - an optional shift message
	 */
	async clockin(_message) {
		console.log('clocking in with message', _message);
		const self = this;

		return new Promise(async (resolve, reject) => {
			if (validFile.sync(self.filepath) === false) {
				reject(self.errors.noTimeCardFoundForClockin);
			} else {
				// process timecard to see if a clockout is pending.
				await self.processTimeCardData();

				if (self.clockoutIsPending) {
					reject(self.errors.clockOutIsPending);
				} else {
					const newShift = self.getNewShift(_message);

					const nextShiftId = self.getNextShiftId();
					self.shiftOrder.push(nextShiftId);
					self.shifts[nextShiftId] = newShift;
					self.timecardData.shifts[nextShiftId] = newShift;

					self.writeTimeCard(JSON.stringify(self.timecardData, null, 2)).then(() => {
						resolve(self.messages.successfulClockin);
					});
				}
			}
		});
	}

	/**
	 * Clockout.
	 *
	 * @param {string} _message - an optional shift message
	 */
	async clockout(_message) {
		const self = this;

		return new Promise(async (resolve, reject) => {
			if (validFile.sync(self.filepath) === false) {
				reject(self.errors.noTimeCardFoundForClockout);
			} else {
				// process timecard to see if a clockout is pending.
				await self.processTimeCardData();

				if (self.clockoutIsPending) {
					const date = new Date().toString();

					const shiftId = self.pendingClockoutIndex;
					const shift = self.shifts[shiftId];

					const message = self.stringOrUndefined(_message);

					if (message) {
						shift.messages.push(message);
					}

					shift.endTime = date;

					self.timecardData.shifts[shiftId] = shift;
					self.shifts[shiftId] = shift;

					// Report the last 'shift' time and the total time to the console.
					const shiftSeconds = pendel.date(shift.startTime, shift.endTime).seconds;
					const clockOutSummary = self.clockoutSummary(shiftSeconds, self.totalSeconds + shiftSeconds);

					self.totalSeconds += shiftSeconds;
					self.timecardData.totals = convert(self.totalSeconds);

					self.writeTimeCard(JSON.stringify(self.timecardData, null, 2)).then(() => {
						resolve(`${clockOutSummary}\n ${self.messages.successfulClockout}`);
					});
				} else {
					reject(self.errors.noClockInFound);
				}
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
		self.shiftOrder.forEach(shiftId => {
			const shift = self.shifts[shiftId];
			output += self.prettyPrintEntry(shiftId, shift);
		});
		output += self.messages.prettyPrintBorder;
		output += self.summary(self.totalSeconds);
		return Promise.resolve(output);
	}
}

objectAssign(TimeCard.prototype, require('./utils.js'));
objectAssign(TimeCard.prototype, require('./messages.js'));
