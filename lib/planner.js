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
    let movement = {
      direction: this.movements.last.direction,
      rotation: this.movements.last.rotation
    };

    if (!_.isEmpty(scan.walls)) {
      movement.rotation = this.maybeUpdateRotation(scan.walls);
    }

    this.movements.last = movement;

    return movement;
  }

  maybeUpdateRotation(walls) {
    let wall = walls[0]; // [[[x1, y1], [x2, y2]]]

    if (this.isVerticalWall(wall)) {
      let rotation = this.movements.last.rotation;

      if (rotation > 90 && rotation < 270) {
        if (!this.isPlayerToTheLeftOfTheWall(wall)) {
          return rotation - 180;
        } else {
          return rotation;
        }
      } else if (this.isPlayerParallelToWall(wall)) {
        if (this.isPlayerToTheLeftOfTheWall(wall)) {
          return 180;
        } else {
          return 0;
        }
      } else {
        if (this.isPlayerToTheLeftOfTheWall(wall)) {
          return rotation + 180;
        } else {
          return rotation;
        }
      }
    }

    if (this.isHorizontalWall(wall)) {
      let rotation = this.movements.last.rotation;

      if (rotation > 180 && rotation < 360) {
        if (this.isPlayerAboveTheWall(wall)) {
          return rotation - 180;
        } else {
          return rotation;
        }
      } else if (this.isPlayerParallelToWall(wall)) {
        if (this.isPlayerAboveTheWall(wall)) {
          return 90;
        } else {
          return 270;
        }
      } else {
        if (this.isPlayerAboveTheWall(wall)) {
          return rotation;
        } else {
          return rotation + 180;
        }
      }
    }

    // Tangential to the wall
    // need to get closer
    return this.movements.last.rotation;
  }

  isPlayerToTheLeftOfTheWall(wall) {
    let [X] = wall[0];

    return this.locations.current.x < X;
  }

  isPlayerAboveTheWall(wall) {
    let [, Y] = wall[0];

    return this.locations.current.y > Y;
  }

  isPlayerParallelToWall(wall) {
    return (
      (this.isHorizontalWall(wall) && this.movements.last.rotation === 0) ||
      (this.isVerticalWall(wall) && this.movements.last.rotation === 90)
    );
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
