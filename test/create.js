import fs from 'fs';
import path from 'path';
import pify from 'pify';
import test from 'ava';
import rimraf from 'rimraf';
import tempfile from 'tempfile';
import Timecard from '../dist/';

const timecardPath = tempfile('.json');

test('create', async t => {
	const timecard = new Timecard({prompt: false, filepath: timecardPath});
	const response = await timecard.create();

	const data = await pify(fs.readFile)(timecardPath, 'utf8');
	t.true(/"shifts": \{\}/.test(data));
  t.true(response.search('You have created a new timecard file') > -1);
});

test('cant run create operations on illegal locations', async t => {
  const illegalPath = path.join(tempfile('nopecreate'), 'create.nope');
  const timecard = new Timecard({prompt: false, filepath: illegalPath});

	timecard.create().catch(err => {
		t.is(err.code, 'ENOENT');
	});
});

test.after.always('cleanup', () => {
  rimraf.sync(timecardPath);
});
