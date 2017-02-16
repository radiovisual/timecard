import fs from 'fs';
import path from 'path';
import wait from 'wait-p';
import pify from 'pify';
import test from 'ava';
import tempfile from 'tempfile';
import rimraf from 'rimraf';
import Timecard from '../dist/index.js';

const fixtures = path.resolve('test/fixtures');
const temppath = tempfile('.json');

test('expose a constructor', t => {
	t.is(typeof Timecard, 'function');
});

test('load', async t => {
	const timecard = new Timecard();
	const fixture = path.join(fixtures, 'validHour.json');

	const data = await pify(fs.readFile)(fixture, 'utf8');
	await timecard.load(data);

	t.is(timecard.name, 'validHour');
	t.is(timecard.shifts['0'].startTime, 'Mon Feb 13 2017 10:12:22 GMT+0000 (WET)');
});

test('print', async t => {
	const timecard = new Timecard();

	const fixture = path.join(fixtures, 'timecard.json');
	const data = await pify(fs.readFile)(fixture, 'utf8');
	await timecard.load(data);

	const response = await timecard.print();
	t.true(response.search('10:12:22') > -1);
	t.true(response.search('11:13:23') > -1);
});

test('prints messages', async t => {
	const timecard = new Timecard();

	const fixture = path.join(fixtures, 'pendingClockout.json');
	const data = await pify(fs.readFile)(fixture, 'utf8');
	await timecard.load(data);

	const response = await timecard.print();
	t.true(response.search('Lorem ipsum') > -1);
});

test('sets filepath', t => {
	const tc = new Timecard({filepath: 'some/path/.timecard.json'});
	t.is(tc.filepath, 'some/path/.timecard.json');
});

test('allow print before clockout', async t => {
	const timecard = new Timecard();

	const fixture = path.join(fixtures, 'pendingClockout.json');
	const data = await pify(fs.readFile)(fixture, 'utf8');
	await timecard.load(data);

	await timecard.print().then(output => {
		t.true(/\[clockout pending\]/g.test(output));
	});
});

test('records total seconds', async t => {
	// we have to create a timecard even though we we aren't using the physical
	// file in these tests because the clockin and clockout commands require a 
	// timecard file before executing.
	const timecard = new Timecard({prompt: false, filepath: temppath});
	await timecard.create();

	const fixture = path.join(fixtures, 'timecard.json');
	const data = await pify(fs.readFile)(fixture, 'utf8');
	await timecard.load(data);

	await timecard.clockin();
	await wait(3000);
	await timecard.clockout();

	t.true(timecard.totalSeconds >= 3600 + 60 + 1 + 3);
});

test.after.always('cleanup tempfile', () => {
	rimraf.sync(temppath);
});
