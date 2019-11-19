import _ from 'lodash'
import chai from 'chai'

import Planner, { IPlanner } from '../src/planner'
import { Position, MovementDirection, RadarScanNotificationMessage, ActionTypes } from '../src/types'
import factory from './support/factory'

const expect = chai.expect

describe('Planner', function () {
  let planner: IPlanner
  let scanMessage: RadarScanNotificationMessage

  describe('#calculate', function () {
    beforeEach(function () {
      planner = new Planner({
        tracker: false,
        direction: MovementDirection.Forward,
        position: { x: 200, y: 200 },
        rotation: 0
      })
      scanMessage = factory.RadarScanNotification()
    })

    context('when there are no players in the radar scan', () => {
      it('maintains the same direction and rotation', function () {
        const action = planner.calculate(scanMessage.data)

        expect(action.type).to.equal(ActionTypes.Rotate)
        expect(action.data.rotation).to.equal(0)
      })
    })

    context('when there is a player in the radar', function () {
      function theBot (description: string, data: {
        isTracker: boolean,
        player: { coordinates: Position },
        expectations: { rotation: number }
      }) {
        it(description, function () {
          let options = {
            position: { x: 200, y: 200 },
            direction: MovementDirection.Forward,
            rotation: 0,
            tracker: data.isTracker
          }

          const planner = new Planner(options)
          const scanMessage = factory.RadarScanNotification({
            players: [{ position: data.player.coordinates }]
          })

          const action = planner.calculate(scanMessage.data)

          expect(action.type).to.equal(ActionTypes.Rotate)
          expect(action.data.rotation).to.equal(data.expectations.rotation)
        })
      }

      const notATrackerExamples = [
        // First quadrant
        { coordinates: { x: 210, y: 210 }, expectations: { rotation: 225 } },
        // Second quadrant
        { coordinates: { x: 190, y: 210 }, expectations: { rotation: 315 } },
        // Thir quadrant
        { coordinates: { x: 190, y: 190 }, expectations: { rotation: 45 } },
        // Fourth quadrant
        { coordinates: { x: 210, y: 190 }, expectations: { rotation: 135 } }
      ]

      notATrackerExamples.forEach((data) => {
        describe('when the bot is configured to not track players', function () {
          describe('at ' + JSON.stringify(data.coordinates), function () {
            theBot('moves forward and opposite to the player', {
              player: { coordinates: data.coordinates },
              isTracker: false,
              expectations: { rotation: data.expectations.rotation }
            })
          })
        })
      })

      const trackerExamples = [
        // First quadrant
        { coordinates: { x: 210, y: 210 }, expectations: { rotation: 45 } },
        // Second quadrant
        { coordinates: { x: 190, y: 210 }, expectations: { rotation: 135 } },
        // Third quadrant
        { coordinates: { x: 190, y: 190 }, expectations: { rotation: 225 } },
        // Fourth quadrant
        { coordinates: { x: 210, y: 190 }, expectations: { rotation: 315 } }
      ]

      trackerExamples.forEach((data) => {
        describe('when the bot is configured to track players', function () {
          describe('at ' + JSON.stringify(data.coordinates), function () {
            theBot('moves forward and in the direction of the player', {
              player: { coordinates: data.coordinates },
              isTracker: true,
              expectations: { rotation: data.expectations.rotation }
            })
          })
        })
      })
    })
  })
})
