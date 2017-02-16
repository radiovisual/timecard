import fs from 'fs';
import path from 'path';
import pify from 'pify';
import test from 'ava';
import tempfile from 'tempfile';
import rimraf from 'rimraf';
import Timecard from '../dist/';

const fixtures = path.resolve('test/fixtures');

const tempfiles = [];

test.beforeEach('cleanup tempfile', async t => {
		// Create a blank timecard on the disk so that the operations
		// that require a timecard file can find one.
		const temppath = tempfile('.json');
		tempfiles.push(temppath);
		t.context.timecard = new Timecard({prompt: false, filepath: temppath});
		await t.context.timecard.create();
});

test('clockin', async t => {
	const timecard = t.context.timecard;
	timecard.clockin().then(result => {
		t.true(result.search('clocked in') > -1);
	});
});

test('clockin with message', async t => {
	const timecard = t.context.timecard;
	await timecard.clockin('yo dude');

  t.is(timecard.shifts['1'].messages[0], 'yo dude');
});

test('prevent clockin if clockout pending', async t => {
	const timecard = t.context.timecard;

	const fixture = path.join(fixtures, 'pendingClockout.json');
	const data = await pify(fs.readFile)(fixture, 'utf8');
	timecard.load(data);

	timecard.clockin().catch(err => {
		t.true(err.search('You must clockout before clocking in') > -1);
	});
});

test('prevent clockin without a timecard', async t => {
	const timecard = new Timecard({filepath: 'does/not/exist'});

	timecard.clockin().catch(err => {
		t.true(err.search('You must create a timecard before clocking in') > -1);
	});
});

test('cant run clockin operations on illegal locations', async t => {
  const illegalPath = path.join(tempfile('nopeclockin'), 'clockin.nope');
  const timecard = new Timecard({filepath: illegalPath});

	timecard.clockin().catch(err => {
		t.true(err.search('You must create a timecard before clocking in') > -1);
	});
});

test.after.always('cleanup tempfiles', () => {
	tempfiles.forEach(path => {
		console.log('deleting temppath:', path);
		rimraf.sync(path);
	});
});
