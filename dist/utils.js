'use strict';

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
	value: true
});
exports.getTimeCardData = getTimeCardData;
exports.writeTimeCard = writeTimeCard;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _pendel = require('pendel');

var _pendel2 = _interopRequireDefault(_pendel);

var _lodashSortby = require('lodash.sortby');

var _lodashSortby2 = _interopRequireDefault(_lodashSortby);

/**
 * Read the json file with the timecard data and set Timecard state.
 *
 * @returns {*} Promise
 */

function getTimeCardData() {
	var self = this;

	return new _Promise(function (resolve, reject) {
		_fs2['default'].readFile(self.filepath, 'utf8', function (err, data) {
			if (err) {
				reject(err);
			} else {
				var json = JSON.parse(data);

				// reset to zero each time the timecard data is read
				self.totalSeconds = 0;

				if (json.length > 0) {
					self.timecardData = (0, _lodashSortby2['default'])(json, function (shift) {
						return shift.id;
					});

					var lastShift = self.timecardData[self.timecardData.length - 1];
					if (lastShift.hasOwnProperty('startTime') && lastShift.hasOwnProperty('endTime') === false) {
						self.clockoutIsPending = true;
						self.pendingClockoutIndex = lastShift.id;
					}
					self.timecardData.map(function (item) {
						if (item.hasOwnProperty('startTime') && item.hasOwnProperty('endTime')) {
							self.totalSeconds += (0, _pendel2['default'])(item.startTime, item.endTime).totalSeconds;
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

function writeTimeCard(data) {
	var self = this;

	return new _Promise(function (resolve, reject) {
		_fs2['default'].writeFile(self.filepath, data, function (err) {
			if (err) {
				reject(err);
			}
			resolve();
		});
	});
}