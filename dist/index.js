#!/usr/bin/env node

'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _pendel = require('pendel');

var _pendel2 = _interopRequireDefault(_pendel);

var _validFile = require('valid-file');

var _validFile2 = _interopRequireDefault(_validFile);

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

// refactor these into one

var _messages = require('./messages');

var TimeCard = (function () {
	/**
  * Initilize a new Timecard
  *
  * @param {Object} options
  * @api public
  */

	function TimeCard(options) {
		_classCallCheck(this, TimeCard);

		this.options = (0, _objectAssign2['default'])({}, options);

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

	_createClass(TimeCard, [{
		key: 'create',
		value: function create() {
			var self, question;
			return _regeneratorRuntime.async(function create$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						self = this;

						// First check to see if the file already exists
						if (_validFile2['default'].sync(self.filepath)) {
							question = [{
								type: 'confirm',
								name: 'eraseCard',
								message: 'A timecard file already exists. Do you want to erase it and start over?',
								'default': false
							}];

							_inquirer2['default'].prompt(question, function (answer) {
								if (answer.eraseCard === true) {
									self.writeTimeCard('[]').then(function () {
										self.reportSuccessfulNewTimeCard();
									});
								} else {
									process.exit();
								}
							});
						} else {
							self.writeTimeCard('[]').then(function () {
								self.reportSuccessfulNewTimeCard();
							});
						}

					case 2:
					case 'end':
						return context$2$0.stop();
				}
			}, null, this);
		}

		/**
   * Clockin.
   *
   */

	}, {
		key: 'clockin',
		value: function clockin() {
			var self, date, tc;
			return _regeneratorRuntime.async(function clockin$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						self = this;
						context$2$0.next = 3;
						return _regeneratorRuntime.awrap(self.getTimeCardData());

					case 3:
						context$2$0.next = 5;
						return _regeneratorRuntime.awrap(self.processTimeCardData());

					case 5:
						if (!self.clockoutIsPending) {
							context$2$0.next = 7;
							break;
						}

						throw new Error(_messages.errors.clockOutIsPending);

					case 7:
						date = new Date().toString();
						tc = {
							id: self.hours.length,
							date: date.slice(0, 15),
							startTime: date.slice(16, 24)
						};

						self.timecardData.push(tc);

						self.writeTimeCard(JSON.stringify(self.timecardData, null, 2)).then(function () {
							self.reportSuccessfulClockIn();
						});

					case 11:
					case 'end':
						return context$2$0.stop();
				}
			}, null, this);
		}

		/**
   * Clockout.
   *
   */

	}, {
		key: 'clockout',
		value: function clockout() {
			var self, date, shiftSeconds;
			return _regeneratorRuntime.async(function clockout$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						self = this;
						context$2$0.next = 3;
						return _regeneratorRuntime.awrap(self.getTimeCardData());

					case 3:
						context$2$0.next = 5;
						return _regeneratorRuntime.awrap(self.processTimeCardData());

					case 5:
						if (!self.clockoutIsPending) {
							context$2$0.next = 13;
							break;
						}

						date = new Date().toString();

						self.hours[self.pendingClockoutIndex].endTime = date.slice(16, 24);

						// report the last 'shift' time and the total time to the console.
						shiftSeconds = (0, _pendel2['default'])(self.hours[self.pendingClockoutIndex].startTime, self.hours[self.pendingClockoutIndex].endTime).seconds;

						self.clockoutSummary(shiftSeconds, self.totalSeconds + shiftSeconds);

						self.writeTimeCard(JSON.stringify(self.hours, null, 2)).then(function () {
							self.reportSuccessfulClockOut();
						});
						context$2$0.next = 14;
						break;

					case 13:
						throw new Error(_messages.errors.noClockInFound);

					case 14:
					case 'end':
						return context$2$0.stop();
				}
			}, null, this);
		}

		/**
   * Print the timecard data to the console.
   *
   */

	}, {
		key: 'print',
		value: function print() {
			var self;
			return _regeneratorRuntime.async(function print$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						self = this;
						context$2$0.next = 3;
						return _regeneratorRuntime.awrap(self.getTimeCardData());

					case 3:
						context$2$0.next = 5;
						return _regeneratorRuntime.awrap(self.processTimeCardData());

					case 5:

						console.log(_messages.messages.prettyPrintHeader);

						self.timecardData.map(function (item) {
							(0, _messages.prettyprint)(item);
						});

						console.log(_messages.messages.prettyPrintBorder);
						(0, _messages.summary)(self.totalSeconds);

					case 9:
					case 'end':
						return context$2$0.stop();
				}
			}, null, this);
		}
	}]);

	return TimeCard;
})();

exports['default'] = TimeCard;

(0, _objectAssign2['default'])(TimeCard.prototype, require('./utils.js'));
(0, _objectAssign2['default'])(TimeCard.prototype, require('./messages.js'));
module.exports = exports['default'];

// refactor

// refactor