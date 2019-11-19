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
    describe('when there is no wall in the radar', function () {
      beforeEach(function () {
        planner = new Planner({
          tracker: false,
          direction: MovementDirection.Forward,
          position: { x: 200, y: 200 },
          rotation: 0
        })
        scanMessage = factory.RadarScanNotification()
      })

      it('maintains the same direction and rotation', function () {
        const action = planner.calculate(scanMessage.data)

        expect(action.type).to.equal(ActionTypes.Move)
        expect(action.data.direction).to.equal(MovementDirection.Forward)
        expect(action.data.rotation).to.equal(0)
      })

      describe('when there is a player in the radar', function () {
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

            expect(action.type).to.equal(ActionTypes.Move)
            expect(action.data.direction).to.equal(MovementDirection.Forward)
            expect(action.data.rotation).to.equal(data.expectations.rotation)
          })
        }

        const notATrackerExamples = [
          { coordinates: { x: 210, y: 210 }, expectations: { rotation: 225 } },
          { coordinates: { x: 190, y: 210 }, expectations: { rotation: 315 } },
          { coordinates: { x: 190, y: 190 }, expectations: { rotation: 45 } },
          { coordinates: { x: 210, y: 190 }, expectations: { rotation: 135 } },
          { coordinates: { x: 190, y: 239 }, expectations: { rotation: 284.38139459109061 } },
          { coordinates: { x: 190, y: 201 }, expectations: { rotation: 354.28940686250036 } },
          { coordinates: { x: 190, y: 199 }, expectations: { rotation: 5.710593137499643 } },
          { coordinates: { x: 190, y: 161 }, expectations: { rotation: 75.61860540890939 } },
          { coordinates: { x: 210, y: 161 }, expectations: { rotation: 104.38139459109061 } },
          { coordinates: { x: 210, y: 199 }, expectations: { rotation: 174.2894068625003 } },
          { coordinates: { x: 200, y: 210 }, expectations: { rotation: 270 } },
          { coordinates: { x: 200, y: 190 }, expectations: { rotation: 90 } },
          { coordinates: { x: 210, y: 200 }, expectations: { rotation: 180 } },
          { coordinates: { x: 190, y: 200 }, expectations: { rotation: 0 } }
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
          { coordinates: { x: 210, y: 210 }, expectations: { rotation: 45 } },
          { coordinates: { x: 190, y: 210 }, expectations: { rotation: 135 } },
          { coordinates: { x: 190, y: 190 }, expectations: { rotation: 225 } },
          { coordinates: { x: 210, y: 190 }, expectations: { rotation: 315 } },
          { coordinates: { x: 190, y: 239 }, expectations: { rotation: 104.38139459109061 } },
          { coordinates: { x: 190, y: 201 }, expectations: { rotation: 174.28940686250036 } },
          { coordinates: { x: 190, y: 199 }, expectations: { rotation: 185.71059313749964 } },
          { coordinates: { x: 190, y: 161 }, expectations: { rotation: 255.6186054089094 } },
          { coordinates: { x: 210, y: 161 }, expectations: { rotation: 284.3813945910906 } },
          { coordinates: { x: 210, y: 199 }, expectations: { rotation: 354.28940686250036 } },
          { coordinates: { x: 200, y: 210 }, expectations: { rotation: 90 } },
          { coordinates: { x: 200, y: 190 }, expectations: { rotation: 270 } },
          { coordinates: { x: 210, y: 200 }, expectations: { rotation: 0 } },
          { coordinates: { x: 190, y: 200 }, expectations: { rotation: 180 } }
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
})
