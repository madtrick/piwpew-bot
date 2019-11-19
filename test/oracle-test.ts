import sinon from 'sinon'
import chai from 'chai'
import sinonChai from 'sinon-chai'

import { RadarScanNotificationMessage } from '../src/types'
import Oracle from '../src/oracle'
import { IPlanner } from '../src/planner'
import Gunner from '../src/gunner'
import factory from './support/factory'

chai.use(sinonChai)

const expect = chai.expect

describe('Oracle', function () {
  let oracle: Oracle

  beforeEach(function () {
    oracle = new Oracle({ shooter: true })
  })

  describe('#decide', function () {
    describe('when there are no players on the scan notification', function () {
      let planner: IPlanner
      let gunner: Gunner
      let scanMessage: RadarScanNotificationMessage

      beforeEach(function () {
        planner = { calculate: sinon.spy() }
        gunner = { calculate: sinon.spy() }
        const bot = { rotation: 0, location: { x: 200, y: 200 }, planner }
        const scanMessage = factory.RadarScanNotification()

        oracle.decide(bot, scanMessage.data, planner, gunner)
      })

      it('calls the Planner', function () {
        expect(planner.calculate).to.have.been.calledWith(scanMessage.data)
      })
    })

    describe('when there are players on the scan notification', function () {
      describe('when they are further than 20 units of the player center', function () {
        let scanMessage: RadarScanNotificationMessage
        let planner: IPlanner
        let gunner: Gunner

        beforeEach(function () {
          planner = { calculate: sinon.spy() }
          gunner = { calculate: sinon.spy() }
          const player = { position: { x: 230, y: 200 } }
          const bot = { location: { x: 200, y: 200 }, rotation: 0, planner }

          scanMessage = factory.RadarScanNotification({ players: [player] })
          oracle.decide(bot, scanMessage.data, planner, gunner)
        })

        it('calls the Planner', function () {
          expect(planner.calculate).to.have.been.calledWith(scanMessage.data)
        })
      })

      describe('when they are closer or equal to 20 units of the player center', function () {
        let scanMessage: RadarScanNotificationMessage
        let planner: IPlanner
        let gunner: Gunner

        beforeEach(function () {
          planner = { calculate: sinon.spy() }
          gunner = { calculate: sinon.spy() }

          const player = { position: { x: 215, y: 200 } }
          const bot = { location: { x: 200, y: 200 }, rotation: 0, planner }

          scanMessage = factory.RadarScanNotification({ players: [player] })
          oracle.decide(bot, scanMessage.data, planner, gunner)
        })

        it('calls the Planner', function () {
          expect(this.gunner.calculate).to.have.been.calledWith(this.location, this.scan.data)
        })
      })
    })
  })
})
