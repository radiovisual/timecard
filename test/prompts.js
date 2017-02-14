import test from 'ava';
import {
  eraseThenCreatePrompt,
  createPrompt,
  projectName,
  eraseCard
} from '../dist/prompts.js';

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
