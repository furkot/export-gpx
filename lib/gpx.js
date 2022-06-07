const { generator } = require('gexode');
const {
  getSchema,
  getTimestamp,
  getDeparture,
  getSymbol,
  getColor,
  getComment,
  formatDuration,
  streetAddress,
  getMode,
  isStop
} = require('./tools');

module.exports = render;

const precision = 6;

const target = {
  galileo: {
    wptSymbolTag: 'type',
    symbols: require('@furkot/guru-data').toGuru,
    trkColorFn: '$trk_type',
    colors: require('@furkot/guru-data').colors
  },
  garmin: {
    wptSymbolTag: 'sym',
    symbols: require('@furkot/garmin-data').toGarmin,
    trkColorFn: '$trk_ext',
    colors: require('@furkot/garmin-data').colors
  }
};

const targets = Object.keys(target);

function pickTarget(ctx) {
  let tgt;
  targets.some(function (sym) {
    if (ctx[sym]) {
      tgt = target[sym];
      return true;
    }
  });
  return tgt || target.garmin;
}

function* each(array, fn, thisArg) {
  if (!array) { return; }
  for (let i = 0; i < array.length; i++) {
    yield* fn.call(thisArg, array[i], i, array);
  }
}

function* render(ctx) {
  const { header, start, el, end, elIfText } = generator({ pretty: true });

  const target = pickTarget(ctx);
  const getWptSymbol = getSymbol.bind(undefined, target.symbols);
  const getTrkColor = getColor.bind(undefined, target.colors);

  const gens = {
    $trk_type: elIfText.bind(undefined, 'type'),
    $trk_ext: function* (color) {
      if (ctx.garmin && color) {
        yield* start('extensions');
        yield* start('gpxx:TrackExtension');
        yield* elIfText('gpxx:DisplayColor', color);
        yield* end();
        yield* end();
      }
    }
  };
  const $color = gens[target.trkColorFn];

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
  const $icon = elIfText.bind(undefined, target.wptSymbolTag);

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
        if (ctx.garmin && (step.address || step.phone)) {
          yield* start('extensions');
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
    if (ctx.garmin) {
      yield* $cmt(step.notes);
    } else {
      yield* $cmt(getComment(step));
    }
    yield* $link(step.url);
    yield* $icon(getWptSymbol(step));

    yield* block();
  }

  function* $rte(route) {
    yield* start('rte');

    yield* $name(route.name);
    yield* $desc(route.desc);
    yield* $link(route.link);

    if (ctx.garmin) {
      yield* start('extensions');
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
        if (ctx.garmin) {
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
      yield* $color(getTrkColor(track));
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

  function* $wpt_ext(step) {
    yield* start('gpxx:WaypointExtension');
    if (step.tags && step.tags.length) {
      yield* start('gpxx:Categories');
      yield* each(step.tags, function* (cat) {
        yield* el('gpxx:Category', null, cat);
      });
      yield* end();
    }
    if (step.address) {
      yield* start('gpxx:Address');
      yield* elIfText('gpxx:StreetAddress', streetAddress(step));
      if (step.locality) {
        yield* elIfText('gpxx:City', step.locality.town);
        yield* elIfText('gpxx:State', step.locality.province);
        yield* elIfText('gpxx:Country', step.locality.country_long);
      }
      yield* end();
    }
    yield* elIfText('gpxx:PhoneNumber', step.phone);
    yield* end();
  }

  function* $rte_ext(route) {
    yield* start('gpxx:RouteExtension');
    yield* elIfText('gpxx:IsAutoNamed', 'false');
    yield* elIfText('gpxx:DisplayColor', getTrkColor(route) || 'Blue');
    yield* end();

    const mode = ctx.metadata && ctx.metadata.mode;
    const name = ctx.metadata && ctx.metadata.name;

    if (route.mode !== undefined || mode !== undefined) {
      yield* start('trp:Trip');
      //- The <trp:TransportationMode> extension tells the devices Trip Planner algorithm what calculation type to use:
      //- Automotive, Motorcycling, Walking, Bicycling, Direct.
      yield* elIfText('trp:TransportationMode', getMode(route.mode, mode));
      yield* end();

      if (name || route.arrival_time || route.day) {
        yield* start('tmd:TripMetaData');
        yield* el('tmd:TripName', null, name || '');
        if (route.arrival_time) {
          yield* elIfText('tmd:Date', getTimestamp(route));
        }
        yield* elIfText('tmd:DayNumber', route.day);
        yield* end();
      }
    }
  }

  function* $gpxxRpt(p, subclass) {
    const attribs = {
      lat: p[1].toFixed(precision),
      lon: p[0].toFixed(precision)
    };

    if (subclass) {
      yield* start('gpxx:rpt', attribs);
      yield* el('gpxx:Subclass', null, subclass);
      yield* end();
    } else {
      yield* el('gpxx:rpt', attribs);
    }
  }

  function* $rtept_ext(route, step, index, next) {
    let shapingPoint;

    if (isStop(step) || index % 124 === 0 || !next) {
      //- The <trp:ViaPoint> is equivalent to a Furkot Stop.
      yield* start('trp:ViaPoint');
      if (step.departure_time && next) {
        yield* elIfText('trp:DepartureTime', getDeparture(step));
      }
      if (index && next) {
        yield* elIfText('trp:StopDuration', formatDuration(step));
      }
      if (step.arrival_time && index > 0) {
        yield* elIfText('trp:ArrivalTime', getTimestamp(step));
      }
      yield* elIfText('trp:CalculationMode', 'FasterTime');
      yield* elIfText('trp:ElevationMode', 'Standard');
      yield* end();
    } else {
      shapingPoint = true;
      //- The <trp:ShapingPoint> is equivalent to Furkot Pass-through Points.
      //- These points are displayed in the Route point list on the GPS but are not announced during navigation.
      //- There can be up to 124 ShapingPoints between each ViaPoint.
      yield* el('trp:ShapingPoint');
    }
    if (next && next.mode !== undefined) {

      //- The <vptm:ViaPointTransportationMode> extension tells the devices Trip Planner algorithm
      //- what calculation type to use between this and next point:
      //- Automotive, Motorcycling, Walking, Bicycling, Direct.
      yield* start('vptm:ViaPointTransportationMode');
      yield* elIfText('vptm:TransportationMode', getMode(next.mode));
      yield* end();
    }
    if (ctx.RoutePointExtension) {
      yield* start('gpxx:RoutePointExtension');

      //- The <gpxx:Subclass> is a special Garmin code for older Garmin devices that do not use
      //- the Trip Planner algorithm. This specific code says to use the above RoutePoint as a waypoint.
      //- Older Garmin devices don't use the Trip Planner algorithm.
      yield* el('gpxx:Subclass', null, '000000000000FFFFFFFFFFFFFFFFFFFFFFFF');
      const expanded = next && next.track;

      if (expanded) {
        yield* each(expanded, function* (p) {
          let subclass;

          //- All of the <gpxx:rpt> are equivalent to Furkot Track Points generated between Stops.
          //- These points are not displayed on the GPS or announced during navigation.
          if (next.custom || next.mode === 3) {
            //- This Subclass code denotes a route point that is not on a mapped road (off-road).
            //- There are usually many of these in succession to define the route path
            //- and each off-road point needs to have this Subclass.
            subclass = 'FFFF00000000FFFFFFFF2117000000000000';
          } else if (shapingPoint) {
            shapingPoint = false;
            //- A Subclass other than 000000000000FFFFFFFFFFFFFFFFFFFFFFFF must be added after a ShapingPoint.
            //- Any other ‘valid’ Subclass code works.
            subclass = '0300F2F7C403DD6E00002116000025490404';
          }

          yield* $gpxxRpt(p, subclass);
        });
        yield* $gpxxRpt(expanded[expanded.length - 1], '000000000000FFFFFFFFFFFFFFFFFFFFFFFF');
      }

      yield* end();
    }

  }

  function* generate() {
    yield* header();
    yield* start('gpx', getSchema({
      xmlns: 'http://www.topografix.com/GPX/1/1',
      creator: 'http://furkot.com/',
      version: '1.1',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance'
    }, ctx.garmin));

    yield* $metadata(ctx.metadata);
    yield* $waypoints(ctx.waypoints);
    yield* $routes(ctx.routes);
    yield* $tracks(ctx.tracks);

    yield* end();
  }

  yield* generate();
}
