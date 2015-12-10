#! /usr/bin/env node

console.log('acs-shp');

/*jslint node: true */
"use strict";


var fs = require('fs');
var mkdirp = require('mkdirp');

var exec = require('child_process').exec;
var EventEmitter = require('events').EventEmitter;
var filesEE = new EventEmitter();


// var cmd = 'mkdir temp';

// exec(cmd, function(error, stdout, stderr) {
//   // command output is in stdout
//   console.log('done');

// });


    //create temp directories
    mkdirp('temp', function(err) {

        // path was created unless there was error
        if (err) {
            console.log("Error:" + err);
        } else {
            console.log('temp directory created');

          //start downloading files
          
          
        }

    });