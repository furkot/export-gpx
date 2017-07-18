var render = require('./gpx');

module.exports = furkotGpx;
furkotGpx.contentType = 'application/gpx+xml';
furkotGpx.extension = 'gpx';


function furkotGpx(out, opt) {
  var options = opt ? {
    metadata: opt.metadata,
    tracks: opt.tracks,
    routes: opt.routes,
    waypoints: opt.waypoints,
    garmin: opt.options === 'garmin',
    RoutePointExtension: opt.RoutePointExtension
  } : {};

  return render(out, options);
}
