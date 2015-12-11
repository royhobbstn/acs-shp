#! /usr/bin/env node

console.log('acs-shp');

/*jslint node: true */
"use strict";


var fs = require('fs');
var mkdirp = require('mkdirp');
var rmdir = require('rmdir');

var exec = require('child_process').exec;
var EventEmitter = require('events').EventEmitter;
var filesEE = new EventEmitter();
var request = require('request');
var unzip = require('unzip');

var pg = require('pg');

var child_process = require('child_process');

var unzippedcount = 0;

var obj = JSON.parse(fs.readFileSync('connection.json', 'utf8'));

var conString = "postgres://" + obj.name + ":" + obj.password + "@" + obj.host + ":" + obj.port + "/" + obj.db;




var client = new pg.Client(conString);


//create temp directories
mkdirp('shp', function(err) {

    // path was created unless there was error
    if (err) {
        console.log("Error:" + err);
    } else {
        console.log('shp directory created');

        //start downloading files

        var makerequest = function(root, filename) {

            request(root + filename)
                .pipe(fs.createWriteStream('shp/' + filename))
                .on('close', function() {
                    console.log(filename + ' written!');



                    var unzipStream = fs.createReadStream('shp/' + filename).pipe(unzip.Extract({
                        path: 'shp/'
                    }));


                    unzipStream.on('close', function() {

                        console.log(filename + ' unzipped!');
                        unzippedcount++;

                    });


                });

        }


        makerequest('http://www2.census.gov/geo/tiger/GENZ2014/shp/', 'cb_2014_us_county_500k.zip'); //county CARTO
        makerequest('http://www2.census.gov/geo/tiger/GENZ2014/shp/', 'cb_2014_us_state_500k.zip'); //state CARTO          
        makerequest('https://s3-us-west-2.amazonaws.com/acs14geo/', 'carto_bg_14.zip'); //bg CARTO
        makerequest('https://s3-us-west-2.amazonaws.com/acs14geo/', 'carto_pl_14.zip'); //pl CARTO   
        makerequest('https://s3-us-west-2.amazonaws.com/acs14geo/', 'carto_tr_14.zip'); //tr CARTO       

        makerequest('http://ftp2.census.gov/geo/tiger/TIGER2014/COUNTY/', 'tl_2014_us_county.zip'); //county TIGER
        makerequest('http://ftp2.census.gov/geo/tiger/TIGER2014/STATE/', 'tl_2014_us_state.zip'); //state TIGER
        makerequest('https://s3-us-west-2.amazonaws.com/acs14geo/', 'tiger_bg_14.zip'); //bg TIGER
        makerequest('https://s3-us-west-2.amazonaws.com/acs14geo/', 'tiger_pl_14.zip'); //pl TIGER      
        makerequest('https://s3-us-west-2.amazonaws.com/acs14geo/', 'tiger_tr_14.zip'); //tr TIGER


    }

});

//wait for all files to be uploaded and unzipped.  Then move them to postgres.
function check() {
    console.log('unzipped files: ' + unzippedcount);

    if (unzippedcount < 10) {
        setTimeout(check, 1000); // call again in 1 second
    } else {

        prepare();

    }


}

check();


function prepare() {
    console.log('prepare schemas')
    client.connect();

    var query = client.query("CREATE SCHEMA IF NOT EXISTS tiger; CREATE SCHEMA IF NOT EXISTS carto;");

    query.on('end', function() {
        client.end();
        console.log('schemas created');
        upload();
    });

}

function upload() {
    //all synchronous

    console.log('uploading using shp2pgsql');


    process.stdout.write(child_process.execSync("shp2pgsql -W 'latin1' -s 4326 shp/cb_2014_us_county_500k.shp carto.county | psql -d " + obj.db + " -U " + obj.name + " -h " + obj.host + " -p " + obj.port, {
        encoding: 'utf8'
    }));
    console.log('carto county uploaded');
    process.stdout.write(child_process.execSync("shp2pgsql -W 'latin1' -s 4326 shp/cb_2014_us_state_500k.shp carto.state | psql -d " + obj.db + " -U " + obj.name + " -h " + obj.host + " -p " + obj.port, {
        encoding: 'utf8'
    }));
    console.log('carto state uploaded');
    process.stdout.write(child_process.execSync("shp2pgsql -W 'latin1' -s 4326 shp/carto_bg_14.shp carto.bg | psql -d " + obj.db + " -U " + obj.name + " -h " + obj.host + " -p " + obj.port, {
        encoding: 'utf8'
    }));
    console.log('carto bg uploaded');
    process.stdout.write(child_process.execSync("shp2pgsql -W 'latin1' -s 4326 shp/carto_pl_14.shp carto.place | psql -d " + obj.db + " -U " + obj.name + " -h " + obj.host + " -p " + obj.port, {
        encoding: 'utf8'
    }));
    console.log('carto place uploaded');
    process.stdout.write(child_process.execSync("shp2pgsql -W 'latin1' -s 4326 shp/carto_tr_14.shp carto.tract | psql -d " + obj.db + " -U " + obj.name + " -h " + obj.host + " -p " + obj.port, {
        encoding: 'utf8'
    }));
    console.log('carto tract uploaded');


    process.stdout.write(child_process.execSync("shp2pgsql -W 'latin1' -s 4326 shp/tl_2014_us_county.shp tiger.county | psql -d " + obj.db + " -U " + obj.name + " -h " + obj.host + " -p " + obj.port, {
        encoding: 'utf8'
    }));
    console.log('tiger county uploaded');
    process.stdout.write(child_process.execSync("shp2pgsql -W 'latin1' -s 4326 shp/tl_2014_us_state.shp tiger.state | psql -d " + obj.db + " -U " + obj.name + " -h " + obj.host + " -p " + obj.port, {
        encoding: 'utf8'
    }));
    console.log('tiger state uploaded');
    process.stdout.write(child_process.execSync("shp2pgsql -W 'latin1' -s 4326 shp/tiger_bg_14.shp tiger.bg | psql -d " + obj.db + " -U " + obj.name + " -h " + obj.host + " -p " + obj.port, {
        encoding: 'utf8'
    }));
    console.log('tiger bg uploaded');
    process.stdout.writeSync(child_process.execSync("shp2pgsql -W 'latin1' -s 4326 shp/tiger_pl_14.shp tiger.place | psql -d " + obj.db + " -U " + obj.name + " -h " + obj.host + " -p " + obj.port, {
        encoding: 'utf8'
    }));
    console.log('tiger place uploaded');
    process.stdout.write(child_process.execSync("shp2pgsql -W 'latin1' -s 4326 shp/tiger_tr_14.shp tiger.tract | psql -d " + obj.db + " -U " + obj.name + " -h " + obj.host + " -p " + obj.port, {
        encoding: 'utf8'
    }));
    console.log('tiger tract uploaded');


    console.log('done uploading');


    manipulate();


}


//manipulate the attributes
//add keys and index
function manipulate() {
    console.log('beginning data manipulation')
        //     client.connect();

    //     var query = client.query("");

    //     query.on('end', function() {
    //         client.end();
    //         console.log('end manipulation');
    //         cleanup();
    //     });

    //cleanup();
}



function cleanup() {

    rmdir('shp', function(err, dirs, files) {
        console.log('all shp directory files are removed');
    });

}