'use strict';

import rotationToTarget from './utils/rotation-to-target';

var delta = 18;

export default class Gunner {
  calculate(location, scan) {
    let player   = scan.elements[0];
    let rotation = rotationToTarget(location.coordinates, player.coordinates);

    if (
      rotation < mod360(location.rotation + delta) ||
      rotation > mod360(location.rotation - delta)
    ) {
      return {
        type: 'shoot'
      };
    } else {
      return {
        type: 'move',
        data: {
          rotation: rotation
        }
      };
    }
  }
}

function mod360 (value) {
  if (value > 360) {
    return 360 - value;
  }

  if (value < 0) {
    return 360 + value;
  }

  return value;
}
