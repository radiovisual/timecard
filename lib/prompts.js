import path from 'path';
import objectAssign from 'object-assign';

export const projectName = {
	type: 'input',
	name: 'projectName',
	message: 'What is the name of your project?',
	default: process.cwd().split(path.sep).pop(),
	validate: x => x.length > 0 ? true : 'You have to provide a project name'
};

export const eraseCard = {
	type: 'confirm',
	name: 'eraseCard',
	message: 'A timecard file already exists. Do you want to erase it and start over?',
	default: false
};

export function eraseThenCreatePrompt() {
	const whenObj = {
		when: function (answers) {
			return answers.eraseCard;
		}
	};
	const whenProject = objectAssign({}, projectName, whenObj);

	return [eraseCard, whenProject];
}

export function createPrompt() {
	return [projectName];
}
