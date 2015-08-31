'use strict';

import _ from 'lodash';

export default class Planner {
  constructor(options) {
    this.movements = {
      last: {
        direction: options.direction,
        rotation: options.rotation
      }
    };
    this.locations = {};
  }

  calculate(scan) {
    let movement;

    if (!_.isEmpty(scan.walls)) {
      if (this.isMovingAwayFromTheWalls(scan.walls)) {
        movement = {
          direction: this.movements.last.direction,
          rotation: this.movements.last.rotation
        };
      } else {
        movement = {
          direction: this.movements.last.direction,
          rotation: this.movements.last.rotation + 180
        };
      }
    } else {
      movement = {
        direction: this.movements.last.direction,
        rotation: this.movements.last.rotation
      };
    }

    this.movements.last = movement;

    return movement;
  }

  isMovingAwayFromTheWalls(walls) {
    let wall = walls[0]; // [[[x1, y1], [x2, y2]]]

    if (this.isVerticalWall(wall)) {
      let rotation = this.movements.last.rotation;

      return rotation > 90 && rotation < 270;
    }

    if (this.isHorizontalWall(wall)) {
      let rotation = this.movements.last.rotation;

      return rotation > 180 && rotation < 360;
    }

    // Tangential to the wall
    // need to get closer
    return true;
  }

  isHorizontalWall(wall) {
    if (wall.length === 1) {
      // Tangential to the wall
      // need to get closer
      return false;
    }

    let [, y1] = wall[0];
    let [, y2] = wall[1];

    return y1 === y2;
  }

  isVerticalWall(wall) {
    if (wall.length === 1) {
      // Tangential to the wall
      // need to get closer
      return false;
    }

    let [x1] = wall[0];
    let [x2] = wall[1];

    return x1 === x2;
  }
}
