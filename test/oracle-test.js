'use strict';

import sinon from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import dirtyChai from 'dirty-chai';

import Oracle from '../lib/oracle';
import factory from './support/factory';

chai.use(sinonChai);
chai.use(dirtyChai);

var expect   = chai.expect;

describe('Oracle', function () {
  beforeEach(function () {
    this.oracle = new Oracle();
  });

  describe('#decide', function () {
    describe('when there are no players or walls on the scan notification', function () {
      beforeEach(function () {
        let bot = {location: {coordinates: {x: 200, y: 200}}};

        this.scan    = factory.RadarScanNotification();
        this.planner = {calculate: sinon.spy()};
        this.oracle.decide(bot, this.scan.data, this.planner);
      });

      it('calls the Planner', function () {
        expect(this.planner.calculate).to.have.been.calledWith(this.scan.data);
      });
    });

    describe('when there are no player but walls on the scan notification', function () {
      beforeEach(function () {
        let bot = {location: {coordinates: {x: 200, y: 200}}};

        this.scan    = factory.RadarScanNotification({walls: ['wall-here']});
        this.planner = {calculate: sinon.spy()};
        this.oracle.decide(bot, this.scan.data, this.planner);
      });

      it('calls the Planner', function () {
        expect(this.planner.calculate).to.have.been.calledWith(this.scan.data);
      });
    });

    describe('when there are players on the scan notification', function () {
      describe('when they are further than 20 units of the player center', function () {
        beforeEach(function () {
          let player = {coordinates: {x: 230, y: 200}};
          let bot = {location: {coordinates: {x: 200, y: 200}}};

          this.scan    = factory.RadarScanNotification({elements: [player]});
          this.planner = {calculate: sinon.spy()};
          this.oracle.decide(bot, this.scan.data, this.planner);
        });

        it('calls the Planner', function () {
          expect(this.planner.calculate).to.have.been.calledWith(this.scan.data);
        });
      });

      describe('when they are closer or equal to 20 units of the player center', function () {
        beforeEach(function () {
          let player = {coordinates: {x: 215, y: 200}};
          this.location = {coordinates: {x: 200, y: 200}};

          let bot = {location: this.location};

          this.scan    = factory.RadarScanNotification({elements: [player]});
          this.planner = {};
          this.gunner  = {calculate: sinon.spy()};
          this.oracle.decide(bot, this.scan.data, this.planner, this.gunner);
        });

        it('calls the Planner', function () {
          expect(this.gunner.calculate).to.have.been.calledWith(this.location, this.scan.data);
        });
      });
    });
  });
});
