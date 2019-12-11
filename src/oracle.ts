// import { DISTANCE_THRESHOLD_TRIGGER_PLANNER } from './constants'
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
    { type: ActionTypes.Move, data: { direction: MovementDirection } } |
    { type: ActionTypes.Shoot } |
    { type: ActionTypes.DeployMine } {
    const possibleTargets = [...scan.players, ...scan.unknown]

    if (!this.isShooter || possibleTargets.length === 0) {
      return planner.calculate(scan)
    } else {
      // const { x: bx, y: by } = bot.location
      // const { position: { x, y } } = player
      // const distance = Math.sqrt(
      //   Math.pow(Math.abs(x - bx), 2) +
      //   Math.pow(Math.abs(y - by), 2)
      // )

      // console.log('distance to player', distance, planner)

      if (possibleTargets.length === 0) {
        return planner.calculate(scan)
      } else {
        return gunner.calculate(bot.rotation, bot.location, scan)
      }
    }
  }
}
