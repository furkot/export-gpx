const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const gpx = require('../');

function readFileSync(name) {
  return fs.readFileSync(path.resolve(__dirname, name), 'utf8');
}

function readJSON(name) {
  return JSON.parse(readFileSync(name));
}

function copy(t) {
  if (typeof t !== 'object') {
    return t;
  }
  if (Array.isArray(t)) {
    return t.map(copy);
  }
  return Object.keys(t).reduce((result, key) => {
    result[key] = copy(t[key]);
    return result;
  }, {});
}

function generateGPX(data) {
  return Array.from(gpx(data)).join('');
}

function iconsToWaypoints() {
  return {
    metadata: {},
    waypoints: readJSON('./fixtures/icons.json')
      .map((name, i) => {
        return (
          name && {
            name,
            sym: i,
            coordinates: {
              lat: 10 + Math.floor(i / 12) / 100,
              lon: 170 + (i % 12) / 100
            }
          }
        );
      })
      .filter(wpt => wpt)
  };
}

test('simple trip', t => {
  const data = readJSON('./fixtures/simple-trip.json');
  const expected = readFileSync('./fixtures/simple.gpx');
  const generated = generateGPX(data);
  t.assert.ok(generated);
  t.assert.equal(generated, expected);
});

test('multi trip', t => {
  const data = readJSON('./fixtures/multi-trip.json');
  const expected = readFileSync('./fixtures/multi.gpx');
  const generated = generateGPX(data);
  t.assert.ok(generated);
  t.assert.equal(generated, expected);
});

test('empty polyline', t => {
  const data = readJSON('./fixtures/empty-polyline.json');

  const generated = generateGPX(data);
  t.assert.ok(generated);
});

test('overview routes', t => {
  const data = readJSON('./fixtures/overview-routes.json');
  const expected = readFileSync('./fixtures/points.gpx');

  const generated = generateGPX(data);
  t.assert.ok(generated);
  t.assert.equal(generated, expected);
});

test('pass-thru/skip trip', t => {
  const data = copy(readJSON('./fixtures/pass-thru-skip-multi-night-trip.json'));
  const expected = readFileSync('./fixtures/pass-thru-skip-multi-night.gpx');

  const generated = generateGPX(data);
  t.assert.ok(generated);
  t.assert.equal(generated, expected);
});

test('guru pass-thru/skip trip', t => {
  const data = copy(readJSON('./fixtures/pass-thru-skip-multi-night-trip.json'));
  const expected = readFileSync('./fixtures/guru.gpx');

  data.options = 'galileo';
  const generated = generateGPX(data);
  t.assert.ok(generated);
  t.assert.equal(generated, expected);
});

test('garmin pass-thru/skip trip', t => {
  const data = copy(readJSON('./fixtures/pass-thru-skip-multi-night-trip.json'));
  const expected = readFileSync('./fixtures/garmin-pass-thru-skip-multi-night.gpx');

  data.options = 'garmin';
  const generated = generateGPX(data);
  t.assert.ok(generated);
  t.assert.equal(generated, expected);
});

test('osmand pass-thru/skip trip', t => {
  const data = copy(readJSON('./fixtures/pass-thru-skip-multi-night-trip.json'));
  delete data.routes;
  const expected = readFileSync('./fixtures/osmand-pass-thru-skip-multi-night.gpx');

  data.options = 'osmand';
  const generated = generateGPX(data);
  // fs.writeFileSync(path.join(__dirname, './fixtures/osmand-pass-thru-skip-multi-night.gpx'), generated);
  t.assert.ok(generated);
  t.assert.equal(generated, expected);
});

test('garmin routes', t => {
  const data = copy(readJSON('./fixtures/overview-routes.json'));
  const expected = readFileSync('./fixtures/garmin.gpx');

  data.options = 'garmin';
  data.RoutePointExtension = true;
  data.routes[0].points[data.routes[0].points.length - 1].custom = true;
  const generated = generateGPX(data);
  t.assert.ok(generated);
  t.assert.equal(generated, expected);
});

test('garmin no name', t => {
  const data = copy(readJSON('./fixtures/overview-routes.json'));
  const expected = readFileSync('./fixtures/garmin-no-name.gpx');

  delete data.metadata.name;
  data.options = 'garmin';
  data.RoutePointExtension = true;
  const generated = generateGPX(data);
  t.assert.ok(generated);
  t.assert.equal(generated, expected);
});

test('garmin no RoutePointExtension', t => {
  const data = copy(readJSON('./fixtures/overview-routes.json'));
  const expected = readFileSync('./fixtures/garmin-no-rPtEx.gpx');

  data.options = 'garmin';
  const generated = generateGPX(data);
  t.assert.ok(generated);
  t.assert.equal(generated, expected);
});

test('garmin route transportation mode', t => {
  const data = copy(readJSON('./fixtures/overview-routes.json'));
  const expected = readFileSync('./fixtures/garmin-rtTrMd.gpx');

  data.options = 'garmin';
  data.routes[0].mode = 3;
  data.routes[data.routes.length - 1].mode = 0;
  const generated = generateGPX(data);
  t.assert.ok(generated);
  t.assert.equal(generated, expected);
});

test('garmin via point transportation mode', t => {
  const data = copy(readJSON('./fixtures/overview-routes.json'));
  const expected = readFileSync('./fixtures/garmin-vpTrMd.gpx');
  let rt;

  data.options = 'garmin';
  rt = data.routes[0];
  rt.points[rt.points.length - 1].mode = 2;
  rt = data.routes[data.routes.length - 1];
  rt.mode = 0;
  rt.points[rt.points.length - 1].mode = 3;
  const generated = generateGPX(data);
  t.assert.ok(generated);
  t.assert.equal(generated, expected);
});

test('garmin all icons', t => {
  const data = iconsToWaypoints();
  const expected = readFileSync('./fixtures/garmin-icons.gpx');
  data.options = 'garmin';
  const generated = generateGPX(data);
  // fs.writeFileSync(path.join(__dirname, './fixtures/garmin-icons.gpx'), generated);
  t.assert.ok(generated);
  t.assert.equal(generated, expected);
});

test('guru all icons', t => {
  const data = iconsToWaypoints();
  const expected = readFileSync('./fixtures/guru-icons.gpx');
  data.options = 'galileo';
  const generated = generateGPX(data);
  //fs.writeFileSync(path.join(__dirname, './fixtures/guru-icons.gpx'), generated);
  t.assert.ok(generated);
  t.assert.equal(generated, expected);
});

test('osmand all icons', t => {
  const data = iconsToWaypoints();
  const expected = readFileSync('./fixtures/osmand-icons.gpx');
  data.options = 'osmand';
  const generated = generateGPX(data);
  // fs.writeFileSync(path.join(__dirname, './fixtures/osmand-icons.gpx'), generated);
  t.assert.ok(generated);
  t.assert.equal(generated, expected);
});
