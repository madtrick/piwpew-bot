import chai from 'chai'

import Gunner from '../src/gunner'
import factory from './support/factory'


const expect = chai.expect

describe('Gunner', function () {
  describe('#calculate', function () {
    [
      { rotation: 0, coordinates: { x: 200, y: 300 }, expectation: 90 },
      { rotation: 0, coordinates: { x: 100, y: 200 }, expectation: 180 },
      { rotation: 0, coordinates: { x: 200, y: 100 }, expectation: 270 }
    ].forEach((data) => {
      describe(`when the bot rotation (${data.rotation}) is not valid to shoot`, function () {
        beforeEach(function () {
          const player = { position: data.coordinates }

          this.location = { coordinates: { x: 200, y: 200 }, rotation: data.rotation }
          this.scan = factory.RadarScanNotification({ players: [player] })
          this.gunner = new Gunner()
        })

        it('returns a move order to rotate the player', function () {
          let action = this.gunner.calculate(this.location, this.scan.data)

          expect(action.type).to.equal('move')
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
            beforeEach(function () {
              const player = { position: data.coordinates }

              this.location = { coordinates: { x: 200, y: 200 }, rotation: 0 }
              this.scan = factory.RadarScanNotification({ players: [player] })
              this.gunner = new Gunner()
            })

            it('returns a shoot action', function () {
              let action = this.gunner.calculate(this.location, this.scan.data)

              expect(action.type).to.equal('shoot')
            })
          })
        })
    })
  })
})
