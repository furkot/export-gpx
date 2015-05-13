var should = require('should');
var fs = require('fs');
var path = require('path');

process.env.FURKOT_HOST = 'https://trips.furkot.com';
var gpx = require('../');

function readFileSync(name) {
  return fs.readFileSync(path.join(__dirname, name), 'utf8');
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
});
