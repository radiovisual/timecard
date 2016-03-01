import test from 'ava';
import Timecard from './dist/';
import pathExists from 'path-exists';
import path from 'path';
import rm from 'rimraf';

let timecard;
const timecardPath = path.join(__dirname, '.timecard.json');

test.beforeEach(() => {
	rm.sync(timecardPath);
	timecard = new Timecard({filepath: __dirname});
});

test('creates a new timecard', async t => {
	await timecard.create();

	t.true(pathExists.sync(timecardPath));
});
