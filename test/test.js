import fs from 'fs';
import path from 'path';
import wait from 'wait-p';
import rm from 'rimraf';
import pify from 'pify';
import test from 'ava';
import Timecard from '../dist/index.js';
import {eraseThenCreatePrompt, createPrompt, projectName, eraseCard} from '../dist/prompts.js';

let timecard;
const timecardPath = path.join(__dirname, '.timecard.json');

test.beforeEach(() => {
	rm.sync(timecardPath);
	timecard = new Timecard({filepath: __dirname, prompt: false});
});

test('expose a constructor', t => {
	t.is(typeof Timecard, 'function');
});

test.serial('creates a new timecard', async t => {
	await timecard.create();

	const data = await pify(fs.readFile)(timecardPath, 'utf8');
	t.true(/"shifts": \[\]/.test(data));
});

test.serial('create() returns a promise', async t => {
	const tc = await timecard.create();
	t.is(tc.totalSeconds, 0);
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

test.serial('records total seconds', async t => {
	await timecard.create();
	await timecard.clockin();

	await wait(3000);
	await timecard.clockout();

	t.true(timecard.totalSeconds >= 3);
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
	await timecard.writeTimeCard('HEY!');

	let data = await pify(fs.readFile)(timecardPath, 'utf8');
	t.is(data, 'HEY!');
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
