#!/usr/bin/env node
import updateNotifier from 'update-notifier';
import objectAssign from 'object-assign';
import subarg from 'subarg';
import meow from 'meow';
import validFile from 'valid-file';
import Timecard from './../dist/index.js';

var cli = meow(`

  Get timecard setup with the 'new' command, then use the 'clockin' and 'clockout' commands
  to record your time. When you want to see a summary of your time, use the 'print' command.

  Commands
    timecard new            Setup a blank timecard for your project
    timecard clockin        Set the start time for your shift
    timecard clockout       Set the end time for your shift
    timecard print          Print a summary of your time

  Options
    -h,  --help             Show this help message
    -v,  --version          Show the current timecard version
    -i,  --clockin          Alias for the clockin command
    -o,  --clockout         Alias for the clockout command
    -n,  --new              Alias for the new command
    -p,  --print            Alias for the print command
    --no-prompt             Use with 'new' to silence all prompts and overwrite existing timecard

`, {
	alias: {
		h: 'help',
		v: 'version',
		i: 'clockin',
		o: 'clockout',
		p: 'print',
		n: 'new'
	}
});

async function init(args, options) {
	if (args.length === 0 && Object.keys(options).length === 0) {
		cli.showHelp(1);
	}

	var _cmd = {
		is: function (cmd) {
			return args.indexOf(cmd) > -1 || options[cmd];
		},
		not: function (cmd) {
			return args.indexOf(cmd) === -1 && !options[cmd];
		}
	};

	const defaults = {
		name: cli.pkg.name,
		prompt: true
	};

	options = objectAssign(defaults, options);

	var timecard = new Timecard(options);

	// Default to the create() command.
	let command = timecard.create;

	// Default the missing error to 'No TimeCard'.
	let missingError = timecard.errors.noTimecard;

	if (_cmd.is('clockin')) {
		command = timecard.clockin;
		missingError = timecard.errors.noTimeCardFoundForClockin;
	}

	if (_cmd.is('clockout')) {
		command = timecard.clockout;
		missingError = timecard.errors.noTimeCardFoundForClockout;
	}

	if (_cmd.is('print')) {
		command = timecard.printTimecard;
		missingError = timecard.errors.noTimeCardFoundForPrint;
	}

	const timeCardExists = validFile.sync(timecard.filepath);
	const timeCardValid = await timecard.checkForValidTimecard();

	// Check for missing/valid .timecard.json on any command except for the new command.
	if (_cmd.not('new')) {
		if (!timeCardExists) {
			console.log(missingError);
			process.exit(1);
		}

		if (!timeCardValid) {
			console.log(timecard.errors.invalidTimeCardJSON);
			process.exit(1);
		}
	}

	// Now we are clear to call the API.
	command.call(timecard).then(response => {
		console.log(response);
	}).catch(err => {
		console.log(err);
	});
}

updateNotifier({pkg: cli.pkg}).notify();

init(subarg(cli.input)._, cli.flags);
