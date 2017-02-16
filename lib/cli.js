#!/usr/bin/env node
import updateNotifier from 'update-notifier';
import objectAssign from 'object-assign';
import subarg from 'subarg';
import meow from 'meow';
import validFile from 'valid-file';
import Timecard from './../dist/';

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
    --message, -m           Include a message summary to your shift (via clockin and clockout)

`, {
	alias: {
		h: 'help',
		v: 'version',
		i: 'clockin',
		o: 'clockout',
		p: 'print',
		n: 'new',
    m: 'message'
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

	const timecard = new Timecard(options);

  const timeCardExists = validFile.sync(timecard.filepath);
  const timecardData = await timecard.getTimeCard(timecard.filepath);
  const timeCardValid = await timecard.isTimeCardValid(timecardData);

  if (timeCardExists && timecardData && !timeCardValid) {
    console.log(timecard.errors.invalidTimeCardJSON);
    process.exit(1);
  }

  // If a timecard exists, load its data into the Timecard instance.
  if (_cmd.not('new')) {
    if (timeCardExists) {
      await timecard.load(timecardData);
    }
  }

  // Do we have a message in this command call?
  const message = options.message || options.m;

  let command;

  if (_cmd.is('version')) {
      console.log(cli.pkg.version);
      process.exit(0);
  }
  
  if (_cmd.is('new')) {
		command = timecard.create;
	}

	if (_cmd.is('clockin')) {
		command = timecard.clockin;
	}

	if (_cmd.is('clockout')) {
		command = timecard.clockout;
	}

	if (_cmd.is('print')) {
		command = timecard.print;
	}

  // Now we are clear to call the API.
	command.call(timecard, message).then(response => {
		console.log(response);
	}).catch(err => {
		console.log(err);
	});
}

updateNotifier({pkg: cli.pkg}).notify();

init(subarg(cli.input)._, cli.flags);
