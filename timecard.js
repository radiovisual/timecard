#! /usr/bin/env node
'use strict';

var fs = require('fs');
var objectAssign = require('object-assign');
var parseArgs = require('minimist');
var getStdin = require('get-stdin');
var errors = require('./tc_messages').errors;
var messages = require('./tc_messages').messages;
var summary = require('./tc_messages').summary;
var prettyprint = require('./tc_messages').prettyPrintEntry;
var pkg = require('./package.json');
var eachAsync = require('each-async');
var Promise = require('pinkie-promise');
var duration = require('pendel');
var multiline = require('multiline');
var inquirer = require("inquirer");

var options = parseArgs(process.argv.slice(2));

var args = options._;

delete options._;


/**
 * Initialize a new TimeCard
 *
 * @param {Object} options
 * @constructor
 */
function TimeCard (options){

    if (!(this instanceof TimeCard)){
        return new TimeCard(options);
    }

    this.options = objectAssign({}, options);

    this.filepath = this.options.filepath || __dirname+"/.timecard.json";
    this.hours = [];
    this.clockoutIsPending = false;
    this.pendingClockoutIndex = null;
    this.totalSeconds = 0;

}


/**
 * Clockin.
 *
 * @param {function} cb
 */
TimeCard.prototype.clockin = function (cb) {

    cb = cb || function(){};

    var self = this;

    var TC = getTimeCardData(this.filepath).then(function(timeCardData) {

        return self.processTimeCardData(timeCardData);

    }).then(function (timeCardData) {

        if (self.clockoutIsPending){
            cb(new Error(errors.clockOutIsPending));
            return;
        }

        var date = new Date().toString();

        var tc = {};
        tc.date = date.slice(0, 15);
        tc.startTime = date.slice(16, 24);

        timeCardData.push(tc);

        self.writeTimeCard(JSON.stringify(timeCardData), reportSuccessfulClockIn);

    });


    TC.catch(function (err) {

        if (err) {
            cb(err);
        }

    });


};


/**
 * Clockout.
 *
 * @param {function} cb - the callback function
 */
TimeCard.prototype.clockout = function (cb) {

    cb = cb || function(){};

    var self = this;

    var TC = getTimeCardData(this.filepath).then(function(timeCardData) {

        return self.processTimeCardData(timeCardData);

    }).then(function (timeCardData) {

        if (self.clockoutIsPending){

            var date = new Date().toString();

            self.hours[self.pendingClockoutIndex].endTime = date.slice(16, 24);

            self.writeTimeCard(JSON.stringify(self.hours), reportSuccessfulClockOut);


        } else {
            cb(new Error(errors.noClockInFound));
        }

    });

    TC.catch(function (err) {

        if (err) {
            cb(err);
        }

    });

};

/**
 * Create a blank timecard on `timecard new`
 *
 */
TimeCard.prototype.createBlankTimeCard = function(){

    var self = this;

    // First check to see if the file already exists
    fs.stat(self.filepath, function(err, stats){

        if (err && err.code === 'ENOENT'){
            self.writeTimeCard('[]', reportSuccessfulNewTimeCard);
        } else if (err) {
            throw err;
        }

        if (stats && stats.isFile()){

            var question = [{
                    type: "confirm",
                    name: "eraseCard",
                    message: "A timecard file already exists. Do you want to erase it and start over?",
                    default: true
                }];

            inquirer.prompt(question, function(answer) {
                if (answer.eraseCard == true){
                    self.writeTimeCard('[]', reportSuccessfulNewTimeCard);
                } else {
                    process.exit();
                }
            });
        }
    });
};


/**
 * Get the hour array recorded by Timecard.
 *
 */
TimeCard.prototype.hours = function(){
    return this.hours;
};


/**
 * Record the times and look for conditions on the timecard data.
 *
 * @param timeCardData
 * @returns {*} Promise
 */
TimeCard.prototype.processTimeCardData = function(timeCardData){

    var self = this;

    return new Promise(function(resolve, reject){

        eachAsync(timeCardData, function(item, index, next){

            if (item.hasOwnProperty("startTime") && !item.hasOwnProperty("endTime")){
                self.clockoutIsPending = true;
                self.pendingClockoutIndex = index;
            }

            // get the number of minutes for all completed timecard sessions
            if(item.hasOwnProperty("startTime") && item.hasOwnProperty("endTime")){
                self.totalSeconds += duration(item.startTime, item.endTime).totalSeconds;
            }

            self.hours.push(item);

            next();

        }, function(error){
            if (error) { reject(error); }
            resolve(timeCardData);
        });

    });
};


/**
 * Print the timecard data to the console.
 *
 * @param {function} cb - the callback
 */
TimeCard.prototype.print = function(cb) {

    cb = cb || function(){};

    var self = this;

    var TC = getTimeCardData(this.filepath).then(function(timeCardData) {

        return self.processTimeCardData(timeCardData);

    }).then(function (timeCardData) {

        console.log(messages.prettyPrintHeader);

        eachAsync(timeCardData, function(item, index, next){

            prettyprint(item);

            next();

        }, function(error){
            if (error) { reject(error); }

            console.log(messages.prettyPrintBorder);
            summary(self.totalSeconds);

            console.log();
        });

    });

    TC.catch(function (err) {

        if (err) {
            cb(err);
        }

    });

};


/**
 * Read the json file with the timecard data.
 *
 * @param filepath - the filepath to search for the timecard data
 * @returns {*} Promise
 */
function getTimeCardData(filepath){

    return new Promise(function(resolve, reject){

        fs.readFile(filepath, 'utf8', function(err, data){

            if (err){
               reject(err)
            } else {
                resolve(JSON.parse(data));
            }

        });

    });
}


/**
 * Physically write the timecard data to the json file.
 *
 * @param {object} data - the json data to write
 * @param {function} cb - the callback
 */
TimeCard.prototype.writeTimeCard = function(data, cb) {

    fs.writeFile(this.filepath, data, function (err) {
        if (err) {
            throw err;
        }
        cb();
    });

};


/**
 * Pretty-print a successful 'timecard new' message.
 *
 * @note: This gets called after a new timecard
 * has been created with `timecard new`
 */
function reportSuccessfulNewTimeCard(){
    console.log(messages.createdNewTimeCard);
}


/**
 * Pretty-print a successful clockin message.
 *
 */
function reportSuccessfulClockIn(){
    console.log(messages.successfulClockin);
}


/**
 * Pretty-print a successful clockout message.
 *
 */
function reportSuccessfulClockOut(){
    console.log(messages.successfulClockout);
}


/**
 * Timecard's point of entry.
 *
 * @note: This function processes the arguments and options passed in
 * from the command line and determines what the app should do next.
 *
 * @param {Array} args - cli args
 * @param {Object} options - cli options
 */
function init(args, options){

    //console.log("called init with arguments: ", args);
    //console.log("called init with options: ", options);

    if (options.version || options.v){
        console.log(pkg.version);
        process.exit();
    }

    if (options.help || options.h){
        showHelp();
        process.exit();
    }

    if (args.length === 0){
        showHelp();
        process.exit(1);
    }

    var timecard = new TimeCard();


    if (args.indexOf('new') > -1){
        timecard.createBlankTimeCard();
    }

    else if (args.indexOf('clockin') > -1){
        timecard.clockin(function(err){
            if(err){
                console.log(err.message);
            }
        });
    }

    else if (args.indexOf('clockout') > -1){
        timecard.clockout(function(err){
            if(err){
                console.log(err.message);
            }
        });
    }

    else if (args.indexOf('print') > -1) {
        timecard.print(function (err) {
            if (err) {
                console.log(err.message);
            }
        });
    }

}


/**
 * Pretty-print Timecard's help information with `timecard --help`
 *
 */
function showHelp(){
    console.log(multiline(function () {
/*


    Record your project development time.

    Get timecard setup with the `new` command, then use the `clockin` and `clockout` commands
    to record your time. When you want to see a summary of your time, use the `print` command.

    Commands
        timecard new            setup a blank timecard for your project
        timecard clockin        set the start time
        timecard clockout       set the end time
        timecard print          print a summary of your time

    Options
        -h, --help              Show this help message
        -v, --version           Show the current timecard version


*/

    }));
}


/**
 * Collect the arguments and options from the command line.
 *
 */
if (process.stdin.isTTY) {
    init(args, options);
} else {
    getStdin(function (data) {
        [].push.apply(args, data.trim().split(/\r?\n/));
        init(args, options);
    });
}











