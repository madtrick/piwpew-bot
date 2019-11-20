import rotationToTarget from './utils/rotation-to-target'
import { ActionTypes, Position, Rotation, RadarScan, ShootAction, RotateAction } from './types'

const delta = 18

export default class Gunner {
  calculate (rotation: Rotation, position: Position, scan: RadarScan): ShootAction | RotateAction {
    const player = scan.players[0]
    const rotationToPlayer = rotationToTarget(position, player.position)

    if (
      rotationToPlayer < mod360(rotation + delta) ||
      rotationToPlayer > mod360(rotation - delta)
    ) {
      console.log('Shoot mecajondios')
      return {
        type: ActionTypes.Shoot
      }
    } else {
      return {
        type: ActionTypes.Rotate,
        data: {
          rotation: rotationToPlayer
        }
      }
    }
  }
}

function mod360 (value: Rotation): number {
  if (value > 360) {
    return 360 - value
  }

  if (value < 0) {
    return 360 + value
  }

  return value
}
