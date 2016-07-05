var should = require('should');
var fs = require('fs');
var path = require('path');

var gpx = require('../');

function readFileSync(name) {
  return fs.readFileSync(path.join(__dirname, name), 'utf8');
}

function copy(t) {
  if (typeof t !== 'object') {
    return t;
  }
  if (Array.isArray(t)) {
    return t.slice(0);
  }
  return Object.keys(t).reduce(function (result, key) {
    result[key] = copy(t[key]);
    return result;
  }, {});
}

describe('furkot-gpx node module', function () {

  it('simple trip', function() {
    var t = require('./fixtures/simple-trip.json'),
      expected = readFileSync('./fixtures/simple.gpx'),
      generated = gpx(t);
    should.exist(generated);
    generated.should.eql(expected);
  });

  it('multi trip', function() {
    var t = require('./fixtures/multi-trip.json'),
      expected = readFileSync('./fixtures/multi.gpx'),
      generated = gpx(t);
    should.exist(generated);
    generated.should.eql(expected);
  });

  it('empty polyline', function () {
    var t = require('./fixtures/empty-polyline.json');
    should.exist(gpx(t));
  });

  it('overview routes', function() {
    var t = require('./fixtures/overview-routes.json'),
      expected = readFileSync('./fixtures/points.gpx'),
      generated = gpx(t);
    should.exist(generated);
    generated.should.eql(expected);
  });

  it('pass-thru/skip trip', function() {
    var t = require('./fixtures/pass-thru-skip-multi-night-trip.json'),
      expected = readFileSync('./fixtures/pass-thru-skip-multi-night.gpx'),
      generated = gpx(t);
    should.exist(generated);
    generated.should.eql(expected);
  });

  it('garmin routes', function() {
    var t = copy(require('./fixtures/overview-routes.json')),
      expected = readFileSync('./fixtures/garmin.gpx'),
      generated;
    t.options = 'garmin';
    t.RoutePointExtension = true;
    generated = gpx(t);
    should.exist(generated);
    generated.should.eql(expected);
  });
  
  it('garmin no name', function() {
    var t = copy(require('./fixtures/overview-routes.json')),
      expected = readFileSync('./fixtures/garmin-no-name.gpx'),
      generated;
    delete t.metadata.name;
    t.options = 'garmin';
    t.RoutePointExtension = true;
    generated = gpx(t);
    should.exist(generated);
    generated.should.eql(expected);
  });

  it('garmin no RoutePointExtension', function() {
    var t = copy(require('./fixtures/overview-routes.json')),
      expected = readFileSync('./fixtures/garmin-no-rPtEx.gpx'),
      generated;
    t.options = 'garmin';
    generated = gpx(t);
    should.exist(generated);
    generated.should.eql(expected);
  });

  it('garmin route transportation mode', function() {
    var t = copy(require('./fixtures/overview-routes.json')),
      expected = readFileSync('./fixtures/garmin-rtTrMd.gpx'),
      generated;
    t.options = 'garmin';
    t.routes[0].mode = 3;
    t.routes[t.routes.length - 1].mode = 0;
    generated = gpx(t);
    should.exist(generated);
    generated.should.eql(expected);
  });

});
