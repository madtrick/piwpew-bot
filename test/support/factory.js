'use strict';

export default {
  'RadarScanNotification': (options) => {
    let {walls, elements} = options || {};

    elements = elements || [];
    walls    = walls || [];

    return {
      type: 'RadarScanNotification',
      data: {
        'walls': walls,
        'elements': elements
      }
    };
  }
};
