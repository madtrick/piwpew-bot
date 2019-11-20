import * as _ from 'lodash'
import rotationToTarget from './utils/rotation-to-target'
import {
  MovementDirection,
  Position,
  Rotation,
  ActionTypes,
  RotateAction,
  MoveAction,
  RadarScan
} from './types'
import { PLAYER_RADIUS } from './constants'

const GAP_TO_ARENA_BORDERS = PLAYER_RADIUS * 2

export interface IPlanner {
  locations: {
    current: Position
  }
  calculate (scan: RadarScan): RotateAction | MoveAction
}

export default class Planner implements IPlanner {
  private readonly isTracker: boolean
  private arena: { width: number, height: number }
  public locations: any

  constructor (options: {
    tracker: boolean,
    direction: MovementDirection,
    rotation: Rotation,
    position: Position,
    arena: {
      width: number,
      height: number
    }
  }) {
    this.isTracker = options.tracker
    this.arena = options.arena
    this.locations = { current: _.clone(options.position) }
  }

  calculate (scan: RadarScan): RotateAction | MoveAction {
    if ((this.locations.current.x + PLAYER_RADIUS) > (this.arena.width - GAP_TO_ARENA_BORDERS)) {
      const rotation = _.random(120, 240)

      return {
        type: ActionTypes.Rotate,
        data: {
          rotation
        }
      }
    }

    if (this.locations.current.x - PLAYER_RADIUS < GAP_TO_ARENA_BORDERS) {
      /*
       * Add 60 to 360 so we can use the _.random function
       * to calculate the angle in just one go. Get the reminder
       * to return a value between 0 and 60
       */
      const rotation = _.random(330, 420) % 360

      return {
        type: ActionTypes.Rotate,
        data: {
          rotation
        }
      }
    }

    if ((this.locations.current.y + PLAYER_RADIUS) > (this.arena.height - GAP_TO_ARENA_BORDERS)) {
      const rotation = _.random(240, 330)

      return {
        type: ActionTypes.Rotate,
        data: {
          rotation
        }
      }
    }

    if ((this.locations.current.y - PLAYER_RADIUS) < GAP_TO_ARENA_BORDERS) {
      const rotation = _.random(30, 150)

      return {
        type: ActionTypes.Rotate,
        data: {
          rotation
        }
      }
    }

    if (scan.players.length === 0) {
      return {
        type: ActionTypes.Move,
        data: {
          direction: MovementDirection.Forward
        }
      }
    }

    if (this.isTracker && !_.isEmpty(scan.players)) {
      const rotation = this.trackPlayer(scan.players)

      return {
        type: ActionTypes.Rotate,
        data: {
          rotation
        }
      }
    } else if (!this.isTracker && !_.isEmpty(scan.players)) {
      const rotation = this.escapePlayer(scan.players)

      return {
        type: ActionTypes.Rotate,
        data: {
          rotation
        }
      }
    }

    throw new Error('This should not be possible')
  }

  private escapePlayer (elements: { position: Position }[]): Rotation {
    const player = elements[0]
    const rotationToPlayer = rotationToTarget(this.locations.current, player.position)

    return (rotationToPlayer + 180) % 360
  }

  private trackPlayer (elements: { position: Position }[]): Rotation {
    const player = elements[0]
    const { x, y } = this.locations.current
    const { x: px, y: py } = player.position
    const dx = Math.abs(px - x)
    const dy = Math.abs(py - y)
    const degrees = Math.atan2(dy, dx) * 180 / Math.PI

    if (px === x) {
      if (py > y) {
        return 90
      } else {
        return 270
      }
    }

    if (py === y) {
      if (px > x) {
        return 0
      } else {
        return 180
      }
    }

    // first quadrant
    if (px > x && py > y) {
      return degrees
    }

    // second quadrant
    if (px < x && py > y) {
      return 180 - degrees
    }

    // third quadrant
    if (x > px && y > py) {
      return 180 + degrees
    }

    // fourth quadrant
    if (x < px && y > py) {
      return 360 - degrees
    }

    return degrees
  }

  // maybeUpdateRotation (walls): Rotation {
  //   let wall = walls[0] // [[[x1, y1], [x2, y2]]]

  //   if (this.isVerticalWall(wall)) {
  //     let rotation = this.movements.last.rotation

  //     if (rotation > 90 && rotation < 270) {
  //       if (!this.isPlayerToTheLeftOfTheWall(wall)) {
  //         return Math.abs(rotation - 180)
  //       } else {
  //         return rotation
  //       }
  //     } else if (this.isPlayerParallelToWall(wall)) {
  //       if (this.isPlayerToTheLeftOfTheWall(wall)) {
  //         return 180
  //       } else {
  //         return 0
  //       }
  //     } else {
  //       if (this.isPlayerToTheLeftOfTheWall(wall)) {
  //         return (rotation + 180) % 360
  //       } else {
  //         return rotation
  //       }
  //     }
  //   }

  //   if (this.isHorizontalWall(wall)) {
  //     let rotation = this.movements.last.rotation

  //     if (rotation > 180 && rotation < 360) {
  //       if (this.isPlayerAboveTheWall(wall)) {
  //         return rotation - 180
  //       } else {
  //         return rotation
  //       }
  //     } else if (this.isPlayerParallelToWall(wall)) {
  //       if (this.isPlayerAboveTheWall(wall)) {
  //         return 90
  //       } else {
  //         return 270
  //       }
  //     } else {
  //       if (this.isPlayerAboveTheWall(wall)) {
  //         return rotation
  //       } else {
  //         return rotation + 180
  //       }
  //     }
  //   }

  //   // Tangential to the wall
  //   // need to get closer
  //   return this.movements.last.rotation
  // }

  // isPlayerToTheLeftOfTheWall (wall) {
  //   let [X] = wall[0]

  //   return this.locations.current.x < X
  // }

  // isPlayerAboveTheWall (wall) {
  //   let [, Y] = wall[0]

  //   return this.locations.current.y > Y
  // }

  // isPlayerParallelToWall (wall) {
  //   return (
  //     (this.isHorizontalWall(wall) && this.movements.last.rotation === 0) ||
  //     (this.isVerticalWall(wall) && this.movements.last.rotation === 90)
  //   )
  // }

  // isHorizontalWall (wall) {
  //   if (wall.length === 1) {
  //     // Tangential to the wall
  //     // need to get closer
  //     return false
  //   }

  //   let [, y1] = wall[0]
  //   let [, y2] = wall[1]

  //   return y1 === y2
  // }

  // isVerticalWall (wall) {
  //   if (wall.length === 1) {
  //     // Tangential to the wall
  //     // need to get closer
  //     return false
  //   }

  //   let [x1] = wall[0]
  //   let [x2] = wall[1]

  //   return x1 === x2
  // }
}
