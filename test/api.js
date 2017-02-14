import fs from 'fs';
import path from 'path';
import wait from 'wait-p';
import rm from 'rimraf';
import pify from 'pify';
import test from 'ava';
import findUp from 'find-up';
import Timecard from '../dist/index.js';

let timecard;
const root = path.dirname(findUp.sync('package.json'));
const timecardPath = path.join(root, '.timecard.json');

test.beforeEach(() => {
	rm.sync(timecardPath);
	timecard = new Timecard({prompt: false});
});

test('expose a constructor', t => {
	t.is(typeof Timecard, 'function');
});

test.serial('creates a new timecard', async t => {
	await timecard.create();

	const data = await pify(fs.readFile)(timecardPath, 'utf8');
	t.true(/"shifts": \{\}/.test(data));
});

test.serial('sets project name', t => {
	const tc = new Timecard();
	t.is(tc.name, 'timecard');
});

test.serial('sets filepath', t => {
	const tc = new Timecard({filepath: 'some/path'});
	t.is(tc.filepath, 'some/path/.timecard.json');
});

test.serial('clockin', async t => {
	await timecard.create();
	await timecard.clockin();

	let data = await pify(fs.readFile)(timecardPath, 'utf8');
	data = JSON.parse(data);

	t.is(Object.keys(data.shifts).length, 1);
	t.is(typeof data.shifts['1'].startTime, 'string');
});

test.serial('report successful clockin', async t => {
	await timecard.create().then(message => {
		t.true(message.search(/You have created a new timecard file/g) > 0);
	});
});

test.serial('noTimeCardFoundForClockin', t => {
	t.throws(timecard.clockin(), /You must create a timecard before clocking in/g);
});

test.serial('noTimeCardFoundForClockout', t => {
	t.throws(timecard.clockout(), /You must create a timecard before clocking out/g);
});

test.serial('allow print before clockout', async t => {
	await timecard.create();
	await timecard.clockin();
	await timecard.printTimecard().then(output => {
		t.true(/\[clockout pending\]/g.test(output));
	});
});

test.serial('clockout', async t => {
	await timecard.create();
	await timecard.clockin();
	await timecard.clockout();

	let data = await pify(fs.readFile)(timecardPath, 'utf8');
	const tc = JSON.parse(data);
	const shift = tc.shifts['1'];

	t.is(typeof shift, 'object');
	t.is(typeof shift.startTime, 'string');
	t.is(typeof shift.endTime, 'string');
});

test.serial('clockout pending', async t => {
	await timecard.create();
	await timecard.clockin();

	t.throws(timecard.clockin(), /You must clockout before clocking in/g);
});

test.serial('clockin pending', async t => {
	await timecard.create();

	t.throws(timecard.clockout(), /You must clockin before clocking out/g);
});

test.serial('records total seconds', async t => {
	await timecard.create();
	await timecard.clockin();

	await wait(3000);
	await timecard.clockout();

	t.true(timecard.totalSeconds >= 3);
});

test.serial('prints output', async t => {
	await timecard.create();
	await timecard.clockin();
	await wait(3000);
	await timecard.clockout();
	const output = await timecard.printTimecard();

	t.is(typeof output, 'string');
	t.true(output.length > 300);
	t.true(output.search('Total Time:') > -1);
});
