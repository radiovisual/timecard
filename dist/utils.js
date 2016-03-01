'use strict';

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
	value: true
});
exports.processTimeCardData = processTimeCardData;
exports.getTimeCardData = getTimeCardData;
exports.writeTimeCard = writeTimeCard;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _pendel = require('pendel');

var _pendel2 = _interopRequireDefault(_pendel);

/**
 * Record the times and look for conditions on the timecard data.
 *
 * @param timeCardData
 * @returns {*} Promise
 */

function processTimeCardData(timeCardData) {
	var self;
	return _regeneratorRuntime.async(function processTimeCardData$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				self = this;
				context$1$0.next = 3;
				return _regeneratorRuntime.awrap(_Promise.all(timeCardData.map(function (item, index) {
					return new _Promise(function (resolve) {
						if (item.hasOwnProperty('startTime') && !item.hasOwnProperty('endTime')) {
							self.clockoutIsPending = true;
							self.pendingClockoutIndex = index;
						}

						// get the number of seconds for all completed timecard sessions
						if (item.hasOwnProperty('startTime') && item.hasOwnProperty('endTime')) {
							self.totalSeconds += (0, _pendel2['default'])(item.startTime, item.endTime).totalSeconds;
						}

						self.hours.push(item);
						resolve(timeCardData);
					});
				})));

			case 3:
				return context$1$0.abrupt('return', context$1$0.sent);

			case 4:
			case 'end':
				return context$1$0.stop();
		}
	}, null, this);
}

/**
 * Read the json file with the timecard data.
 *
 * @param filepath - the filepath to search for the timecard data
 * @returns {*} Promise
 */

function getTimeCardData() {
	var self;
	return _regeneratorRuntime.async(function getTimeCardData$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				self = this;
				return context$1$0.abrupt('return', new _Promise(function (resolve, reject) {
					_fs2['default'].readFile(self.filepath, 'utf8', function (err, data) {
						if (err) {
							reject(err);
						} else {
							resolve(JSON.parse(data));
							self.timecardData = data;
						}
					});
				}));

			case 2:
			case 'end':
				return context$1$0.stop();
		}
	}, null, this);
}

/**
 * Physically write the timecard data to the json file.
 *
 * @param {object} data - the json data to write
 */

function writeTimeCard(data) {
	var self;
	return _regeneratorRuntime.async(function writeTimeCard$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				self = this;
				return context$1$0.abrupt('return', new _Promise(function (resolve, reject) {
					_fs2['default'].writeFile(self.filepath, data, function (err) {
						if (err) {
							reject(err);
						}
						resolve();
					});
				}));

			case 2:
			case 'end':
				return context$1$0.stop();
		}
	}, null, this);
}