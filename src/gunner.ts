import rotationToTarget from './utils/rotation-to-target'
import { ActionTypes, Position, Rotation, ShootAction, RotateAction } from './types'
import { RadarScan } from './messages'

const delta = 5

export default class Gunner {
  calculate (rotation: Rotation, position: Position, scan: RadarScan): ShootAction | RotateAction {
    // TODO the possibleTargets is duplicated with the oracle and the planner
    const possibleTargets = [...scan.players, ...scan.unknown]
    const rotationToPlayer = rotationToTarget(position, possibleTargets[0].position)

    console.log('Rotation to player', rotationToPlayer, rotation, mod360(rotation + delta), mod360(rotation - delta))
    if (
      rotationToPlayer < mod360(rotation + delta) &&
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
