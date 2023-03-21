const render = require('./gpx');

module.exports = furkotGpx;
furkotGpx.contentType = 'application/gpx+xml';
furkotGpx.extension = 'gpx';
furkotGpx.encoding = 'utf8';

function furkotGpx(options) {
  return render(options || {});
}
