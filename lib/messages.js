import convert from 'convert-seconds';
import zp from 'simple-zeropad';
import pendel from 'pendel';
import chalk from 'chalk';

/**
 * Error messages.
 *
 */
export const errors = {
	noTimeCard: '\n  ' + chalk.bgRed(' TIMECARD ERROR ') + chalk.bold.white(' Your ') + chalk.cyan('.timecard.json') + chalk.white(' does not exist. Did you delete or rename it?\n  ') + chalk.bold.white('Tip:') + ' Create a timecard by typing ' + chalk.cyan('timecard new') + '\n',
	invalidTimeCardJSON: '\n  ' + chalk.bgRed(' TIMECARD ERROR ') + chalk.bold.white(' Your ') + chalk.cyan('.timecard.json') + chalk.white(' file appears to be invalid json. Did you edit manually?\n  ') + chalk.gray('Please correct the JSON error before using timecard. \n'),
	noTimeCardFoundForClockout: '\n  ' + chalk.bgRed(' TIMECARD ERROR ') + chalk.bold.white(' You must create a timecard before clocking out. \n  ') + chalk.bold.white('Tip:') + ' Create a timecard by typing ' + chalk.cyan('timecard new') + ' or ' + chalk.cyan('timecard clockin') + '\n',
	noTimeCardFoundForClockin: '\n  ' + chalk.bgRed(' TIMECARD ERROR ') + chalk.bold.white(' You must create a timecard before clocking in. \n  ') + chalk.bold.white('Tip:') + ' Create a timecard by typing ' + chalk.cyan('timecard new') + ' and clockin with ' + chalk.cyan('timecard clockin') + '\n',
	noTimeCardFoundForPrint: '\n  ' + chalk.bgRed(' TIMECARD ERROR ') + chalk.bold.white(' You must have a timecard before printing. \n  ') + chalk.bold.white('Tip:') + ' Create a timecard by typing ' + chalk.cyan('timecard new') + ' and clockin with ' + chalk.cyan('timecard clockin') + '\n',
	clockOutIsPending: '\n  ' + chalk.bgRed(' TIMECARD ERROR ') + chalk.bold.white(' You must clockout before clocking in. \n  ') + chalk.bold.white('Tip:') + ' Clock out by typing ' + chalk.cyan('timecard clockout') + ', or edit the timecard file manually. \n',
	noClockInFound: '\n  ' + chalk.bgRed(' TIMECARD ERROR ') + chalk.bold.white(' You must clockin before clocking out. \n  ') + chalk.bold.white('Tip:') + ' Clock in by typing ' + chalk.cyan('timecard clockin') + ', or edit the timecard file manually. \n'
};

/**
 * General messages.
 *
 */
export const messages = {
	createdNewTimeCard: '\n  ' + chalk.bgCyan.black(' TIMECARD ') + chalk.bold.white(' You have created a new timecard file. \n') + chalk.bold.white('  Tip:') + ' Use the ' + chalk.cyan('clockin') + ' and ' + chalk.cyan('clockout') + ' commands to record your time.\n',
	successfulClockin: '\n  ' + chalk.bgCyan.black(' TIMECARD ') + chalk.bold.white(' You have ') + chalk.bold.green('clocked in: ') + time() + '\n',
	successfulClockout: '\n  ' + chalk.bgCyan.black(' TIMECARD ') + chalk.bold.white(' You have ') + chalk.bold.red('clocked out: ') + time() + '\n',
	prettyPrintBorder: chalk.gray('\n  _________________________________________________________________')
};

/**
 * A Helper function to generate the total time data.
 *
 * @note: This prints the total hours/mins/secs on the
 * bottom when the user types `timecard print`.
 *
 * @param {number} seconds - the number of seconds recorded in the timecard project.
 */
export function summary(seconds) {
	var total = convert(seconds);
	var timeStr = makeTimeString(total);

	return `\n\n  ${chalk.cyan('Total Time: ')} ${chalk.gray(timeStr)} \n  ${total.hours} ${chalk.white('Hours')} ${total.minutes} ${chalk.white('Minutes')} ${total.seconds} ${chalk.white('Seconds')}`;
}

export function prettyPrintHeader() {
	var projectName = this.name;
	return `\n  ${chalk.bgCyan.black(' TIMECARD ')} ${chalk.cyan(' Logged Hours ')}\n  ${chalk.gray('Project:')} ${chalk.gray(projectName)} \n  ${messages.prettyPrintBorder}\n\n`;
}

export function clockoutSummary(shiftSeconds, totalSeconds) {
	var total = convert(totalSeconds);
	var shift = convert(shiftSeconds);
	var totalStr = makeTimeString(total);
	var shiftStr = makeTimeString(shift);

	return `\n  ${chalk.cyan('Total Shift Time:')} ${chalk.gray(shiftStr)}\n  ${chalk.cyan('Total Project Time:')} ${chalk.gray(totalStr)}`;
}

/**
 * Pretty-print the timecard data.
 *
 * @param {number} shiftId - the shiftId value
 * @param {object} timeobj - the timecard data object
 */
export function prettyPrintEntry(shiftId, shift) {
	var startTime = shift.startTime;
	var startTimeOnly;
	var startDateOnly;
	var endTime = shift.endTime;
	var endTimeOnly;
	var endDateOnly;
	var time;

	if (startTime) {
			startTimeOnly = timeOnly(startTime);
			startDateOnly = dateOnly(startTime);
	}

	if (endTime) {
			endTimeOnly = timeOnly(endTime);
			endDateOnly = dateOnly(endTime);
	}

	if (startTime && endTime) {
		time = makeTimeString(pendel.time(startTime, endTime));
		var output = `  ${chalk.gray(shiftId)} ${chalk.white(startDateOnly)} ${chalk.cyan(startTimeOnly)} - ${chalk.white(endDateOnly)} ${chalk.cyan(endTimeOnly)} ${chalk.gray('[')}${time}${chalk.gray(']')}\n`;

		if (shift.messages.length > 0) {
			shift.messages.forEach(message => {
				output += `      - ${message}\n`;
			});
		}
		return output;
	}
	return `  ${chalk.gray(shiftId)} ${chalk.white(startDateOnly)} ${chalk.cyan(startTimeOnly)} - ${chalk.gray('[clockout pending]')}\n`;
}

/**
 * Extract the Date portion from Datestring
 * 'Tue Feb 14 2017 17:31:04 GMT+0000 (WET)' => 'Tue Feb 14 2017'
 * @param {string} string - the datetime string
 * @returns {string}
 */
function dateOnly(string) {
		return string.substring(0, 15);
}

/**
 * Extract the Date portion from Datestring
 * 'Tue Feb 14 2017 17:31:04 GMT+0000 (WET)' => '17:31:04'
 * @param {string} string - the datetime string
 * @returns {string}
 */
function timeOnly(string) {
	return string.substring(16, 24);
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
	return zp(timeObj.hours) + ':' + zp(timeObj.minutes) + ':' + zp(timeObj.seconds);
}
