module.exports = render;

var stream = require('gexode').stream;
var tools = require('./tools');

var getSchema = tools.getSchema;
var getTimestamp = tools.getTimestamp;
var getDeparture = tools.getDeparture;
var getSymbol = tools.getSymbol;
var getColor = tools.getColor;
var getComment = tools.getComment;
var formatDuration = tools.formatDuration;
var streetAddress = tools.streetAddress;
var getMode = tools.getMode;
var isStop = tools.isStop;

var precision = 6;

var target = {
  galileo: {
    wptSymbolTag: 'type',
    symbols: require('furkot-galileo-data').toGalileo,
    trkColorFn: '$trk_type',
    colors: require('furkot-galileo-data').colors
  },
  garmin: {
    wptSymbolTag: 'sym',
    symbols: require('furkot-garmin-data').toGarmin,
    trkColorFn: '$trk_ext',
    colors: require('furkot-garmin-data').colors
  }
};
var targets = Object.keys(target);

function pickTarget(ctx) {
  var tgt;
  targets.some(function (sym) {
    if (ctx[sym]) {
      tgt = target[sym];
      return true;
    }
  });
  return tgt || target.garmin;
}

function generatorStream() {
  var buffer = [];

  return {
    write: function write(s) {
      buffer.push(s);
    },
    read: function* read() {
      var s = buffer.join('');
      buffer = [];
      yield s;
    }
  };
}

function* each(array, fn, thisArg) {
  if (!array) { return; }
  for (let i = 0; i < array.length; i++) {
    yield* fn.call(thisArg, array[i], i, array);
  }
}

function render(ctx) {
  var gs = generatorStream();
  var out = stream(gs, { pretty: true });

  var target = pickTarget(ctx);
  var getWptSymbol = getSymbol.bind(undefined, target.symbols);
  var getTrkColor = getColor.bind(undefined, target.colors);

  var functions = {
    $trk_type: outTextEl.bind(undefined, 'type'),
    $trk_ext: function (color) {
      if (ctx.garmin && color) {
        out.start('extensions');
        out.start('gpxx:TrackExtension');
        out.elIfText('gpxx:DisplayColor', color);
        out.end();
        out.end();
      }
    }
  };
  var $color = functions[target.trkColorFn];

  function outTextEl(tag, value) {
    out.elIfText(tag, value);
  }

  var $name = outTextEl.bind(undefined, 'name');

  function $link(url) {
    if (url) {
      out.el('link', { href: url });
    }
  }

  function $cmt(cmt) {
    if (cmt) {
      out.el('cmt', null, cmt);
      out.el('desc', null, cmt);
    }
  }

  var $desc = outTextEl.bind(undefined, 'desc');

  var $icon = outTextEl.bind(undefined, target.wptSymbolTag);

  function $author(author) {
    if (!author) { return; }

    out.start('author');

    $name(author.name);

    if (author.email) {
      out.el('email', {
        id: author.email.id,
        domain: author.email.domain
      });
    }
    if (author.link) {
      out.start('link', { href: author.link });
      out.elIfText('text', author.short_name);
      out.end();
    }

    out.end();
  }

  function* $metadata(metadata) {
    out.start('metadata');

    $name(metadata.name);
    $desc(metadata.desc);
    $author(metadata.author);
    $link(metadata.link);

    out.end();

    yield* gs.read();
  }

  function* $waypoints(waypoints) {
    yield* each(waypoints, function* (step) {
      if (!step.coordinates) {
        return;
      }
      out.start('wpt', {
        lat: step.coordinates.lat.toFixed(precision),
        lon: step.coordinates.lon.toFixed(precision)
      });
      yield* $waypoint(step, function* () {
        if (ctx.garmin && (step.address || step.phone)) {
          out.start('extensions');
          $wpt_ext(step);
          out.end();

          yield* gs.read();
        }
      });

      out.end();

      yield* gs.read();
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
      out.elIfText('time', getTimestamp(step));
    }
    $name(step.name);
    if (ctx.garmin) {
      $cmt(step.notes);
    }
    else {
      $cmt(getComment(step));
    }
    $link(step.url);
    $icon(getWptSymbol(step));

    yield* gs.read();
    yield* block();
  }

  function* $rte(route) {
    out.start('rte');

    $name(route.name);
    $desc(route.desc);
    $link(route.link);

    if (ctx.garmin) {
      out.start('extensions');
      $rte_ext(route);
      out.end();
    }

    yield* each(route.points, function* (step, index) {
      if (!step.coordinates) {
        return;
      }
      out.start('rtept', {
        lat: step.coordinates.lat.toFixed(precision),
        lon: step.coordinates.lon.toFixed(precision)
      });

      yield* $waypoint(step, function* () {
        if (ctx.garmin) {
          out.start('extensions');
          $rtept_ext(route, step, index, route.points[index + 1]);
          out.end();

          yield* gs.read();
        }
      });

      out.end();
      yield* gs.read();
    });

    out.end();
    yield* gs.read();
  }

  function* $trk(track) {

    out.start('trk');

    $name(track.name);
    $desc(track.desc);
    $link(track.link);

    if (track.points) {
      $color(getTrkColor(track));
      track.points.forEach(function(step) {
        var expanded = step.track;
        if (expanded && expanded.length) {
            out.start('trkseg');
            expanded.forEach(function(p) {
              out.el('trkpt', {
                lat: p[1].toFixed(precision),
                lon: p[0].toFixed(precision)
              });
            });
            out.end();
        }
      });
    }

    out.end();

    yield* gs.read();
  }

  function $wpt_ext(step) {
    out.start('gpxx:WaypointExtension');
    if (step.tags && step.tags.length) {
      out.start('gpxx:Categories');
        step.tags.forEach(function(cat) {
          out.el('gpxx:Category', null, cat);
        });
      out.end();
    }
    if (step.address) {
      out.start('gpxx:Address');
      out.elIfText('gpxx:StreetAddress', streetAddress(step));
      if (step.locality) {
        out.elIfText('gpxx:City', step.locality.town);
        out.elIfText('gpxx:State', step.locality.province);
        out.elIfText('gpxx:Country', step.locality.country_long);
      }
      out.end();
    }
    out.elIfText('gpxx:PhoneNumber', step.phone);
    out.end();
  }

  function $rte_ext(route) {
    out.start('gpxx:RouteExtension');
    out.elIfText('gpxx:IsAutoNamed', 'false');
    out.elIfText('gpxx:DisplayColor', 'Blue');
    out.end();

    var mode = ctx.metadata && ctx.metadata.mode;
    var name = ctx.metadata && ctx.metadata.name;

    if (route.mode !== undefined || mode !== undefined) {
      out.start('trp:Trip');
      //- The <trp:TransportationMode> extension tells the devices Trip Planner algorithm what calculation type to use:
      //- Automotive, Motorcycling, Walking, Bicycling, Direct.
      out.elIfText('trp:TransportationMode', getMode(route.mode, mode));
      out.end();

      if (name || route.arrival_time || route.day) {
        out.start('tmd:TripMetaData');
        out.el('tmd:TripName', null, name || '');
        if (route.arrival_time) {
          out.elIfText('tmd:Date', getTimestamp(route));
        }
        out.elIfText('tmd:DayNumber', route.day);
        out.end();
      }
    }
  }

  function $gpxxRpt(p, subclass) {
    var attribs = {
      lat: p[1].toFixed(precision),
      lon: p[0].toFixed(precision)
    };

    if (subclass) {
      out.start('gpxx:rpt', attribs);
      out.el('gpxx:Subclass', null, subclass);
      out.end();
    } else {
      out.el('gpxx:rpt', attribs);
    }
  }

  function $rtept_ext(route, step, index, next) {
    var shapingPoint;


    if (isStop(step) || index % 124 === 0 || !next) {
      //- The <trp:ViaPoint> is equivalent to a Furkot Stop.
      out.start('trp:ViaPoint');
      if (step.departure_time && next) {
        out.elIfText('trp:DepartureTime', getDeparture(step));
      }
      if (index && next) {
        out.elIfText('trp:StopDuration', formatDuration(step));
      }
      if (step.arrival_time && index > 0) {
        out.elIfText('trp:ArrivalTime', getTimestamp(step));
      }
      out.elIfText('trp:CalculationMode', 'FasterTime');
      out.elIfText('trp:ElevationMode', 'Standard');
      out.end();
    }
    else {
      shapingPoint = true;
      //- The <trp:ShapingPoint> is equivalent to Furkot Pass-through Points.
      //- These points are displayed in the Route point list on the GPS but are not announced during navigation.
      //- There can be up to 124 ShapingPoints between each ViaPoint.
      out.el('trp:ShapingPoint');
    }
    if (next && next.mode !== undefined) {

      //- The <vptm:ViaPointTransportationMode> extension tells the devices Trip Planner algorithm
      //- what calculation type to use between this and next point:
      //- Automotive, Motorcycling, Walking, Bicycling, Direct.
      out.start('vptm:ViaPointTransportationMode');
      out.elIfText('vptm:TransportationMode', getMode(next.mode));
      out.end();
    }
    if (ctx.RoutePointExtension) {
      out.start('gpxx:RoutePointExtension');

      //- The <gpxx:Subclass> is a special Garmin code for older Garmin devices that do not use
      //- the Trip Planner algorithm. This specific code says to use the above RoutePoint as a waypoint.
      //- Older Garmin devices don't use the Trip Planner algorithm.
      out.el('gpxx:Subclass', null, '000000000000FFFFFFFFFFFFFFFFFFFFFFFF');
      var expanded = next && next.track;

      if (expanded) {
        expanded.forEach(function(p) {
          var subclass;

          //- All of the <gpxx:rpt> are equivalent to Furkot Track Points generated between Stops.
          //- These points are not displayed on the GPS or announced during navigation.
          if (next.custom || next.mode === 3) {
            //- This Subclass code denotes a route point that is not on a mapped road (off-road).
            //- There are usually many of these in succession to define the route path
            //- and each off-road point needs to have this Subclass.
            subclass = 'FFFF00000000FFFFFFFF2117000000000000';
          }
          else if (shapingPoint) {
            shapingPoint = false;
            //- A Subclass other than 000000000000FFFFFFFFFFFFFFFFFFFFFFFF must be added after a ShapingPoint.
            //- Any other ‘valid’ Subclass code works.
            subclass = '0300F2F7C403DD6E00002116000025490404';
          }

          $gpxxRpt(p, subclass);
        });
        $gpxxRpt(expanded[expanded.length - 1], '000000000000FFFFFFFFFFFFFFFFFFFFFFFF');
      }

      out.end();
    }

  }

  function *generate() {
    out.header();
    out.start('gpx', getSchema({
      xmlns: 'http://www.topografix.com/GPX/1/1',
      creator: 'http://furkot.com/',
      version: '1.1',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance'
    }, ctx.garmin));

    yield* gs.read();

    yield* $metadata(ctx.metadata);
    yield* $waypoints(ctx.waypoints);
    yield* $routes(ctx.routes);
    yield* $tracks(ctx.tracks);

    out.end();

    yield* gs.read();
  }

  return generate;
}


