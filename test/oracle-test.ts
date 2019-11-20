import sinon from 'sinon'
import chai from 'chai'
import sinonChai from 'sinon-chai'

import { DISTANCE_THRESHOLD_TRIGGER_PLANNER } from '../src/constants'
import { RadarScanNotificationMessage, Bot } from '../src/types'
import Oracle from '../src/oracle'
import { IPlanner } from '../src/planner'
import Gunner from '../src/gunner'
import factory from './support/factory'

chai.use(sinonChai)

const expect = chai.expect

describe('Oracle', function () {
  let oracle: Oracle
  let bot: Bot
  let planner: IPlanner
  let gunner: Gunner

  beforeEach(function () {
    const botPosition = { x: 200, y: 200 }

    planner = { calculate: sinon.spy(), locations: { current: botPosition } }
    gunner = { calculate: sinon.spy() }
    oracle = new Oracle({ shooter: true })
    bot = { location: botPosition, rotation: 0, planner }
  })

  describe('#decide', function () {
    describe('when there are no players on the scan notification', function () {
      let scanMessage: RadarScanNotificationMessage

      beforeEach(function () {
        scanMessage = factory.RadarScanNotification()

        oracle.decide(bot, scanMessage.data, planner, gunner)
      })

      it('calls the Planner', function () {
        expect(planner.calculate).to.have.been.calledWith(scanMessage.data)
      })
    })

    describe('when there are players on the scan notification', function () {
      describe(`when they are further than ${DISTANCE_THRESHOLD_TRIGGER_PLANNER} units of the player center`,
      function () {
        let scanMessage: RadarScanNotificationMessage

        beforeEach(function () {
          const player = { position: { x: bot.location.x + DISTANCE_THRESHOLD_TRIGGER_PLANNER, y: 200 } }

          scanMessage = factory.RadarScanNotification({ players: [player] })
          oracle.decide(bot, scanMessage.data, planner, gunner)
        })

        it('calls the Planner', function () {
          expect(planner.calculate).to.have.been.calledWith(scanMessage.data)
        })
      })

      describe(`when they are less than or equal to ${DISTANCE_THRESHOLD_TRIGGER_PLANNER} units of the player center`,
      function () {
        let scanMessage: RadarScanNotificationMessage

        beforeEach(function () {
          const player = { position: { x: bot.location.x + DISTANCE_THRESHOLD_TRIGGER_PLANNER - 10, y: 200 } }

          scanMessage = factory.RadarScanNotification({ players: [player] })
          oracle.decide(bot, scanMessage.data, planner, gunner)
        })

        it('calls the Planner', function () {
          expect(gunner.calculate).to.have.been.calledWith(bot.rotation, bot.location, scanMessage.data)
        })
      })
    })
  })
})
