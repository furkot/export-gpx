import { render } from './gpx.js';

furkotGpx.contentType = 'application/gpx+xml';
furkotGpx.extension = 'gpx';
furkotGpx.encoding = 'utf8';

export default function furkotGpx(options) {
  return render(options || {});
}
