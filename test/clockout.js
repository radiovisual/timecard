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

test('clockout', async t => {
	const timecard = t.context.timecard;
	const fixture = path.join(fixtures, 'pendingClockout.json');
	const data = await pify(fs.readFile)(fixture, 'utf8');
	await timecard.load(data);

	const response = await timecard.clockout();
	t.true(response.search('clocked out') > -1);
});

test('clockout with message', async t => {
	const timecard = t.context.timecard;
	await timecard.clockin('foo');
	await timecard.clockout('bar');

  t.is(timecard.shifts['1'].messages[0], 'foo');
	t.is(timecard.shifts['1'].messages[1], 'bar');
});

test('prevent clockout before clockin', async t => {
	const timecard = t.context.timecard;
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
	const timecard = t.context.timecard;
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

test.after.always('cleanup tempfiles', () => {
	tempfiles.forEach(path => {
		console.log('deleting temppath:', path);
		rimraf.sync(path);
	});
});
