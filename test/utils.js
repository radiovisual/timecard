import fs from 'fs';
import path from 'path';
import pify from 'pify';
import test from 'ava';
import tempfile from 'tempfile';
import rimraf from 'rimraf';
import Timecard from '../dist/';

const fixtures = path.resolve('test/fixtures');
const timecardPath = tempfile('.json');

test('utils.blankTimecard', t => {
	const timecard = new Timecard();
	var blankcard = JSON.parse(timecard.blankTimecard('test-project'));

	const expected = {
		project: 'test-project',
		shifts: {},
		totals: {
			hours: 0,
			minutes: 0,
			seconds: 0
		}
	};

	t.deepEqual(blankcard, expected);
});

test('utils.writeTimeCard', async t => {
	const timecard = new Timecard({filepath: timecardPath});

	await timecard.writeTimeCard(timecardPath, 'foo!');
	let data = await pify(fs.readFile)(timecardPath, 'utf8');
	t.is(data, 'foo!');
});

test('isTimeCardValid: true', async t => {
	const timecard = new Timecard();

	const fixture = path.join(fixtures, 'timecard.json');
	const data = await pify(fs.readFile)(fixture, 'utf8');

	t.is(timecard.isTimeCardValid(data), true);
});

test('isTimeCardValid: false', t => {
	const timecard = new Timecard();

	const data = 'invalid json';

	t.is(timecard.isTimeCardValid(data), false);
});

test('getTotalSeconds', t => {
	const timecard = new Timecard();

	const fixture1 = {
		1: {
			startTime: 'Mon Feb 13 2017 10:12:22 GMT+0000 (WET)',
			endTime: 'Mon Feb 13 2017 11:13:23 GMT+0000 (WET)'
		},
		2: {
			startTime: 'Tue Feb 14 2017 10:12:22 GMT+0000 (WET)',
			endTime: 'Tue Feb 14 2017 11:13:23 GMT+0000 (WET)'
		}
	};

	const fixture2 = {
		1: {
			startTime: 'Mon Feb 13 2017 10:10:22 GMT+0000 (WET)',
			endTime: 'Mon Feb 13 2017 10:10:23 GMT+0000 (WET)'
		},
		2: {
			startTime: 'Tue Feb 14 2017 10:12:22 GMT+0000 (WET)',
			endTime: 'Tue Feb 14 2017 10:13:22 GMT+0000 (WET)'
		}
	};

	const seconds1 = timecard.getTotalSeconds(fixture1);
	const seconds2 = timecard.getTotalSeconds(fixture2);
	t.is(seconds1, (3600 + 60 + 1) * 2);
	t.is(seconds2, 61);
});

test('getPendingClockoutId', t => {
	const timecard = new Timecard();

	const fixture = {
		1: {
			startTime: 'Mon Feb 13 2017 10:12:22 GMT+0000 (WET)',
			endTime: 'Mon Feb 13 2017 11:13:23 GMT+0000 (WET)'
		},
		2: {
			startTime: 'Tue Feb 14 2017 10:12:22 GMT+0000 (WET)'
		}
	};

	const pendingId = timecard.getPendingClockoutId(fixture);
	t.is(pendingId, '2');
});

test('getPendingClockoutId returns undefined when no pending clockout', async t => {
	const timecard = new Timecard();

	const fixture = {
		1: {
			startTime: 'Mon Feb 13 2017 10:12:22 GMT+0000 (WET)',
			endTime: 'Mon Feb 13 2017 11:13:23 GMT+0000 (WET)'
		}
	};

	const pendingId = timecard.getPendingClockoutId(fixture);
	t.is(typeof pendingId, 'undefined');
});

test('getShiftOrder', t => {
	const timecard = new Timecard();

	const fixture = {
		2: {
			startTime: 'Mon Feb 13 2017 10:12:22 GMT+0000 (WET)',
			endTime: 'Mon Feb 13 2017 11:13:23 GMT+0000 (WET)'
		},
		1: {
			startTime: 'Mon Feb 13 2017 10:12:22 GMT+0000 (WET)',
			endTime: 'Mon Feb 13 2017 11:13:23 GMT+0000 (WET)'
		}
	};

	const shiftOrder = timecard.getShiftOrder(fixture);
	t.deepEqual(shiftOrder, ['1', '2']);
});

test('getNewShift with message', t => {
	const timecard = new Timecard();

	const newShift = timecard.getNewShift('hello');
	t.is(typeof newShift.startTime, 'string');
	t.is(newShift.messages[0], 'hello');
});

test('getNewShift without message', t => {
	const timecard = new Timecard();

	const newShift = timecard.getNewShift();
	t.is(typeof newShift.startTime, 'string');
	t.is(newShift.messages.length, 0);
});

test('stringOrUndefined', t => {
	const timecard = new Timecard();

	t.is(typeof timecard.stringOrUndefined(), 'undefined');
	t.is(typeof timecard.stringOrUndefined(''), 'undefined');
	t.is(typeof timecard.stringOrUndefined(' '), 'undefined');
	t.is(timecard.stringOrUndefined(' foo '), 'foo');
});

test('getNextShiftId', async t => {
	const timecard = new Timecard();

	const fixture = path.join(fixtures, 'timecard.json');
	const data = await pify(fs.readFile)(fixture, 'utf8');
	await timecard.load(data);

	t.is(timecard.getNextShiftId(timecard), 3);
});

test('getTimeCard finds existing timecard', async t => {
	const timecard = new Timecard();

	const fixture = path.join(fixtures, 'timecard.json');
	const data = await timecard.getTimeCard(fixture);

	const obj = JSON.parse(data);
	t.is(obj.shifts['1'].startTime, 'Mon Feb 13 2017 10:12:22 GMT+0000 (WET)');
});

test('getTimeCard returns blankcard', async t => {
	const timecard = new Timecard();

	const fixture = path.join(fixtures, 'does.not.exist');
	const data = await timecard.getTimeCard(fixture);

	const obj = JSON.parse(data);
	t.is(Object.keys(obj.shifts).length, 0);
});

test('getTimecardString', t => {
	const timecard = new Timecard({filepath: 'foo.json'});

	const string = timecard.getTimecardString(timecard);
	const obj = JSON.parse(string);

	t.is(obj.project, 'foo.json');
	t.is(Object.keys(obj.shifts).length, 0);
	t.is(obj.totals.hours, 0);
	t.is(obj.totals.minutes, 0);
	t.is(obj.totals.seconds, 0);
});

test.after.always('cleanup', () => {
  rimraf.sync(timecardPath);
});
