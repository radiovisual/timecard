#!/usr/bin/env node
/* eslint-disable no-inline-comments */
'use strict';
var updateNotifier = require('update-notifier');
var multiline = require('multiline');
var Timecard = require('./dist/index.js');
var subarg = require('subarg');
var meow = require('meow');

var cli = meow(multiline(function () {/*

  Get timecard setup with the 'new' command, then use the 'clockin' and 'clockout' commands
  to record your time. When you want to see a summary of your time, use the 'print' command.

  Commands
    timecard new            setup a blank timecard for your project
    timecard clockin        set the start time
    timecard clockout       set the end time
    timecard print          print a summary of your time

  Options
    -h, --help              Show this help message
    -v, --version           Show the current timecard version

*/}));

function init(args) {
	if (args.length === 0) {
		cli.showHelp(1);
	}

	var timecard = new Timecard({filepath: __dirname});

	if (args.indexOf('new') > -1) {
		timecard.create();
	}

	if (args.indexOf('clockin') > -1) {
		timecard.clockin();
	}

	if (args.indexOf('clockout') > -1) {
		timecard.clockout();
	}

	if (args.indexOf('print') > -1) {
		timecard.printTimecard();
	}
}

updateNotifier({pkg: cli.pkg}).notify();

init(subarg(cli.input)._, cli.flags);
