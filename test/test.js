import fs from 'fs';
import path from 'path';
import wait from 'wait-p';
import rm from 'rimraf';
import pify from 'pify';
import test from 'ava';
import findUp from 'find-up';
import Timecard from '../dist/index.js';
import {eraseThenCreatePrompt, createPrompt, projectName, eraseCard} from '../dist/prompts.js';

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
	t.true(/"shifts": \[\]/.test(data));
});

test.serial('sets project name', async t => {
	const tc = new Timecard();
	t.is(tc.name, 'test');
});

test.serial('sets filepath', async t => {
	const tc = new Timecard({filepath: 'some/path'});
	t.is(tc.filepath, 'some/path/.timecard.json');
});

test.serial('clockin', async t => {
	await timecard.create();
	await timecard.clockin();

	let data = await pify(fs.readFile)(timecardPath, 'utf8');
	data = JSON.parse(data);

	t.is(data.shifts.length, 1);
	t.is(typeof data.shifts[0].id, 'number');
	t.is(typeof data.shifts[0].date, 'string');
	t.is(typeof data.shifts[0].startTime, 'string');
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
	const shift = tc.shifts[0];

	t.is(typeof shift, 'object');
	t.is(typeof shift.id, 'number');
	t.is(typeof shift.date, 'string');
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
	t.true(output.length > 400);
});

test.serial('prompts', t => {
	t.true(Array.isArray(eraseThenCreatePrompt()));
	t.true(Array.isArray(createPrompt()));
	t.is(Object.keys(projectName).toString(), 'type,name,message,default,validate');
	t.is(Object.keys(eraseCard).toString(), 'type,name,message,default');
});

test.serial('prompts: projectName.validate', t => {
	t.true(projectName.validate('foo'));
	t.is(projectName.validate(''), 'You have to provide a project name');
});

test.serial('prompts: eraseThenCreatePrompt.projectName.when', t => {
	t.is(eraseThenCreatePrompt()[1].when({eraseCard: true}), true);
});

test.serial('utils.processTimeCardData', async t => {
	await timecard.create();
	await timecard.clockin();
	timecard.processTimeCardData().then(data => {
		t.true(data);
		t.is(typeof data, 'object');
		t.is(data[0].id, 0);
	});
});

test.serial('utils.blankTimecard', t => {
	t.is(timecard.blankTimecard('test-project'), '{\n  "project": "test-project",\n  "shifts": [],\n  "totals": {\n    "hours": 0,\n    "minutes": 0,\n    "seconds": 0\n  }\n}');
});

test.serial('utils.writeTimeCard', async t => {
	await timecard.writeTimeCard('foo!');

	let data = await pify(fs.readFile)(timecardPath, 'utf8');
	t.is(data, 'foo!');
});

test.serial('utils.checkForValidTimecard => true', async t => {
	await timecard.create();
	const isValid = await timecard.checkForValidTimecard();
	t.is(isValid, true);
});

test.serial('utils.checkForValidTimecard => false', async t => {
	await timecard.create();
	await timecard.writeTimeCard('foo!');
	const isValid = await timecard.checkForValidTimecard();
	t.is(isValid, false);
});

test.serial('utils.checkForValidTimecard => false (when error getting timecard data)', async t => {
	const tc = new Timecard({filepath: 'no/file/here'});
	const isValid = await tc.checkForValidTimecard();
	t.is(isValid, false);
});

test.serial('utils.processTimeCardData catch', async t => {
	const tc = new Timecard({filepath: 'no/file/here'});
	t.throws(tc.processTimeCardData(), /ENOENT/g);
});

test.serial('utils.writeTimeCard catch', async t => {
	const tc = new Timecard({filepath: 'no/file/here'});
	t.throws(tc.writeTimeCard('foo'), /ENOENT/g);
});

test.serial('utils.trace', async t => {
	const tc = new Timecard({filepath: 'no/file/here'});
	t.throws(tc.writeTimeCard('foo'), /ENOENT/g);
});
