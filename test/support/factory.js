'use strict';

export default {
  'RadarScanNotification': (options) => {
    let {walls, elements} = options;

    elements = elements || [];

    return {
      type: 'RadarScanNotification',
      data: {
        'walls': walls,
        'elements': elements
      }
    };
  }
};
