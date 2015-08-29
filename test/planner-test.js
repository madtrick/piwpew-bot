'use strict';

import chai from 'chai';
import dirtyChai from 'dirty-chai';

import Planner from '../lib/planner';
import factory from './support/factory';

chai.use(dirtyChai);

var expect   = chai.expect;

describe('Planner', function () {
  beforeEach(function () {
    this.planner = new Planner();
  });

  describe('when theres no wall ahead', function () {
    beforeEach(function () {
      this.scan = factory.RadarScanNotification({
        walls: []
      });
      this.last = {direction: 'forward', rotation: 45};
    });

    it('moves redo last movement', function () {
      let movement = this.planner.calculate(this.scan, this.last);

      expect(movement).to.equal(this.last);
    });
  });
});
