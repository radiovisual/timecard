import path from 'path';
import findUp from 'find-up';
import objectAssign from 'object-assign';
import convert from 'convert-seconds';
import validFile from 'valid-file';
import inquirer from 'inquirer';
import pendel from 'pendel';
import chalk from 'chalk';
import {
  eraseThenCreatePrompt,
  createPrompt
} from './prompts.js';

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
    this.filepath = this.options.filepath ? this.options.filepath : path.join(root, '.timecard.json');
    this.name = this.options.name || this.filepath;
    this.prompt = typeof this.options.prompt === 'boolean' ? this.options.prompt : true;

    // Timecard state.
    this.pendingClockoutIndex = undefined;
    this.totalSeconds = 0;
    this.shiftOrder = [];
    this.shifts = {};
  }

  /**
   * Use existing Timecard data to populate the Timecard's state.
   *
   * @param {object} timecard - the timecard data in JSON format.
   * @returns {*} Promise
   */
   async load(timecard) {
     const self = this;
     return new Promise(async (resolve, reject) => {
       let _timecard;

       if (typeof timecard === 'object') {
         _timecard = timecard;
       } else if (typeof timecard === 'string') {
         try {
           _timecard = JSON.parse(timecard);
         } catch (err) {
           reject(err);
         }
       }

       self.name = _timecard.project;
       self.shifts = _timecard.shifts;
       self.totals = _timecard.totals;
       self.shiftOrder = self.getShiftOrder(self.shifts);
       self.totalSeconds = self.getTotalSeconds(self.shifts);
       self.pendingClockoutIndex = self.getPendingClockoutId(self.shifts);
       resolve(self);
     });
   }

  /**
   * Create a blank timecard on `timecard new`
   *
   */
  async create() {
    var self = this;
    var msg = `${chalk.gray(self.filepath)} \n ${self.messages.createdNewTimeCard}`;

    return new Promise((resolve, reject) => {
      if (self.prompt === true) {
        let questions = createPrompt();

        // First check to see if the file already exists
        if (validFile.sync(self.filepath) === true) {
          questions = eraseThenCreatePrompt();
        }

        inquirer.prompt(questions, answers => {
          if (typeof answers.eraseCard === 'undefined' || answers.eraseCard === true) {
            self.writeTimeCard(self.filepath, self.blankTimecard(answers.projectName)).then(() => {
              resolve(msg);
            });
          }
        });
      } else {
        self.writeTimeCard(self.filepath, self.blankTimecard(self.name)).then(() => {
          resolve(msg);
        }).catch(err => {
          reject(err);
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
    const self = this;

    return new Promise(async (resolve, reject) => {
      // Don't try to clockin if a clockout is pending
      if (self.pendingClockoutIndex) {
          reject(self.errors.clockOutIsPending);
      } else {
        const newShift = self.getNewShift(_message);

        const nextShiftId = self.getNextShiftId(self);
        self.pendingClockoutIndex = nextShiftId;
        self.shiftOrder.push(nextShiftId);
        self.shifts[nextShiftId] = newShift;

        const timecardString = self.getTimecardString(self);

        self.writeTimeCard(self.filepath, timecardString).then(() => {
          resolve(self.messages.successfulClockin);
        }).catch(err => {
          reject(err);
        });
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
      } else if (typeof self.pendingClockoutIndex === 'undefined') {
        reject(self.errors.noClockInFound);
      } else {
        const date = new Date().toString();

        const shiftId = self.pendingClockoutIndex;
        const shift = self.shifts[shiftId];

        const message = self.stringOrUndefined(_message);

        if (message) {
          shift.messages.push(message);
        }

        shift.endTime = date;

        // Update self.shift object with the new shift data
        self.shifts[shiftId] = shift;

        // Report the last 'shift' time and the total time to the console.
        const shiftSeconds = pendel.date(shift.startTime, shift.endTime).seconds;
        const clockOutSummary = self.clockoutSummary(shiftSeconds, self.totalSeconds + shiftSeconds);

        self.totalSeconds += shiftSeconds;
        self.totals = convert(self.totalSeconds);

        const timecardString = self.getTimecardString(self);

        self.writeTimeCard(self.filepath, timecardString).then(() => {
          resolve(`${clockOutSummary}\n ${self.messages.successfulClockout}`);
        }).catch(err => {
          reject(err);
        });
      }
    });
  }

  /**
   * Print the timecard data to the console.
   *
   */
  async print() {
    const self = this;

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
