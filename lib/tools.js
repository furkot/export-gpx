module.exports = {
  getSchema,
  getTimestamp,
  getDeparture,
  getDuration,
  getSymbol,
  getColor,
  getComment,
  formatDuration,
  streetAddress,
  getMode,
  isStop
};

const millisInMinute = 60 * 1000;
const millisInHour = 60 * millisInMinute;
const millisInDay = 24 * millisInHour;
const PASSTHROUGH = 76;

const schema = [
  [
    '', 'http://www.topografix.com/GPX/1/1',
    'http://www.topografix.com/GPX/1/1/gpx.xsd'
  ]
];

const garminSchema = schema.concat([
  [
    'xmlns:gpxx', 'http://www.garmin.com/xmlschemas/GpxExtensions/v3',
    'http://www8.garmin.com/xmlschemas/GpxExtensionsv3.xsd'
  ],
  [
    'xmlns:trp', 'http://www.garmin.com/xmlschemas/TripExtensions/v1',
    'http://www.garmin.com/xmlschemas/TripExtensionsv1.xsd'
  ],
  [
    'xmlns:tmd', 'http://www.garmin.com/xmlschemas/TripMetaDataExtensions/v1',
    'http://www.garmin.com/xmlschemas/TripMetaDataExtensionsv1.xsd'
  ],
  [
    'xmlns:vptm', 'http://www.garmin.com/xmlschemas/ViaPointTransportationModeExtensions/v1',
    'http://www.garmin.com/xmlschemas/ViaPointTransportationModeExtensionsv1.xsd'
  ]
]);

const modeMap = ['Motorcycling', 'Automotive', 'Bicycling', 'Walking', 'Direct', 'Direct', 'RV', 'Direct'];

function getSchema(attributes, garmin) {
  const schemaLocation = [];
  (garmin ? garminSchema : schema).forEach(function (ns) {
    if (ns[0]) {
      attributes[ns[0]] = ns[1];
    }
    schemaLocation.push(ns[1], ns[2]);
    return attributes;
  }, attributes);
  attributes['xsi:schemaLocation'] = schemaLocation.join(' ');
  return attributes;
}

function streetAddress(step) {
  let address;
  if (step.streetAddress !== undefined) {
    return step.streetAddress;
  }
  if (step.address) {
    address = step.address.split(',')[0];
    if (!step.locality || address !== step.locality.town &&
      address !== step.locality.province && address !== step.locality.province_long &&
      address !== step.locality.country && address !== step.locality.country_long) {
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

function getComment(step) {
  if (step.cmt === undefined) {
    step.cmt = ['address', 'notes'].reduce(addToCmt, {
      step,
      cmt: []
    }).cmt.join('\n');
  }
  return step.cmt;
}

function getISOString(time, tzoffset) {
  if (tzoffset !== undefined) {
    time -= tzoffset * millisInMinute;
  }
  return new Date(time).toISOString();
}

function getTimestamp(step) {
  return getISOString(step.arrival_time, step.tzoffset);
}

function getDeparture(step) {
  return getISOString(step.departure_time, step.tzoffset);
}

function getDuration(step) {
  if (step.nights) {
    return step.nights * millisInDay + step.visit_duration;
  }
  return step.visit_duration;
}

function formatDuration(step) {
  const duration = ['P'];
  if (step.nights) {
    duration.push(step.nights, 'D');
  }
  if (step.visit_duration) {
    duration.push('T');
    let dur = Math.floor(step.visit_duration / millisInHour);
    if (dur) {
      duration.push(dur, 'H');
    }
    dur = Math.floor((step.visit_duration % millisInHour) / millisInMinute);
    if (dur) {
      duration.push(dur, 'M');
    }
  }
  if (duration.length > 2) {
    return duration.join('');
  }
}

function getSymbol(symbols, step) {
  if (step.symbol === undefined) {
    step.symbol = step.sym !== undefined ? symbols[step.sym] : '';
  }
  return step.symbol;
}

function getColor(colors, obj) {
  if (obj.color) {
    return colors[obj.color];
  }
}

function getMode(rMode, mMode) {
  if (rMode !== undefined) {
    return modeMap[rMode + 1] || 'Unknown';
  }
  return modeMap[(mMode || 0) + 1] || 'Unknown';
}

function isStop(step) {
  return step.nights || step.visit_duration || step.url || (step.pin !== undefined && step.pin !== PASSTHROUGH);
}
