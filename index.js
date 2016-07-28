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
    process.stdout.write(child_process.execSync("shp2pgsql -W 'latin1' -s 4326 shp/tiger_pl_14.shp tiger.place | psql -d " + obj.db + " -U " + obj.name + " -h " + obj.host + " -p " + obj.port, {
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
        
var sql = "alter table carto.bg add column geonum bigint; update carto.bg set geonum = ('1' || geoid)::bigint; alter table carto.bg add column state integer; update carto.bg set state=statefp::integer; alter table carto.bg add column county integer; update carto.bg set county=countyfp::integer; alter table carto.bg rename column name to geoname; alter table carto.bg rename column tractce to tract; alter table carto.bg rename column blkgrpce to bg; alter table carto.bg drop column statefp; alter table carto.bg drop column countyfp; CREATE INDEX carto_bg_geoid ON carto.bg USING btree (geoid); CREATE UNIQUE INDEX carto_bg_geonum_idx ON carto.bg USING btree (geonum); CREATE INDEX carto_bg_state_idx ON carto.bg USING btree (state); CREATE INDEX bg_geom_gist ON carto.bg USING gist (geom);" +
   
"alter table carto.county add column geonum bigint; update carto.county set geonum = ('1' || geoid)::bigint; alter table carto.county rename column name to geoname; alter table carto.county add column state integer; update carto.county set state=statefp::integer; alter table carto.county add column county integer; update carto.county set county=countyfp::integer; alter table carto.county drop column statefp; alter table carto.county drop column countyfp; CREATE INDEX carto_county_geoid ON carto.county USING btree (geoid); CREATE UNIQUE INDEX carto_county_geonum_idx ON carto.county USING btree (geonum); CREATE INDEX carto_county_state_idx ON carto.county USING btree (state); CREATE INDEX county_geom_gist ON carto.county USING gist (geom);" +  
    
"alter table carto.place add column geonum bigint; update carto.place set geonum = ('1' || geoid)::bigint; alter table carto.place rename column name to geoname; alter table carto.place add column state integer; update carto.place set state=statefp::integer; alter table carto.place add column place integer; update carto.place set place=placefp::integer; alter table carto.place drop column statefp; alter table carto.place drop column placefp; CREATE INDEX carto_place_geoid ON carto.place USING btree (geoid); CREATE UNIQUE INDEX carto_place_geonum_idx ON carto.place USING btree (geonum); CREATE INDEX carto_place_state_idx ON carto.place USING btree (state); CREATE INDEX place_geom_gist ON carto.place USING gist (geom);" +

"alter table carto.state add column geonum bigint; update carto.state set geonum = ('1' || geoid)::bigint; alter table carto.state rename column name to geoname; alter table carto.state add column state integer; update carto.state set state=statefp::integer; alter table carto.state rename column stusps to abbrev; alter table carto.state drop column statefp; CREATE INDEX carto_state_geoid ON carto.state USING btree (geoid); CREATE UNIQUE INDEX carto_state_geonum_idx ON carto.state USING btree (geonum); CREATE INDEX carto_state_state_idx ON carto.state USING btree (state); CREATE INDEX state_geom_gist ON carto.state USING gist (geom);" +

"alter table carto.tract add column geonum bigint; update carto.tract set geonum = ('1' || geoid)::bigint; alter table carto.tract rename column name to geoname; alter table carto.tract add column state integer; update carto.tract set state=statefp::integer; alter table carto.tract add column county integer; update carto.tract set county=countyfp::integer; alter table carto.tract rename column tractce to tract; alter table carto.tract drop column statefp; alter table carto.tract drop column countyfp; CREATE INDEX carto_tract_geoid ON carto.tract USING btree (geoid); CREATE UNIQUE INDEX carto_tract_geonum_idx ON carto.tract USING btree (geonum); CREATE INDEX carto_tract_state_idx ON carto.tract USING btree (state); CREATE INDEX tract_geom_gist ON carto.tract USING gist (geom);" +

"alter table tiger.bg add column geonum bigint; update tiger.bg set geonum = ('1' || geoid)::bigint; alter table tiger.bg add column state integer; update tiger.bg set state=statefp::integer; alter table tiger.bg add column county integer; update tiger.bg set county=countyfp::integer; alter table tiger.bg rename column namelsad to geoname; alter table tiger.bg rename column tractce to tract; alter table tiger.bg rename column blkgrpce to bg; alter table tiger.bg drop column statefp; alter table tiger.bg drop column countyfp; CREATE INDEX bg_geom_gist ON tiger.bg USING gist (geom); CREATE INDEX tiger_bg_geoid ON tiger.bg USING btree (geoid); CREATE UNIQUE INDEX tiger_bg_geonum_idx ON tiger.bg USING btree (geonum); CREATE INDEX tiger_bg_state_idx ON tiger.bg USING btree (state);" +

"alter table tiger.county add column geonum bigint; update tiger.county set geonum = ('1' || geoid)::bigint; alter table tiger.county rename column name to geoname; alter table tiger.county add column state integer; update tiger.county set state=statefp::integer; alter table tiger.county add column county integer; update tiger.county set county=countyfp::integer; alter table tiger.county drop column statefp; alter table tiger.county drop column countyfp; CREATE INDEX county_geom_gist ON tiger.county USING gist (geom); CREATE INDEX tiger_county_geoid ON tiger.county USING btree (geoid); CREATE UNIQUE INDEX tiger_county_geonum_idx ON tiger.county USING btree (geonum); CREATE INDEX tiger_county_state_idx ON tiger.county USING btree (state);" +

"alter table tiger.place add column geonum bigint; update tiger.place set geonum = ('1' || geoid)::bigint; alter table tiger.place rename column namelsad to geoname; alter table tiger.place rename column name to geoname_simple; alter table tiger.place add column state integer; update tiger.place set state=statefp::integer; alter table tiger.place add column place integer; update tiger.place set place=placefp::integer; alter table tiger.place drop column statefp; alter table tiger.place drop column placefp; CREATE INDEX place_geom_gist ON tiger.place USING gist (geom); CREATE INDEX tiger_place_geoid ON tiger.place USING btree (geoid); CREATE UNIQUE INDEX tiger_place_geonum_idx ON tiger.place USING btree (geonum); CREATE INDEX tiger_place_state_idx ON tiger.place USING btree (state);" +

"alter table tiger.state add column geonum bigint; update tiger.state set geonum = ('1' || geoid)::bigint; alter table tiger.state rename column name to geoname; alter table tiger.state add column state integer; update tiger.state set state=statefp::integer; alter table tiger.state rename column stusps to abbrev; CREATE INDEX state_geom_gist ON tiger.state USING gist (geom); CREATE INDEX tiger_state_geoid ON tiger.state USING btree (geoid); CREATE UNIQUE INDEX tiger_state_geonum_idx ON tiger.state USING btree (geonum); CREATE INDEX tiger_state_state_idx ON tiger.state USING btree (state);" +

"alter table tiger.tract add column geonum bigint; update tiger.tract set geonum = ('1' || geoid)::bigint; alter table tiger.tract rename column namelsad to geoname; alter table tiger.tract rename column name to simple_name; alter table tiger.tract add column state integer; update tiger.tract set state=statefp::integer; alter table tiger.tract add column county integer; update tiger.tract set county=countyfp::integer; alter table tiger.tract rename column tractce to tract; alter table tiger.tract drop column statefp; alter table tiger.tract drop column countyfp; CREATE INDEX tiger_tract_geoid ON tiger.tract USING btree (geoid); CREATE UNIQUE INDEX tiger_tract_geonum_idx ON tiger.tract USING btree (geonum); CREATE INDEX tiger_tract_state_idx ON tiger.tract USING btree (state); CREATE INDEX tract_geom_gist ON tiger.tract USING gist (geom);";

client.connect();

var query = client.query(sql);

query.on('end', function() {
client.end();
console.log('end manipulation');
cleanup();
});

    
}



function cleanup() {

    rmdir('shp', function(err, dirs, files) {
        console.log('all shp directory files are removed');
    });

}