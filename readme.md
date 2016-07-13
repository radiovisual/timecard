# timecard

> Keep track of your project development time.

[![Build Status](https://travis-ci.org/radiovisual/timecard.svg?branch=master)](https://travis-ci.org/radiovisual/timecard) [![Coverage Status](https://coveralls.io/repos/github/radiovisual/timecard/badge.svg?branch=master)](https://coveralls.io/github/radiovisual/timecard?branch=master)

![timecard print screenshot](media/timecard-print-screenshot.png)

## Install 
```sh
$ npm install --global timecard
```

## Usage

To create a **new timecard** for your project

```
$ timecard new
```

To **clockin** (start working)

```
$ timecard clockin
```

To **clockout** (stop working)

```
$ timecard clockout
```

To see a **print summary** of your time

```
$ timecard print
```

**Tip:** If you prefer the shorthand, all of these commands have flag aliases. Check the [help output](https://github.com/radiovisual/timecard#options) for details.

 
## Notes

### `.timecard.json`

When you run the `timecard new` command, Timecard creates a hidden file called `.timecard.json`. This is the file 
where your project times are recorded.

Some important notes to consider regarding the timecard file:

1) **Version Control:** Remember to update your `.gitignore` file if you don't want the timecard file under version control.
  
2) **For Node.js developers:** If your project contains a `package.json` file, then Timecard assumes that the directory with the `package.json` file is the root directory, and places the `.timecard.json` file in the root. You can run any Timecard command from any of your project's sub-directories.

3) **Non-Node.js Projects:** (or if your project DOES NOT contain a `package.json` file), then you can still use Timecard, you will just need to make sure that you are running the Timecard commands from the same directory each time (preferably in your project root).

4) **Manual timecard edits:** Sometimes it will be necessary to update the `.timecard.json` file manually (if you forgot to clockout, for example), which is fine, just remember that this file must be valid JSON.
 
 
## Options

```
$ timecard --help
   
  Keep track of your project development time

  Get timecard setup with the 'new' command, then use the 'clockin' and 'clockout' commands
  to record your time. When you want to see a summary of your time, use the 'print' command.

  Commands
    timecard new            Setup a blank timecard for your project
    timecard clockin        Set the start time for your shift
    timecard clockout       Set the end time for your shift
    timecard print          Print a summary of your time

  Options
    -h, --help              Show this help message
    -v, --version           Show the current timecard version
    -i, --clockin           Alias for the clockin command
    -o, --clockout          Alias for the clockout command
    -n, --new               Alias for the new command
    -p, --print             Alias for the print command
    --no-prompt             Use with `new` to silence all prompts and overwrite existing timecard
       
```

## License

MIT @ [Michael Wuergler](http://numetriclabs.com)

