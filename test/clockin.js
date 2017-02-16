import fs from 'fs';
import path from 'path';
import pify from 'pify';
import test from 'ava';
import tempfile from 'tempfile';
import Timecard from '../dist/';

const fixtures = path.resolve('test/fixtures');

test('clockin', async t => {
	const timecard = new Timecard();
	timecard.clockin().then(result => {
		t.true(result.search('clocked in') > -1);
	});
});

test('clockin with message', async t => {
	const timecard = new Timecard();
	await timecard.clockin('yo dude');

  t.is(timecard.shifts['1'].messages[0], 'yo dude');
});

test('prevent clockin if clockout pending', async t => {
	const timecard = new Timecard();

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
