var jade = require('jade');
var fs = require('fs');
var garmin = require('./garmin').toGarmin;

module.exports = furkotGpx;
furkotGpx.contentType = 'application/gpx+xml';
furkotGpx.extension = 'gpx';

function getRenderFn() {
  var template = fs.readFileSync(__dirname + '/gpx.jade', 'utf8');
  return jade.compile(template, {
    pretty: true,
    compileDebug: process.env.NODE_ENV !== 'production',
    filename: __dirname + '/gpx.jade'
  });
}

var render = getRenderFn(),
  millisInDay = 24 * 60 * 60 * 1000,
  FURKOT_HOST = process.env.FURKOT_HOST,
  schema = [
    [ '', 'http://www.topografix.com/GPX/1/1',
      'http://www.topografix.com/GPX/1/1/gpx.xsd' ],
    [ 'xmlns:frkt', 'http://www.furkot.com/2014/gpx',
      'http://cdn.furkot.com/schema/gpx.xsd' ],
    [ 'xmlns:gpxx', 'http://www.garmin.com/xmlschemas/GpxExtensions/v3',
      'http://www8.garmin.com/xmlschemas/GpxExtensionsv3.xsd' ]
  ];

function getSchema(attributes) {
  var schemaLocation = [];
  schema.forEach(function (ns) {
    if (ns[0]) {
      attributes[ns[0]] = ns[1];
    }
    schemaLocation.push(ns[1], ns[2]);
    return attributes;
  }, attributes);
  attributes['xsi:schemaLocation'] = schemaLocation.join(' ');
  return attributes;
}

function absUrl(url) {
  if (url.charAt(0) === '/') {
    return FURKOT_HOST + url;
  }
  return url;
}

function streetAddress(step) {
  var address;
  if (step.streetAddress !== undefined) {
    return step.streetAddress;
  }
  if (step.address) {
    address = step.address.split(',')[0];
    if (!step.locality || address !== step.locality.town
        && address !== step.locality.province && address !== step.locality.province_long
        && address !== step.locality.country && address !== step.locality.country_long) {
      step.streetAddress = address;
      return address;
    }
    step.streetAddress = '';
    return '';
  }
}

function getTimestamp(step) {
  return new Date(step.arrival_time).toISOString();
}

function getDuration(step) {
  if (step.nights) {
    return step.nights * millisInDay + step.visit_duration;
  }
  return step.visit_duration;
}

function getSymbol(step) {
  if (step.symbol === undefined) {
    step.symbol = step.sym !== undefined ? garmin[step.sym] : '';
  }
  return step.symbol;
}

function furkotGpx(opt) {
  var options = {
    getSchema: getSchema,
    getTimestamp: getTimestamp,
    getDuration: getDuration,
    getSymbol: getSymbol,
    absUrl: absUrl,
    streetAddress: streetAddress
  };

  if (opt) {
    options.metadata = opt.metadata;
    options.tracks = opt.tracks;
    options.routes = opt.routes;
    options.waypoints = opt.waypoints;
  }

  return render(options);
}
