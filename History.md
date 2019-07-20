
4.2.1 / 2019-07-19
==================

 * furkot-galileo-data 1.0.0 -> 1.0.1
 * remove all Garmin extensions from standard GPX files

4.2.0 / 2019-01-17
==================

 * add support for Galileo symbols and colors
 * furkot-galileo-data 1.0.0
 * refactor mapping waypoint symbols and track colors

4.1.0 / 2018-07-25
==================

 * switch to 6 significant digits

4.0.3 / 2017-12-09
==================

 * fix order of link element under metadata

4.0.2 / 2017-08-30
==================

 * fix out-of-memory error when generating large GPX
 * allow using ES6 syntax

4.0.1 / 2017-07-24
==================

 * map Flight travel mode to Garmin Direct mode

4.0.0 / 2017-07-18
==================

 * generate GPX using gexode streaming mode, stop using Jade

3.0.1 / 2017-02-19
==================

 * emit ShapingPoints when RoutePointExtension is in effect

3.0.0 / 2016-12-19
==================

 * change coordinate order in track representation to longitude, latitude

2.0.10 / 2016-12-01
===================

 * use furkot-garmin-data module

2.0.9 / 2016-11-20
==================

 * emit only ViaPoints when RoutePointExtension is in effect

2.0.8 / 2016-11-12
==================

 * set RoutePointExtension Subclass entry for off-road points

2.0.7 / 2016-07-08
==================

 * always add ViaPointTransportationMode when stop mode is set

2.0.6 / 2016-07-07
==================

 * support Garmin extension schema ViaPointTransportationMode
 * fix Garmin transportation mode per route

2.0.5 / 2016-03-23
==================

 * Garmin counterparts for added pin icons

2.0.4 / 2016-02-04
==================

 * add Transparent color

2.0.3 / 2015-10-25
==================

 * emit waypoint field 'tags' as Garmin extension tag 'Categories'

2.0.2 / 2015-08-28
==================

 * export track color
 * expect absolute urls to be provided on input

2.0.1 / 2015-06-20
==================

 * don't emit <gpxx:RoutePointExtension> elements until valid value of it's subelement <gpxx:Subclass> can be determined
 * <tmd:TripName> is a mandatory element according to the schema

2.0.0 / 2015-06-16
==================

 * expect timing data as UTC timestamps

1.2.1 / 2015-06-15
==================

 * account for timezone when generating timestamps

1.2.0 / 2015-06-12
==================

 * remove Furkot-specific extensions
 * more Garmin-specific extensions
 * different content of waypoint cmt and desc elements for Garmin-specific vs. standard GPX 1.1 files

1.1.0 / 2015-05-20
==================

 * Garmin-specific routing

1.0.0 / 2015-05-16
==================

 * limit coordinates precision to 5 decimal points

0.2.1 / 2015-05-14
==================

 * fix exports

0.2.0 / 2015-05-14
==================

 * export extension and content-type

0.1.0 / 2015-05-13
==================

 * initial implementation and tests
