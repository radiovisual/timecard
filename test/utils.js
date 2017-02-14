import fs from 'fs';
import path from 'path';
import rm from 'rimraf';
import pify from 'pify';
import test from 'ava';
import findUp from 'find-up';
import Timecard from '../dist/';

let timecard;
const root = path.dirname(findUp.sync('package.json'));
const timecardPath = path.join(root, '.timecard.json');

test.beforeEach(() => {
	rm.sync(timecardPath);
	timecard = new Timecard({prompt: false});
});

test.serial('utils.processTimeCardData', async t => {
	await timecard.create();
	await timecard.clockin();
	timecard.processTimeCardData().then(data => {
		t.true(data);
		t.is(typeof data, 'object');
		t.is(data.project, 'test');
	});
});

test.serial('utils.blankTimecard', t => {
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

test.serial('utils.writeTimeCard', async t => {
	await timecard.writeTimeCard('foo!', timecardPath);

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
