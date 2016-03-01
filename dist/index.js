'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _validFile = require('valid-file');

var _validFile2 = _interopRequireDefault(_validFile);

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _pendel = require('pendel');

var _pendel2 = _interopRequireDefault(_pendel);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

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

		this.filepath = this.options.filepath ? _path2['default'].join(this.options.filepath, '.timecard.json') : _path2['default'].join(__dirname, '.timecard.json');
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
			var self;
			return _regeneratorRuntime.async(function create$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						self = this;
						return context$2$0.abrupt('return', new _Promise(function (resolve) {
							// First check to see if the file already exists
							if (_validFile2['default'].sync(self.filepath)) {
								var question = [{
									type: 'confirm',
									name: 'eraseCard',
									message: 'A timecard file already exists. Do you want to erase it and start over?',
									'default': false
								}];

								_inquirer2['default'].prompt(question, function (answer) {
									if (answer.eraseCard === true) {
										self.writeTimeCard('[]').then(function () {
											self.reportSuccessfulNewTimeCard();
											resolve(self);
										});
									} else {
										process.exit();
									}
								});
							} else {
								self.writeTimeCard('[]').then(function () {
									self.reportSuccessfulNewTimeCard();
									resolve(self);
								});
							}
						}));

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
			var self;
			return _regeneratorRuntime.async(function clockin$(context$2$0) {
				var _this = this;

				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						self = this;
						return context$2$0.abrupt('return', new _Promise(function callee$2$0(resolve) {
							var date, tc;
							return _regeneratorRuntime.async(function callee$2$0$(context$3$0) {
								while (1) switch (context$3$0.prev = context$3$0.next) {
									case 0:
										context$3$0.next = 2;
										return _regeneratorRuntime.awrap(self.getTimeCardData());

									case 2:
										if (!self.clockoutIsPending) {
											context$3$0.next = 4;
											break;
										}

										throw new Error(self.errors.clockOutIsPending);

									case 4:
										date = new Date().toString();
										tc = {
											id: self.timecardData.length,
											date: date.slice(0, 15),
											startTime: date.slice(16, 24)
										};

										self.timecardData.push(tc);

										self.writeTimeCard(JSON.stringify(self.timecardData, null, 2)).then(function () {
											self.reportSuccessfulClockIn();
											resolve(self);
										});

									case 8:
									case 'end':
										return context$3$0.stop();
								}
							}, null, _this);
						}));

					case 2:
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
			var self;
			return _regeneratorRuntime.async(function clockout$(context$2$0) {
				var _this2 = this;

				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						self = this;
						return context$2$0.abrupt('return', new _Promise(function callee$2$0(resolve) {
							var date, shiftSeconds;
							return _regeneratorRuntime.async(function callee$2$0$(context$3$0) {
								while (1) switch (context$3$0.prev = context$3$0.next) {
									case 0:
										context$3$0.next = 2;
										return _regeneratorRuntime.awrap(self.getTimeCardData());

									case 2:
										if (!self.clockoutIsPending) {
											context$3$0.next = 11;
											break;
										}

										date = new Date().toString();

										self.timecardData[self.pendingClockoutIndex].endTime = date.slice(16, 24);

										// report the last 'shift' time and the total time to the console.
										shiftSeconds = (0, _pendel2['default'])(self.timecardData[self.pendingClockoutIndex].startTime, self.timecardData[self.pendingClockoutIndex].endTime).seconds;

										console.log(self.clockoutSummary(shiftSeconds, self.totalSeconds + shiftSeconds));

										self.totalSeconds += shiftSeconds;

										self.writeTimeCard(JSON.stringify(self.timecardData, null, 2)).then(function () {
											self.reportSuccessfulClockOut();
											resolve(self);
										});
										context$3$0.next = 12;
										break;

									case 11:
										throw new Error(self.errors.noClockInFound);

									case 12:
									case 'end':
										return context$3$0.stop();
								}
							}, null, _this2);
						}));

					case 2:
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
		key: 'printTimecard',
		value: function printTimecard() {
			var self;
			return _regeneratorRuntime.async(function printTimecard$(context$2$0) {
				var _this3 = this;

				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						self = this;
						return context$2$0.abrupt('return', new _Promise(function callee$2$0(resolve) {
							var output;
							return _regeneratorRuntime.async(function callee$2$0$(context$3$0) {
								while (1) switch (context$3$0.prev = context$3$0.next) {
									case 0:
										context$3$0.next = 2;
										return _regeneratorRuntime.awrap(self.getTimeCardData());

									case 2:
										output = self.prettyPrintHeader();

										self.timecardData.map(function (item) {
											output += self.prettyPrintEntry(item);
										});
										output += self.messages.prettyPrintBorder;
										output += self.summary(self.totalSeconds);
										console.log(output);
										resolve(output);

									case 8:
									case 'end':
										return context$3$0.stop();
								}
							}, null, _this3);
						}));

					case 2:
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