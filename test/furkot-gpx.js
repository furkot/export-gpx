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
    return t.map(copy);
  }
  return Object.keys(t).reduce(function (result, key) {
    result[key] = copy(t[key]);
    return result;
  }, {});
}

function generateGPX(t) {
  return Array.from(gpx(t)).join('');
}


describe('furkot-gpx node module', function () {

  it('simple trip', function () {
    var t = require('./fixtures/simple-trip.json'),
      expected = readFileSync('./fixtures/simple.gpx');
    var generated = generateGPX(t);
    should.exist(generated);
    generated.should.eql(expected);
  });

  it('multi trip', function () {
    var t = require('./fixtures/multi-trip.json'),
      expected = readFileSync('./fixtures/multi.gpx');
    var generated = generateGPX(t);
    should.exist(generated);
    generated.should.eql(expected);
  });

  it('empty polyline', function () {
    var t = require('./fixtures/empty-polyline.json');

    var generated = generateGPX(t);
    should.exist(generated);
  });

  it('overview routes', function () {
    var t = require('./fixtures/overview-routes.json'),
      expected = readFileSync('./fixtures/points.gpx');

    var generated = generateGPX(t);
    should.exist(generated);
    generated.should.eql(expected);
  });

  it('pass-thru/skip trip', function () {
    var t = copy(require('./fixtures/pass-thru-skip-multi-night-trip.json')),
      expected = readFileSync('./fixtures/pass-thru-skip-multi-night.gpx');

    var generated = generateGPX(t);
    should.exist(generated);
    generated.should.eql(expected);
  });

  it('galileo pass-thru/skip trip', function () {
    var t = copy(require('./fixtures/pass-thru-skip-multi-night-trip.json')),
      expected = readFileSync('./fixtures/galileo.gpx');

    t.options = 'galileo';
    var generated = generateGPX(t);
    should.exist(generated);
    generated.should.eql(expected);
  });

  it('garmin routes', function () {
    var t = copy(require('./fixtures/overview-routes.json')),
      expected = readFileSync('./fixtures/garmin.gpx');

    t.options = 'garmin';
    t.RoutePointExtension = true;
    t.routes[0].points[t.routes[0].points.length - 1].custom = true;
    var generated = generateGPX(t);
    should.exist(generated);
    generated.should.equal(expected);
  });

  it('garmin no name', function () {
    var t = copy(require('./fixtures/overview-routes.json')),
      expected = readFileSync('./fixtures/garmin-no-name.gpx');

    delete t.metadata.name;
    t.options = 'garmin';
    t.RoutePointExtension = true;
    var generated = generateGPX(t);
    should.exist(generated);
    generated.should.eql(expected);
  });

  it('garmin no RoutePointExtension', function () {
    var t = copy(require('./fixtures/overview-routes.json')),
      expected = readFileSync('./fixtures/garmin-no-rPtEx.gpx');

    t.options = 'garmin';
    var generated = generateGPX(t);
    should.exist(generated);
    generated.should.eql(expected);
  });

  it('garmin route transportation mode', function () {
    var t = copy(require('./fixtures/overview-routes.json')),
      expected = readFileSync('./fixtures/garmin-rtTrMd.gpx');

    t.options = 'garmin';
    t.routes[0].mode = 3;
    t.routes[t.routes.length - 1].mode = 0;
    var generated = generateGPX(t);
    should.exist(generated);
    generated.should.eql(expected);
  });

  it('garmin via point transportation mode', function () {
    var t = copy(require('./fixtures/overview-routes.json')),
      expected = readFileSync('./fixtures/garmin-vpTrMd.gpx'),
      rt;

    t.options = 'garmin';
    rt = t.routes[0];
    rt.points[rt.points.length - 1].mode = 2;
    rt = t.routes[t.routes.length - 1];
    rt.mode = 0;
    rt.points[rt.points.length - 1].mode = 3;
    var generated = generateGPX(t);
    should.exist(generated);
    generated.should.eql(expected);
  });
});
