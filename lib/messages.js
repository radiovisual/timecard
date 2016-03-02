import to24 from 'twelve-to-twentyfour';
import convert from 'convert-seconds';
import zp from 'simple-zeropad';
import pendel from 'pendel';
import chalk from 'chalk';

/**
 * Error messages.
 *
 */

export const errors = {
	clockOutIsPending: '\n' + chalk.bgRed(' TIMECARD ERROR ') + chalk.bold.white(' You must clockout before clocking in. \n') + chalk.bold.white('Tip:') + ' Clock out with the ' + chalk.cyan('clockout') + ' command, or edit the timecard file manually. \n',
	noClockInFound: '\n' + chalk.bgRed(' TIMECARD ERROR ') + chalk.bold.white(' You must clockin before clocking out. \n') + chalk.bold.white('Tip:') + ' Clock in with the ' + chalk.cyan('clockin') + ' command, or edit the timecard file manually. \n'
};

/**
 * General messages.
 *
 */

export const messages = {
	createdNewTimeCard: '\n  ' + chalk.bgCyan.black(' TIMECARD ') + chalk.bold.white(' You have created a new timecard file. \n') + chalk.bold.white('  Tip:') + ' Use the ' + chalk.cyan('clockin') + ' and ' + chalk.cyan('clockout') + ' commands to record your time.\n',
	successfulClockin: '\n  ' + chalk.bgCyan.black(' TIMECARD ') + chalk.bold.white(' You have ') + chalk.bold.green('clocked in: ') + time() + '\n',
	successfulClockout: '\n  ' + chalk.bgCyan.black(' TIMECARD ') + chalk.bold.white(' You have ') + chalk.bold.red('clocked out: ') + time() + '\n',
	prettyPrintBorder: chalk.gray('\n  ______________________________________________')
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
	var projectName = this.name || this.filepath;
	return `\n  ${chalk.bgCyan.black(' TIMECARD ')} ${chalk.cyan(' Logged Hours ')}\n  ${chalk.gray('Project:')} ${chalk.gray(projectName)} \n  ${chalk.gray('______________________________________________')}\n\n`;
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
 * @param {object} timeobj - the timecard data object
 */

export function prettyPrintEntry(timeobj) {
	var time = makeTimeString(pendel(timeobj.startTime, timeobj.endTime));
	return `  ${chalk.white(timeobj.date)} ${chalk.cyan(to24(timeobj.startTime))} - ${chalk.cyan(to24(timeobj.endTime))} ${chalk.gray('[')}${time}${chalk.gray(']')}\n`;
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

/**
 * Pretty-print a successful 'timecard new' message.
 *
 * @note: This gets called after a new timecard
 * has been created with `timecard new`
 */

export function reportSuccessfulNewTimeCard() {
	console.log(chalk.gray(this.filepath));
	console.log(messages.createdNewTimeCard);
}

/**
 * Pretty-print a successful clockin message.
 *
 */

export function reportSuccessfulClockIn() {
	console.log(messages.successfulClockin);
}

/**
 * Pretty-print a successful clockout message.
 *
 */

export function reportSuccessfulClockOut() {
	console.log(messages.successfulClockout);
}
