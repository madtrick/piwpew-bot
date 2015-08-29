'use strict';

import _ from 'lodash';
import chai from 'chai';
import dirtyChai from 'dirty-chai';
import rayVsCircle  from 'ray-vs-circle';

import Planner from '../lib/planner';
import factory from './support/factory';

chai.use(dirtyChai);

var expect   = chai.expect;

describe('Planner', function () {
  describe('#calculate', function () {
    describe('when there is no wall ahead', function () {
      beforeEach(function () {
        this.planner = new Planner({
          direction: 'forward',
          coordinates: {x: 200, y: 200},
          rotation: 0
        });
        this.scan    = factory.RadarScanNotification({
          walls: []
        });
      });

      it('maintains the same direction and rotation', function () {
        let movement = this.planner.calculate(this.scan);

        expect(movement.direction).to.equal('forward');
        expect(movement.rotation).to.equal(0);
      });
    });

    describe('when there is a wall in the radar', function () {
      describe('and its a vertical wall', function () {
        it('it turns 180 degrees and keeps the same direction', function () {
          let initialPosition = {direction: 'forward', position: {x: 390, y: 90}, rotation: 0};
          this.planner = new Planner(initialPosition);
          let scan = factory.RadarScanNotification({
            walls: collisionCalculator(initialPosition.position, 40)
          });

          this.planner.movements.last = {rotation: 0, direction: 'forward'};
          this.planner.locations.current = initialPosition.position;
          let movement = this.planner.calculate(scan.data);

          expect(movement.direction).to.equal('forward');
          expect(movement.rotation).to.equal(180);
        });

        describe('and the player is moving away from the wall', function () {
          it('maintains the same direction and rotation', function () {
            let initialPosition = {direction: 'forward', position: {x: 390, y: 90}, rotation: 180};
            this.planner = new Planner(initialPosition);
            let scan = factory.RadarScanNotification({
              walls: collisionCalculator(initialPosition.position, 40)
            });

            this.planner.movements.last = {rotation: 180, direction: 'forward'};
            this.planner.locations.current = initialPosition.position;
            let movement = this.planner.calculate(scan.data);

            expect(movement.direction).to.equal('forward');
            expect(movement.rotation).to.equal(180);
          });
        });
      });

      describe('and its a horizontal wall', function () {
        describe('and the player is moving in direction to the wall', function () {
          it('maintains the same direction but turns 180 degrees', function () {
            let initialPosition = {direction: 'forward', position: {x: 50, y: 390}, rotation: 90};
            this.planner = new Planner(initialPosition);
            let scan = factory.RadarScanNotification({
              walls: collisionCalculator(initialPosition.position, 40)
            });

            this.planner.movements.last = {rotation: 90, direction: 'forward'};
            this.planner.locations.current = initialPosition.position;
            let movement = this.planner.calculate(scan.data);

            expect(movement.direction).to.equal('forward');
            expect(movement.rotation).to.equal(270);
          });
        });

        describe('and the player is moving away from the wall', function () {
          it('maintains the same direction and rotation', function () {
            let initialPosition = {direction: 'forward', position: {x: 50, y: 390}, rotation: 270};
            this.planner = new Planner(initialPosition);
            let scan = factory.RadarScanNotification({
              walls: collisionCalculator(initialPosition.position, 40)
            });

            this.planner.movements.last = {rotation: 270, direction: 'forward'};
            this.planner.locations.current = initialPosition.position;
            let movement = this.planner.calculate(scan.data);

            expect(movement.direction).to.equal('forward');
            expect(movement.rotation).to.equal(270);
          });
        });
      });
    });
  });
});

// function movementCalculator (movement, position, rotation) {
//  let speed     = 1;
//  let radianRotation = (rotation * Math.PI) / 180;
//  let sign      = (movement === 'forward' && 1) || -1;
//  let DX       = speed * Math.cos(radianRotation);
//  let DY       = speed * Math.sin(radianRotation);

//  let roundedX = Math.round(position.x + (DX * sign), 5);
//  let roundedY = Math.round(position.y + (DY * sign), 5);

//  return {x: roundedX, y: roundedY};
// }

function collisionCalculator (position, radius) {
  // Left boundary
  let Y1 = {start: {x: 0, y: 0}, end: {x: 0, y: 400}};
  let Y2 = {start: {x: 0, y: 400}, end: {x: 0, y: 0}};

  // Right boundary
  let Y3 = {start: {x: 400, y: 0}, end: {x: 400, y: 400}};
  let Y4 = {start: {x: 400, y: 400}, end: {x: 400, y: 0}};

  // Top boundary
  let X1 = {start: {x: 0, y: 400}, end: {x: 400, y: 400}};
  let X2 = {start: {x: 400, y: 400}, end: {x: 0, y: 400}};

  // Bottom boundary
  let X3 = {start: {x: 0, y: 0}, end: {x: 400, y: 0}};
  let X4 = {start: {x: 400, y: 0}, end: {x: 0, y: 0}};

  let lol = [[Y1, Y2], [Y3, Y4], [X1, X2], [X3, X4]].map((rays) => {
    let collisions = rays.map((ray) => {
      let collision = rayVsCircle(ray, {position: position, radius: radius});

      if (collision) {
        return [collision.x, collision.y];
      }
    });

    collisions = _.compact(collisions);
    collisions = _.reduce(collisions, (acc, collision) => {
      let exist = _.find(acc, (item) => {
        let [collisionX, collisionY] = collision;
        let [itemX, itemY]           = item;

        return collisionX === itemX && collisionY === itemY;
      });

      if (!exist) {
        acc.push(collision);
      }

      return acc;
    }, []);

    if (collisions.length === 0) {
      return undefined;
    } else {
      return collisions;
    }
  });

  return _.compact(lol);
}
