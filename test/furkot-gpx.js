const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const gpx = require('../');

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

function iconsToWaypoints() {
  return {
    metadata: {},
    waypoints: require('./fixtures/icons.json').map((name, i) => {
      return name && {
        name,
        sym: i,
        coordinates: {
          lat: 10 + Math.floor(i / 12) / 100,
          lon: 170 + (i % 12) / 100
        }
      };
    }).filter(wpt => wpt)
  };
}

describe('furkot-gpx node module', function () {

  it('simple trip', function () {
    const t = require('./fixtures/simple-trip.json');
    const expected = readFileSync('./fixtures/simple.gpx');
    const generated = generateGPX(t);
    assert(generated);
    assert.equal(generated, expected);
  });

  it('multi trip', function () {
    const t = require('./fixtures/multi-trip.json');
    const expected = readFileSync('./fixtures/multi.gpx');
    const generated = generateGPX(t);
    assert(generated);
    assert.equal(generated, expected);
  });

  it('empty polyline', function () {
    const t = require('./fixtures/empty-polyline.json');

    const generated = generateGPX(t);
    assert(generated);
  });

  it('overview routes', function () {
    const t = require('./fixtures/overview-routes.json');
    const expected = readFileSync('./fixtures/points.gpx');

    const generated = generateGPX(t);
    assert(generated);
    assert.equal(generated, expected);
  });

  it('pass-thru/skip trip', function () {
    const t = copy(require('./fixtures/pass-thru-skip-multi-night-trip.json'));
    const expected = readFileSync('./fixtures/pass-thru-skip-multi-night.gpx');

    const generated = generateGPX(t);
    assert(generated);
    assert.equal(generated, expected);
  });

  it('guru pass-thru/skip trip', function () {
    const t = copy(require('./fixtures/pass-thru-skip-multi-night-trip.json'));
    const expected = readFileSync('./fixtures/guru.gpx');

    t.options = 'galileo';
    const generated = generateGPX(t);
    assert(generated);
    assert.equal(generated, expected);
  });

  it('garmin pass-thru/skip trip', function () {
    const t = copy(require('./fixtures/pass-thru-skip-multi-night-trip.json'));
    const expected = readFileSync('./fixtures/garmin-pass-thru-skip-multi-night.gpx');

    t.options = 'garmin';
    const generated = generateGPX(t);
    assert(generated);
    assert.equal(generated, expected);
  });

  it('osmand pass-thru/skip trip', function () {
    const t = copy(require('./fixtures/pass-thru-skip-multi-night-trip.json'));
    delete t.routes;
    const expected = readFileSync('./fixtures/osmand-pass-thru-skip-multi-night.gpx');

    t.options = 'osmand';
    const generated = generateGPX(t);
    // fs.writeFileSync(path.join(__dirname, './fixtures/osmand-pass-thru-skip-multi-night.gpx'), generated);
    assert(generated);
    assert.equal(generated, expected);
  });

  it('garmin routes', function () {
    const t = copy(require('./fixtures/overview-routes.json'));
    const expected = readFileSync('./fixtures/garmin.gpx');

    t.options = 'garmin';
    t.RoutePointExtension = true;
    t.routes[0].points[t.routes[0].points.length - 1].custom = true;
    const generated = generateGPX(t);
    assert(generated);
    assert.equal(generated, expected);
  });

  it('garmin no name', function () {
    const t = copy(require('./fixtures/overview-routes.json'));
    const expected = readFileSync('./fixtures/garmin-no-name.gpx');

    delete t.metadata.name;
    t.options = 'garmin';
    t.RoutePointExtension = true;
    const generated = generateGPX(t);
    assert(generated);
    assert.equal(generated, expected);
  });

  it('garmin no RoutePointExtension', function () {
    const t = copy(require('./fixtures/overview-routes.json'));
    const expected = readFileSync('./fixtures/garmin-no-rPtEx.gpx');

    t.options = 'garmin';
    const generated = generateGPX(t);
    assert(generated);
    assert.equal(generated, expected);
  });

  it('garmin route transportation mode', function () {
    const t = copy(require('./fixtures/overview-routes.json'));
    const expected = readFileSync('./fixtures/garmin-rtTrMd.gpx');

    t.options = 'garmin';
    t.routes[0].mode = 3;
    t.routes[t.routes.length - 1].mode = 0;
    const generated = generateGPX(t);
    assert(generated);
    assert.equal(generated, expected);
  });

  it('garmin via point transportation mode', function () {
    const t = copy(require('./fixtures/overview-routes.json'));
    const expected = readFileSync('./fixtures/garmin-vpTrMd.gpx');
    let rt;

    t.options = 'garmin';
    rt = t.routes[0];
    rt.points[rt.points.length - 1].mode = 2;
    rt = t.routes[t.routes.length - 1];
    rt.mode = 0;
    rt.points[rt.points.length - 1].mode = 3;
    const generated = generateGPX(t);
    assert(generated);
    assert.equal(generated, expected);
  });

  it('garmin all icons', function () {
    const t = iconsToWaypoints();
    const expected = readFileSync('./fixtures/garmin-icons.gpx');
    t.options = 'garmin';
    const generated = generateGPX(t);
    // fs.writeFileSync(path.join(__dirname, './fixtures/garmin-icons.gpx'), generated);
    assert(generated);
    assert.equal(generated, expected);
  });

  it('guru all icons', function () {
    const t = iconsToWaypoints();
    const expected = readFileSync('./fixtures/guru-icons.gpx');
    t.options = 'galileo';
    const generated = generateGPX(t);
    //fs.writeFileSync(path.join(__dirname, './fixtures/guru-icons.gpx'), generated);
    assert(generated);
    assert.equal(generated, expected);
  });

  it('osmand all icons', function () {
    const t = iconsToWaypoints();
    const expected = readFileSync('./fixtures/osmand-icons.gpx');
    t.options = 'osmand';
    const generated = generateGPX(t);
    // fs.writeFileSync(path.join(__dirname, './fixtures/osmand-icons.gpx'), generated);
    assert(generated);
    assert.equal(generated, expected);
  });
});
