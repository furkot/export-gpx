const { generator } = require('gexode');
const {
  getSchema,
  getTimestamp,
  getDeparture,
  getComment,
  streetAddress,
  isStop
} = require('./tools');

module.exports = render;

const precision = 6;

const emptyTarget = {
  getWptCmt: getComment,
  getWptSym() {},
  getWptType() {},
  getTrkType() {},
  hasWptExt() {},
  hasRteExt() {},
  hasRtePtExt() {},
  hasTrkExt() {}
};

const targets = [
  ['standard', {
    getWptSym: require('@furkot/garmin-data').getWptSym
  }],
  ['galileo', require('@furkot/guru-data')],
  ['garmin', require('@furkot/garmin-data')],
  ['osmand', require('@furkot/osmand-data')]
].reduce((result, [key, value]) => {
  result[key] = Object.assign({}, emptyTarget, value);
  return result;
}, {});

function pickTarget({ options }) {
  return targets[options] || targets.standard;
}

function* each(array, fn, thisArg) {
  if (!array) { return; }
  for (let i = 0; i < array.length; i++) {
    yield* fn.call(thisArg, array[i], i, array);
  }
}

function* render(ctx) {
  const gen = Object.assign({
    ctx,
    precision,
    each
  }, generator({ pretty: true }));
  const { header, start, el, end, elIfText } = gen;

  const {
    schema,
    getWptCmt,
    getWptSym,
    getWptType,
    getTrkType,
    hasWptExt,
    getWptExt,
    hasRteExt,
    getRteExt,
    hasRtePtExt,
    getRtePtExt,
    hasTrkExt,
    getTrkExt
  } = pickTarget(ctx);
  const $wpt_ext = getWptExt?.(gen);
  const $rte_ext = getRteExt?.(gen);
  const $rtept_ext = getRtePtExt?.(gen);
  const $trk_ext = getTrkExt?.(gen);

  const $name = elIfText.bind(undefined, 'name');

  function* $link(url) {
    if (url) {
      yield* el('link', { href: url });
    }
  }

  function* $cmt(cmt) {
    if (cmt) {
      yield* el('cmt', null, cmt);
      yield* el('desc', null, cmt);
    }
  }

  const $desc = elIfText.bind(undefined, 'desc');

  function* $author(author) {
    if (!author) { return; }

    yield* start('author');

    yield* $name(author.name);

    if (author.email) {
      yield* el('email', {
        id: author.email.id,
        domain: author.email.domain
      });
    }
    if (author.link) {
      yield* start('link', { href: author.link });
      yield* elIfText('text', author.short_name);
      yield* end();
    }

    yield* end();
  }

  function* $metadata(metadata) {
    yield* start('metadata');

    yield* $name(metadata.name);
    yield* $desc(metadata.desc);
    yield* $author(metadata.author);
    yield* $link(metadata.link);

    yield* end();
  }

  function* $waypoints(waypoints) {
    yield* each(waypoints, function* (step) {
      if (!step.coordinates) {
        return;
      }
      yield* start('wpt', {
        lat: step.coordinates.lat.toFixed(precision),
        lon: step.coordinates.lon.toFixed(precision)
      });
      yield* $waypoint(step, function* () {
        if (hasWptExt(step)) {
          yield* start('extensions');
          step.stopStreetAddress = step.stopStreetAddress || streetAddress(step);
          yield* $wpt_ext(step);
          yield* end();
        }
      });

      yield* end();
    });
  }

  function* $routes(routes) {
    yield* each(routes, $rte);
  }

  function* $tracks(tracks) {
    yield* each(tracks, $trk);
  }

  function* $waypoint(step, block) {
    if (step.arrival_time) {
      yield* elIfText('time', getTimestamp(step));
    }
    yield* $name(step.name);
    yield* $cmt(getWptCmt(step));
    yield* $link(step.url);
    yield* elIfText('sym', getWptSym(step));
    yield* elIfText('type', getWptType(step));

    yield* block();
  }

  function* $rte(route) {
    yield* start('rte');

    yield* $name(route.name);
    yield* $desc(route.desc);
    yield* $link(route.link);

    if (hasRteExt(route)) {
      yield* start('extensions');
      if (route.arrival_time) {
        route.routeTimestamp = route.routeTimestamp || getTimestamp(route);
      }
      yield* $rte_ext(route);
      yield* end();
    }

    yield* each(route.points, function* (step, index) {
      if (!step.coordinates) {
        return;
      }
      yield* start('rtept', {
        lat: step.coordinates.lat.toFixed(precision),
        lon: step.coordinates.lon.toFixed(precision)
      });

      yield* $waypoint(step, function* () {
        if (hasRtePtExt(step)) {
          if (step.stopIsActualStop === undefined) {
            step.stopIsActualStop = isStop(step);
          }
          if (step.departure_time) {
            step.stopDeparture = step.stopDeparture || getDeparture(step);
          }
          if (step.arrival_time) {
            step.stopTimestamp = step.stopTimestamp || getTimestamp(step);
          }
          yield* start('extensions');
          yield* $rtept_ext(route, step, index, route.points[index + 1]);
          yield* end();
        }
      });

      yield* end();
    });

    yield* end();
  }

  function* $trk(track) {

    yield* start('trk');

    yield* $name(track.name);
    yield* $desc(track.desc);
    yield* $link(track.link);

    if (track.points) {
      yield* elIfText('type', getTrkType(track));
      if (hasTrkExt(track)) {
        yield* start('extensions');
        yield* $trk_ext(track);
        yield* end();
      }
      yield* each(track.points, function* (step) {
        const expanded = step.track;
        if (expanded && expanded.length) {
          yield* start('trkseg');
          yield* each(expanded, function* (p) {
            yield* el('trkpt', {
              lat: p[1].toFixed(precision),
              lon: p[0].toFixed(precision)
            });
          });
          yield* end();
        }
      });
    }

    yield* end();
  }

  function* generate() {
    yield* header();
    yield* start('gpx', getSchema({
      xmlns: 'http://www.topografix.com/GPX/1/1',
      creator: 'http://furkot.com/',
      version: '1.1',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance'
    }, schema));

    yield* $metadata(ctx.metadata);
    yield* $waypoints(ctx.waypoints);
    yield* $routes(ctx.routes);
    yield* $tracks(ctx.tracks);

    yield* end();
  }

  yield* generate();
}
