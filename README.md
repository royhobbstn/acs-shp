## Node Package to upload Census TIGER and Cartographic Shapefiles to a PostgreSQL / PostGIS database.

This package will upload 5 tiger shapefiles, and 5 cartographic boundary files into a database (assumed precreated) titled acs1014.  The levels of geography loaded are states, counties, places, tracts, and block groups for the entire United States.

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

```
PGPASSWORD=demography acs-shp14
```

If you exclude PGPASSWORD, you will be prompted for you db password for each uploaded shapefile (10 times!)

Be sure that the postgis extension is enabled on your database!

