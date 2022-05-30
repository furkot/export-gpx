const render = require('./gpx');

module.exports = furkotGpx;
furkotGpx.contentType = 'application/gpx+xml';
furkotGpx.extension = 'gpx';
furkotGpx.encoding = 'utf8';

function addTarget(to, from) {
  ['garmin', 'galileo'].some(function (tgt) {
    to[tgt] = from === tgt;
    return to[tgt];
  });
  return to;
}

function furkotGpx(opt) {
  const options = opt ? addTarget({
    metadata: opt.metadata,
    tracks: opt.tracks,
    routes: opt.routes,
    waypoints: opt.waypoints,
    RoutePointExtension: opt.RoutePointExtension
  }, opt.options) : {};

  return render(options);
}
