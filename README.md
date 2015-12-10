## Node Package to upload Census TIGER and Cartographic Shapefiles to a PostgreSQL / PostGIS database.

Relies on having the command line utility **shp2pgsql** already installed

If you don't have shp2pgsql (and are running Ubuntu):

```
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get upgrade
```

Then:

```
sudo apt-get install postgis
```

Other packages may include shp2pgsql.  However, I have found the above works if you're not interested in having PostgreSQL installed on your machine (ex: using remote DB).


####Simple instructions:

TBD
