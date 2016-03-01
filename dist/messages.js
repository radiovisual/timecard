'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.summary = summary;
exports.prettyPrintHeader = prettyPrintHeader;
exports.clockoutSummary = clockoutSummary;
exports.prettyPrintEntry = prettyPrintEntry;
exports.reportSuccessfulNewTimeCard = reportSuccessfulNewTimeCard;
exports.reportSuccessfulClockIn = reportSuccessfulClockIn;
exports.reportSuccessfulClockOut = reportSuccessfulClockOut;

var _twelveToTwentyfour = require('twelve-to-twentyfour');

var _twelveToTwentyfour2 = _interopRequireDefault(_twelveToTwentyfour);

var _convertSeconds = require('convert-seconds');

var _convertSeconds2 = _interopRequireDefault(_convertSeconds);

var _simpleZeropad = require('simple-zeropad');

var _simpleZeropad2 = _interopRequireDefault(_simpleZeropad);

var _pendel = require('pendel');

var _pendel2 = _interopRequireDefault(_pendel);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

/**
 * Error messages.
 *
 */

var errors = {
  clockOutIsPending: '\n' + _chalk2['default'].bgRed(' TIMECARD ERROR ') + _chalk2['default'].bold.white(' You must clockout before clocking in. \n') + _chalk2['default'].bold.white('Tip:') + ' Clock out with the ' + _chalk2['default'].cyan('clockout') + ' command, or edit the timecard file manually. \n',
  noClockInFound: '\n' + _chalk2['default'].bgRed(' TIMECARD ERROR ') + _chalk2['default'].bold.white(' You must clockin before clocking out. \n') + _chalk2['default'].bold.white('Tip:') + ' Clock in with the ' + _chalk2['default'].cyan('clockin') + ' command, or edit the timecard file manually. \n'
};

exports.errors = errors;
/**
 * General messages.
 *
 */

var messages = {
  createdNewTimeCard: '\n  ' + _chalk2['default'].bgCyan.black(' TIMECARD ') + _chalk2['default'].bold.white(' You have created a new timecard file. \n') + _chalk2['default'].bold.white('  Tip:') + ' Use the ' + _chalk2['default'].cyan('clockin') + ' and ' + _chalk2['default'].cyan('clockout') + ' commands to record your time.\n',
  successfulClockin: '\n  ' + _chalk2['default'].bgCyan.black(' TIMECARD ') + _chalk2['default'].bold.white(' You have ') + _chalk2['default'].bold.green('clocked in: ') + time() + '\n',
  successfulClockout: '\n  ' + _chalk2['default'].bgCyan.black(' TIMECARD ') + _chalk2['default'].bold.white(' You have ') + _chalk2['default'].bold.red('clocked out: ') + time() + '\n',
  prettyPrintBorder: _chalk2['default'].gray('\n  ______________________________________________')
};

exports.messages = messages;
/**
 * A Helper function to generate the total time data.
 *
 * @note: This prints the total hours/mins/secs on the
 * bottom when the user types `timecard print`.
 *
 * @param {number} seconds - the number of seconds recorded in the timecard project.
 */

function summary(seconds) {
  var total = (0, _convertSeconds2['default'])(seconds);
  var timeStr = makeTimeString(total);

  return '\n\n  ' + _chalk2['default'].cyan('Total Time: ') + ' ' + _chalk2['default'].gray(timeStr) + ' \n  ' + total.hours + ' ' + _chalk2['default'].white('Hours') + ' ' + total.minutes + ' ' + _chalk2['default'].white('Minutes') + ' ' + total.seconds + ' ' + _chalk2['default'].white('Seconds');
}

function prettyPrintHeader() {
  return '\n  ' + _chalk2['default'].bgCyan.black(' TIMECARD ') + ' ' + _chalk2['default'].cyan(' Logged Hours ') + '\n  ' + _chalk2['default'].gray('Project:') + ' ' + _chalk2['default'].gray(this.filepath) + ' \n  ' + _chalk2['default'].gray('______________________________________________') + '\n';
}

function clockoutSummary(shiftSeconds, totalSeconds) {
  var total = (0, _convertSeconds2['default'])(totalSeconds);
  var shift = (0, _convertSeconds2['default'])(shiftSeconds);
  var totalStr = makeTimeString(total);
  var shiftStr = makeTimeString(shift);

  return '\n  ' + _chalk2['default'].cyan('Total Shift Time:') + ' ' + _chalk2['default'].gray(shiftStr) + '\n  ' + _chalk2['default'].cyan('Total Project Time:') + ' ' + _chalk2['default'].gray(totalStr);
}

/**
 * Pretty-print the timecard data.
 *
 * @param {object} timeobj - the timecard data object
 */

function prettyPrintEntry(timeobj) {
  var time = makeTimeString((0, _pendel2['default'])(timeobj.startTime, timeobj.endTime));
  return '  ' + _chalk2['default'].white(timeobj.date) + ' ' + _chalk2['default'].cyan((0, _twelveToTwentyfour2['default'])(timeobj.startTime)) + ' - ' + _chalk2['default'].cyan((0, _twelveToTwentyfour2['default'])(timeobj.endTime)) + ' ' + _chalk2['default'].gray('[') + time + _chalk2['default'].gray(']');
}

/**
 * Get the current time in the format: 'Wed Apr 09 2015'
 *
 * @returns {string}
 */

function time() {
  var date = new Date().toString();
  return date.slice(16, 24);
}

/**
 * Make a timestring in the format of '00:00:00'
 *
 * @param {object} timeObj - the duration object returned by pendel.
 * @returns {string}
 */

function makeTimeString(timeObj) {
  return (0, _simpleZeropad2['default'])(timeObj.hours) + ':' + (0, _simpleZeropad2['default'])(timeObj.minutes) + ':' + (0, _simpleZeropad2['default'])(timeObj.seconds);
}

/**
 * Pretty-print a successful 'timecard new' message.
 *
 * @note: This gets called after a new timecard
 * has been created with `timecard new`
 */

function reportSuccessfulNewTimeCard() {
  console.log(_chalk2['default'].gray(this.filepath));
  console.log(messages.createdNewTimeCard);
}

/**
 * Pretty-print a successful clockin message.
 *
 */

function reportSuccessfulClockIn() {
  console.log(messages.successfulClockin);
}

/**
 * Pretty-print a successful clockout message.
 *
 */

function reportSuccessfulClockOut() {
  console.log(messages.successfulClockout);
}