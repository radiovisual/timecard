#!/usr/bin/env node
/* eslint-disable no-inline-comments */
'use strict';
var updateNotifier = require('update-notifier');
var objectAssign = require('object-assign');
var multiline = require('multiline');
var subarg = require('subarg');
var meow = require('meow');

var Timecard = require('./dist/index.js');
var utils = require('./dist/utils.js');

var cli = meow(multiline(function () {/*

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
    --no-prompt             Use with `new` to silence all prompts and overwrite existing timecard.

*/}), {
	alias: {
		h: 'help',
		v: 'version',
		i: 'clockin',
		o: 'clockout',
		p: 'print',
		n: 'new'
	}
});

function init(args, options) {
	if (args.length === 0 && Object.keys(options).length === 0) {
		cli.showHelp(1);
	}

	const defaults = {
		filepath: process.cwd(),
		name: cli.pkg.name,
		prompt: true
	};

	// check for valid timecard json on any command except for the new command.
	if (args.indexOf('new') === -1 && !options.new) {
		utils.checkForValidTimecard();
	}

	options = objectAssign(defaults, options);

	var timecard = new Timecard(options);

	if (args.indexOf('new') > -1 || options.new) {
		timecard.create();
	}

	if (args.indexOf('clockin') > -1 || options.clockin) {
		timecard.clockin();
	}

	if (args.indexOf('clockout') > -1 || options.clockout) {
		timecard.clockout();
	}

	if (args.indexOf('print') > -1 || options.print) {
		timecard.printTimecard();
	}
}

updateNotifier({pkg: cli.pkg}).notify();

init(subarg(cli.input)._, cli.flags);
