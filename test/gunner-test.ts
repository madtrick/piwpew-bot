import chai from 'chai'

import { RotateAction, ShootAction, ActionTypes } from '../src/types'
import Gunner from '../src/gunner'

const expect = chai.expect

describe('Gunner', function () {
  const gunner = new Gunner()

  describe('#calculate', function () {
    [
      { rotation: 0, coordinates: { x: 200, y: 300 }, expectation: 90 },
      { rotation: 0, coordinates: { x: 100, y: 200 }, expectation: 180 },
      { rotation: 0, coordinates: { x: 200, y: 100 }, expectation: 270 }
    ].forEach((data) => {
      describe(`when the bot rotation (${data.rotation}) is not valid to shoot`, function () {
        it('returns a move order to rotate the player', function () {
          const playerScan = { position: data.coordinates }
          const location = { x: 200, y: 200 }
          const rotation = data.rotation
          const action = gunner.calculate(rotation, location, { players: [playerScan] }) as RotateAction

          expect(action.type).to.equal(ActionTypes.Rotate)
          expect(action.data.rotation).to.equal(data.expectation)
        })
      })
    })

    const examples = [
      { coordinates: { x: 210, y: 200 } },
      { coordinates: { x: 210, y: 203 } },
      { coordinates: { x: 210, y: 197 } }
    ]

    examples.forEach((data) => {
      describe(
        `when the player is at x: , ${data.coordinates.x}  y: ${data.coordinates.y}`,
        function () {
          describe('when the bot rotation differs by less than a delta offset', function () {
            it('returns a shoot action', function () {
              const playerScan = { position: data.coordinates }
              const location = { x: 200, y: 200 }
              const rotation = 0
              const action = gunner.calculate(rotation, location, { players: [playerScan] }) as ShootAction

              expect(action.type).to.equal(ActionTypes.Shoot)
            })
          })
        })
    })
  })
})
