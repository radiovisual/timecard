import fs from 'fs';
import path from 'path';
import pify from 'pify';
import test from 'ava';
import tempfile from 'tempfile';
import Timecard from '../dist/';

const fixtures = path.resolve('test/fixtures');

test('clockout', async t => {
	const timecard = new Timecard();

	const fixture = path.join(fixtures, 'pendingClockout.json');
	const data = await pify(fs.readFile)(fixture, 'utf8');
	await timecard.load(data);

	const response = await timecard.clockout();
	t.true(response.search('clocked out') > -1);
});

test('clockout with message', async t => {
	const timecard = new Timecard();
	await timecard.clockin('foo');
	await timecard.clockout('bar');

  t.is(timecard.shifts['1'].messages[0], 'foo');
	t.is(timecard.shifts['1'].messages[1], 'bar');
});

test('prevent clockout before clockin', async t => {
	const timecard = new Timecard();

	const fixture = path.join(fixtures, 'blank.json');
	const data = await pify(fs.readFile)(fixture, 'utf8');
	await timecard.load(data);

	timecard.clockout().catch(err => {
		t.true(err.search('You must clockin before clocking out') > -1);
	});
});

test('report error if attempt to clockout with no timecard', t => {
  const timecard = new Timecard({filepath: 'does/not/exist/foo.json'});

	return timecard.clockout().catch(err => {
		t.true(err.search('You must create a timecard before clocking out') > -1);
	});
});

test('prevent clockout if clockin pending', async t => {
  const timecard = new Timecard();

  const fixture = path.join(fixtures, 'blank.json');
	const data = await pify(fs.readFile)(fixture, 'utf8');
	await timecard.load(data);

	timecard.clockout().catch(err => {
		t.true(err.search('You must clockin before clocking out') > -1);
	});
});

test('cant run clockout operations on illegal locations', async t => {
  const illegalPath = path.join(tempfile('nopeclockout'), 'clockout.nope');
  const timecard = new Timecard({filepath: illegalPath});

	timecard.clockout().catch(err => {
		t.true(err.search('You must create a timecard before clocking out') > -1);
	});
});
