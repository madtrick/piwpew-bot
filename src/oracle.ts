import { RadarScan, Bot, ActionTypes, MovementDirection, Rotation } from './types'
import Gunner from './gunner'
import { IPlanner } from './planner'

export default class Oracle {
  private readonly isShooter: boolean

  constructor (options: { shooter: boolean }) {
    this.isShooter = options.shooter
  }

  decide (bot: Bot, scan: RadarScan, planner: IPlanner, gunner: Gunner):
    { type: ActionTypes.Rotate, data: { rotation: Rotation } } |
    { type: ActionTypes.Move, data: { direction: MovementDirection, rotation: Rotation } } |
    { type: ActionTypes.Shoot } {
    if (!this.isShooter || scan.players.length === 0) {
      return planner.calculate(scan)
    } else {
      const { x: bx, y: by } = bot.location
      const player = scan.players[0]
      const { position: { x, y } } = player
      const distance = Math.sqrt(
        Math.pow(Math.abs(x - bx), 2) +
        Math.pow(Math.abs(y - by), 2)
      )

      console.log('distance to player', distance)

      if (distance > 35) {
        return planner.calculate(scan)
      } else {
        return gunner.calculate(bot.rotation, bot.location, scan)
      }
    }
  }
}
