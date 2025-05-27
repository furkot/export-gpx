const millisInMinute = 60 * 1000;
const PASSTHROUGH = 76;

const schema = [['', 'http://www.topografix.com/GPX/1/1', 'http://www.topografix.com/GPX/1/1/gpx.xsd']];

export function getSchema(attributes, ext) {
  const schemaLocation = [];
  (ext ? schema.concat(ext) : schema).forEach(ns => {
    if (ns[0]) {
      attributes[ns[0]] = ns[1];
    }
    schemaLocation.push(ns[1], ns[2]);
  });
  attributes['xsi:schemaLocation'] = schemaLocation.join(' ');
  return attributes;
}

export function streetAddress(step) {
  let address;
  if (step.streetAddress !== undefined) {
    return step.streetAddress;
  }
  if (step.address) {
    address = step.address.split(',')[0];
    if (
      !step.locality ||
      (address !== step.locality.town &&
        address !== step.locality.province &&
        address !== step.locality.province_long &&
        address !== step.locality.country &&
        address !== step.locality.country_long)
    ) {
      step.streetAddress = address;
      return address;
    }
    step.streetAddress = '';
    return '';
  }
}

function addToCmt(result, prop) {
  if (result.step[prop]) {
    result.cmt.push(result.step[prop]);
  }
  return result;
}

export function getComment(step) {
  if (step.cmt === undefined) {
    step.cmt = ['address', 'notes']
      .reduce(addToCmt, {
        step,
        cmt: []
      })
      .cmt.join('\n');
  }
  return step.cmt;
}

function getISOString(time, tzoffset) {
  if (tzoffset !== undefined) {
    time -= tzoffset * millisInMinute;
  }
  return new Date(time).toISOString();
}

export function getTimestamp(step) {
  return getISOString(step.arrival_time, step.tzoffset);
}

export function getDeparture(step) {
  return getISOString(step.departure_time, step.tzoffset);
}

export function isStop(step) {
  return step.nights || step.visit_duration || step.url || (step.pin !== undefined && step.pin !== PASSTHROUGH);
}
