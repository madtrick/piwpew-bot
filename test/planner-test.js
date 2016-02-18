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
  describe('#constructor', function () {
    it('throws an error if there is no previous location', function () {
      let fn = () => {
        new Planner();
      };
      expect(fn).to.throw(Error);
    });
  });

  describe('#calculate', function () {
    describe('when there is no wall in the radar', function () {
      beforeEach(function () {
        this.planner = new Planner({
          direction: 'forward',
          position: {x: 200, y: 200},
          rotation: 0
        });
        this.scan    = factory.RadarScanNotification({
          walls: []
        });
      });

      it('maintains the same direction and rotation', function () {
        let action = this.planner.calculate(this.scan);

        expect(action.type).to.equal('move');
        expect(action.data.direction).to.equal('forward');
        expect(action.data.rotation).to.equal(0);
      });

      describe('when there is a player in the radar', function () {
        function theBot (description, data) {
          it(description, function () {
            let options = {
              position: {x: 200, y: 200},
              direction: 'forward',
              rotation: 0,
              tracker: data.isTracker
            };

            let planner = new Planner(options);
            let scan = factory.RadarScanNotification({
              elements: [{coordinates: data.player.coordinates, type: 'unknown'}]
            });

            this.action = planner.calculate(scan.data);

            expect(this.action.type).to.equal('move');
            expect(this.action.data.direction).to.equal('forward');
            expect(this.action.data.rotation).to.equal(data.expectations.rotation);
          });
        }

        [
          {coordinates: {x: 210, y: 210}, expectations: {rotation: 225}},
          {coordinates: {x: 190, y: 210}, expectations: {rotation: 315}},
          {coordinates: {x: 190, y: 190}, expectations: {rotation: 45}},
          {coordinates: {x: 210, y: 190}, expectations: {rotation: 135}},
          {coordinates: {x: 190, y: 239}, expectations: {rotation: 284.38139459109061}},
          {coordinates: {x: 190, y: 201}, expectations: {rotation: 354.28940686250036}},
          {coordinates: {x: 190, y: 199}, expectations: {rotation: 5.710593137499643}},
          {coordinates: {x: 190, y: 161}, expectations: {rotation: 75.61860540890939}},
          {coordinates: {x: 210, y: 161}, expectations: {rotation: 104.38139459109061}},
          {coordinates: {x: 210, y: 199}, expectations: {rotation: 174.2894068625003}},
          {coordinates: {x: 200, y: 210}, expectations: {rotation: 270}},
          {coordinates: {x: 200, y: 190}, expectations: {rotation: 90}},
          {coordinates: {x: 210, y: 200}, expectations: {rotation: 180}},
          {coordinates: {x: 190, y: 200}, expectations: {rotation: 0}}
        ].forEach((data) => {
          describe('when the bot is configured to not track players', function () {
            describe('at ' + JSON.stringify(data.coordinates), function () {
              theBot('moves forward and opposite to the player', {
                player: {coordinates: data.coordinates},
                isTracker: false,
                expectations: {rotation: data.expectations.rotation}
              });
            });
          });
        });

        [
          {coordinates: {x: 210, y: 210}, expectations: {rotation: 45}},
          {coordinates: {x: 190, y: 210}, expectations: {rotation: 135}},
          {coordinates: {x: 190, y: 190}, expectations: {rotation: 225}},
          {coordinates: {x: 210, y: 190}, expectations: {rotation: 315}},
          {coordinates: {x: 190, y: 239}, expectations: {rotation: 104.38139459109061}},
          {coordinates: {x: 190, y: 201}, expectations: {rotation: 174.28940686250036}},
          {coordinates: {x: 190, y: 199}, expectations: {rotation: 185.71059313749964}},
          {coordinates: {x: 190, y: 161}, expectations: {rotation: 255.6186054089094}},
          {coordinates: {x: 210, y: 161}, expectations: {rotation: 284.3813945910906}},
          {coordinates: {x: 210, y: 199}, expectations: {rotation: 354.28940686250036}},
          {coordinates: {x: 200, y: 210}, expectations: {rotation: 90}},
          {coordinates: {x: 200, y: 190}, expectations: {rotation: 270}},
          {coordinates: {x: 210, y: 200}, expectations: {rotation: 0}},
          {coordinates: {x: 190, y: 200}, expectations: {rotation: 180}}
        ].forEach((data) => {
          describe('when the bot is configured to track players', function () {
            describe('at ' + JSON.stringify(data.coordinates), function () {
              theBot('moves forward and in the direction of the player', {
                player: {coordinates: data.coordinates},
                isTracker: true,
                expectations: {rotation: data.expectations.rotation}
              });
            });
          });
        });
      });
    });
  });

  describe('when there is a wall in the radar', function () {
    function prepareEnvironment (options, context) {
      let planner = new Planner(options);
      let scan = factory.RadarScanNotification({
        walls: collisionCalculator(options.position, 40)
      });

      planner.locations.current = options.position;
      context.action          = planner.calculate(scan.data);
    }

    function when (description, options) {
      describe(description, function () {
        beforeEach(function () {
          prepareEnvironment({
            direction: options.setup.direction,
            position: options.setup.position,
            rotation: options.setup.rotation
          }, this);
        });

        it(options.it, function () {
          expect(this.action.type).to.equal('move');
          expect(this.action.data.direction).to.equal(options.expects.direction);
          expect(this.action.data.rotation).to.equal(options.expects.rotation);
        });
      });
    }

    describe('and its a vertical wall', function () {
      describe('and the player is parallel to the wall', function () {
        when('the player is to the left of the wall', {
          setup: {direction: 'forward', position: {x: 380, y: 90}, rotation: 90},
          it: 'maintains the same direction but rotates 90 degress',
          expects: {
            direction: 'forward',
            rotation: 180
          }
        });

        when('the player is to the right of the wall', {
          setup: {direction: 'forward', position: {x: 30, y: 90}, rotation: 90},
          it: 'maintains the same direction but rotates 90 degress',
          expects: {
            direction: 'forward',
            rotation: 0
          }
        });
      });

      when('the player is tangential to the wall', {
        setup: {direction: 'forward', position: {x: 360, y: 90}, rotation: 0},
        it: 'maintains the same direction and rotation',
        expects: {
          direction: 'forward',
          rotation: 0
        }
      });

      [
        {coordinates: {x: 361, y: 226}, rotation: 352, expectations: {rotation: 172}},
        {coordinates: {x: 390, y: 90}, rotation: 0, expectations: {rotation: 180}},
        {coordinates: {x: 390, y: 90}, rotation: 180, expectations: {rotation: 180}},
        {coordinates: {x: 39, y: 119}, rotation: 164, expectations: {rotation: 16}},
        {coordinates: {x: 30, y: 90}, rotation: 180, expectations: {rotation: 0}},
        {coordinates: {x: 30, y: 90}, rotation: 0, expectations: {rotation: 0}}
      ].forEach((data) => {
        when('the coordinates are ' + JSON.stringify(data.coordinates), {
          setup: {direction: 'forward', position: data.coordinates, rotation: data.rotation},
          it: 'turns 180 degrees and keeps the same direction',
          expects: {
            direction: 'forward',
            rotation: data.expectations.rotation
          }
        });
      });

      when('and the player is moving away from the wall', {
        setup: {direction: 'forward', position: {x: 390, y: 90}, rotation: 180},
        it: 'maintains the same direction and rotation',
        expects: {
          direction: 'forward',
          rotation: 180
        }
      });
    });

    describe('and its a horizontal wall', function () {
      describe('and the player is parallel to the wall', function () {
        when('and the player is above the wall', {
          setup: {direction: 'forward', position: {x: 100, y: 30}, rotation: 0},
          it: 'maintains the same direction but rotates 90 degrees',
          expects: {
            direction: 'forward',
            rotation: 90
          }
        });

        when('and the player is below the wall', {
          setup: {direction: 'forward', position: {x: 100, y: 380}, rotation: 0},
          it: 'maintains the same direction but rotates 90 degrees',
          expects: {
            direction: 'forward',
            rotation: 270
          }
        });
      });

      describe('and the player is moving in direction to the wall', function () {
        when('when the player is tangential to the wall', {
          setup: {direction: 'forward', position: {x: 50, y: 360}, rotation: 90},
          it: 'maintains the same direction and rotation',
          expects: {
            direction: 'forward',
            rotation: 90
          }
        });

        [
          {coordinates: {x: 50, y: 390}, rotation: 90, expectations: {rotation: 270}},
          {coordinates: {x: 50, y: 390}, rotation: 270, expectations: {rotation: 270}},
          {coordinates: {x: 50, y: 30}, rotation: 270, expectations: {rotation: 90}},
          {coordinates: {x: 50, y: 30}, rotation: 90, expectations: {rotation: 90}}
        ].forEach((data) => {
          when('the coordinates are ' + JSON.stringify(data.coordinates), {
            setup: {direction: 'forward', position: data.coordinates, rotation: data.rotation},
            it: 'maintains the same direction but turns 180 degrees',
            expects: {
              direction: 'forward',
              rotation: data.expectations.rotation
            }
          });
        });
      });

      when('and the player is moving away from the wall', {
        setup: {direction: 'forward', position: {x: 50, y: 360}, rotation: 270},
        it: 'maintains the same direction and rotation',
        expects: {
          direction: 'forward',
          rotation: 270
        }
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
