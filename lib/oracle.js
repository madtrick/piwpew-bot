'use strict';

export default class Oracle {
  constructor(options) {
    this.shooter = options.shooter;
  }

  decide(bot, scan, planner, gunner) {
    if (!this.shooter || scan.elements.length === 0) {
      return planner.calculate(scan);
    } else {
      let {x: bx, y: by} = bot.location.coordinates;
      let player = scan.elements[0];
      let {coordinates: {x, y}} = player;
      let distance = Math.sqrt(
        Math.pow(Math.abs(x - bx), 2) +
        Math.pow(Math.abs(y - by), 2)
      );

      if (distance > 20) {
        return planner.calculate(scan);
      } else {
        return gunner.calculate(bot.location, scan);
      }
    }
  }
}