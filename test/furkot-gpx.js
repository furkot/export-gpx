var should = require('should');
var fs = require('fs');
var path = require('path');
var WritableStreamBuffer = require('stream-buffers').WritableStreamBuffer;

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

function generateGPX(t, fn) {
  var ostream = new WritableStreamBuffer();
  gpx(ostream, t);
  ostream
  .on('error', fn)
  .on('finish', function() {
    fn(null, ostream.getContentsAsString('utf8'));
  });
}


describe('furkot-gpx node module', function () {

  it('simple trip', function(done) {
    var t = require('./fixtures/simple-trip.json'),
      expected = readFileSync('./fixtures/simple.gpx');
    generateGPX(t, function(err, generated) {
      should.exist(generated);
      generated.should.eql(expected);
      done(err);
    });
  });

  it('multi trip', function(done) {
    var t = require('./fixtures/multi-trip.json'),
      expected = readFileSync('./fixtures/multi.gpx');
    generateGPX(t, function(err, generated) {
      should.exist(generated);
      generated.should.eql(expected);
      done(err);
    });
  });

  it('empty polyline', function(done) {
    var t = require('./fixtures/empty-polyline.json');

    generateGPX(t, function(err, generated) {
      should.exist(generated);
      done(err);
    });
  });

  it('overview routes', function(done) {
    var t = require('./fixtures/overview-routes.json'),
      expected = readFileSync('./fixtures/points.gpx');

    generateGPX(t, function(err, generated) {
      should.exist(generated);
      generated.should.eql(expected);
      done(err);
    });
  });

  it('pass-thru/skip trip', function(done) {
    var t = require('./fixtures/pass-thru-skip-multi-night-trip.json'),
      expected = readFileSync('./fixtures/pass-thru-skip-multi-night.gpx');

    generateGPX(t, function(err, generated) {
      should.exist(generated);
      generated.should.eql(expected);
      done(err);
    });
  });

  it('garmin routes', function(done) {
    var t = copy(require('./fixtures/overview-routes.json')),
      expected = readFileSync('./fixtures/garmin.gpx');

    t.options = 'garmin';
    t.RoutePointExtension = true;
    t.routes[0].points[t.routes[0].points.length - 1].custom = true;
    generateGPX(t, function(err, generated) {
      should.exist(generated);
      generated.should.equal(expected);
      done(err);
    });
  });

  it('garmin no name', function(done) {
    var t = copy(require('./fixtures/overview-routes.json')),
      expected = readFileSync('./fixtures/garmin-no-name.gpx');

    delete t.metadata.name;
    t.options = 'garmin';
    t.RoutePointExtension = true;
    generateGPX(t, function(err, generated) {
      should.exist(generated);
      generated.should.eql(expected);
      done(err);
    });
  });

  it('garmin no RoutePointExtension', function(done) {
    var t = copy(require('./fixtures/overview-routes.json')),
      expected = readFileSync('./fixtures/garmin-no-rPtEx.gpx');

    t.options = 'garmin';
    generateGPX(t, function(err, generated) {
      should.exist(generated);
      generated.should.eql(expected);
      done(err);
    });
  });

  it('garmin route transportation mode', function(done) {
    var t = copy(require('./fixtures/overview-routes.json')),
      expected = readFileSync('./fixtures/garmin-rtTrMd.gpx');

    t.options = 'garmin';
    t.routes[0].mode = 3;
    t.routes[t.routes.length - 1].mode = 0;
    generateGPX(t, function(err, generated) {
      should.exist(generated);
      generated.should.eql(expected);
      done(err);
    });
  });

  it('garmin via point transportation mode', function(done) {
      var t = copy(require('./fixtures/overview-routes.json')),
        expected = readFileSync('./fixtures/garmin-vpTrMd.gpx'),
        rt;

      t.options = 'garmin';
      rt = t.routes[0];
      rt.points[rt.points.length - 1].mode = 2;
      rt = t.routes[t.routes.length - 1];
      rt.mode = 0;
      rt.points[rt.points.length - 1].mode = 3;
      generateGPX(t, function(err, generated) {
        should.exist(generated);
        generated.should.eql(expected);
        done(err);
      });
    });
});
