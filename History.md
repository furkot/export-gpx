
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
