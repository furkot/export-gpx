var render = require('./gpx');

module.exports = furkotGpx;
furkotGpx.contentType = 'application/gpx+xml';
furkotGpx.extension = 'gpx';

function addTarget(to, from) {
  ['garmin', 'galileo'].some(function (tgt) {
    to[tgt] = from === tgt;
    return to[tgt];
  });
  return to;
}

function furkotGpx(out, opt) {
  var options = opt ? addTarget({
    metadata: opt.metadata,
    tracks: opt.tracks,
    routes: opt.routes,
    waypoints: opt.waypoints,
    RoutePointExtension: opt.RoutePointExtension
  }, opt.options) : {};

  return render(out, options);
}
