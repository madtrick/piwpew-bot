'use strict';

module.exports = function (origin, target) {
  let {x, y}         = origin;
  let {x: tx, y: ty} = target;
  let dx = Math.abs(tx - x);
  let dy = Math.abs(ty - y);
  let rotation = Math.atan2(dy, dx) * 180 / Math.PI;

  // first quadrant
  if (tx > x && ty >= y) {
    return rotation;
  }

  // second quadrant
  if (tx < x && ty >= y) {
    return 180 - rotation;
  }

  // third quadrant
  if (x >= tx && y > ty) {
    return 180 + rotation;
  }

  // fourth quadrant
  if (x < tx && y > ty) {
    return 360 - rotation;
  }

  return rotation;
};
