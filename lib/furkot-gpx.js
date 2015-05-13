var jade = require('jade');
var fs = require('fs');
var garmin = require('./garmin').toGarmin;

module.exports = furkotGpx;

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
  FURKOT_HOST = process.env.FURKOT_HOST;

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
