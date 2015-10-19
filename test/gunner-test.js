'use strict';

import chai from 'chai';
import dirtyChai from 'dirty-chai';

import Gunner from '../lib/gunner';
import factory from './support/factory';

chai.use(dirtyChai);

var expect   = chai.expect;

describe('Gunner', function () {
  describe('#calculate', function () {
    [
      {coordinates: {x: 200, y: 300}, expectation: 90},
      {coordinates: {x: 100, y: 200}, expectation: 180},
      {coordinates: {x: 200, y: 100}, expectation: 270}
    ].forEach( (data) => {
      describe('when the bot rotation is not valid to shoot', function () {
        beforeEach(function () {
          let player = {coordinates: data.coordinates};

          this.location = {coordinates: {x: 200, y: 200}, rotation: 0};
          this.scan = factory.RadarScanNotification({elements: [player]});
          this.gunner = new Gunner();
        });

        it('returns a move order to rotate the player', function () {
          let action = this.gunner.calculate(this.location, this.scan.data);

          expect(action.type).to.equal('move');
          expect(action.data.rotation).to.equal(data.expectation);
        });
      });
    });

    [
      {coordinates: {x: 210, y: 200}},
      {coordinates: {x: 210, y: 203}},
      {coordinates: {x: 210, y: 197}}
    ].forEach( (data) => {
      describe(
        `when the player is at x: , ${data.coordinates.x}  y: ${data.coordinates.y}`,
        function () {
          describe('when the bot rotation differs by less than a delta offset', function () {
            beforeEach(function () {
              let player = {coordinates: data.coordinates};

              this.location = {coordinates: {x: 200, y: 200}, rotation: 0};
              this.scan = factory.RadarScanNotification({elements: [player]});
              this.gunner = new Gunner();
            });

            it('returns a shoot action', function () {
              let action = this.gunner.calculate(this.location, this.scan.data);

              expect(action.type).to.equal('shoot');
            });
          });
        });
    });
  });
});
