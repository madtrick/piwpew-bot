import chalk from 'chalk'

import {
  BotAPI,
  SuccessfulRegisterPlayerResponse,
  FailedRegisterPlayerResponse,
  SuccessfulMovePlayerResponse,
  FailedMovePlayerResponse,
  SuccessfulRotatePlayerResponse,
  FailedRotatePlayerResponse,
  Position,
  Rotation,
  Action,
  ActionTypes,
  RotateAction,
  MoveAction,
  MovementDirection
} from './types'

enum Status {
  Unregistered,
  Stop,
  RotateToCircle,
  RotateToNextCirclePoint,
  MoveToNextCirclePoint,
  MoveToCircle,
  WaitToStart
}

type StatusData<S> =
  S extends Status.RotateToCircle ? { status: Status.RotateToCircle, statusData: {rotationToCircleBorder: number} } :
  S extends Status.RotateToNextCirclePoint ? { status: Status.RotateToNextCirclePoint, statusData: { nextCirclePoint: Position } } :
  S extends Status.MoveToCircle ? { status: Status.MoveToCircle, statusData: { destination: Position } } :
  S extends Status.MoveToNextCirclePoint ? { status: Status.MoveToNextCirclePoint, statusData: { nextCirclePoint: Position } } :
  S extends Status.WaitToStart ? { status: Status.WaitToStart } :
  S extends Status.Unregistered ? { status: Status.Unregistered } :
  S extends Status.Stop ? { status: Status.Stop } :
  never

type State<S extends Status> = { position: Position, rotation: Rotation } & StatusData<S>

function translatePoint (point: Position, angle: Rotation): Position {
  const radians = (angle * Math.PI) / 180
  const x = point.x * Math.cos(radians) - point.y * Math.sin(radians)
  const y = point.x * Math.sin(radians) + point.y * Math.cos(radians)

  return { x, y }
}

function withCircleBasis (point: Position): Position {
  return { x: point.x - 200, y: point.y - 200 }
}

function withOriginBasis (point: Position): Position {
  return { x: point.x + 200, y: point.y + 200 }
}

function calculateIntersectionCircleLine (circle: { center: Position, radius: number }, line: { slope: number, point: Position }): { x: number, y: number }[] {
  // Intersection between a line an a circle
  //
  // https://cscheng.info/2016/06/09/calculate-circle-line-intersection-with-javascript-and-p5js.html
  // circle: (x - h)^2 + (y - k)^2 = r^2
  // line: y = m * x + n
  // r: circle radius
  // h: x value of circle centre
  // k: y value of circle centre
  // m: slope
  // n: y-intercept

  const h = circle.center.x
  const k = circle.center.y
  const m = Math.tan(line.slope * Math.PI / 180)
  const n = -m * line.point.x + line.point.y
  const r = 100

  // get a, b, c values
  const a = 1 + Math.pow(m, 2)
  const b = -h * 2 + (m * (n - k)) * 2
  const c = Math.pow(h, 2) + Math.pow(n - k, 2) - Math.pow(r, 2)

  // get discriminant
  const d = Math.pow(b, 2) - 4 * a * c
  let intersections: { x: number, y: number }[] = []
  if (d >= 0) {
    // insert into quadratic formula
    const xA = (-b + Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a)
    const xB = (-b - Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a)
    console.log('m', m)
    console.log('n', n)
    const yA = m * xA + n
    const yB = m * xB + n
    intersections = [
      { x: xA, y: yA },
      { x: xB, y: yB }
    ]
    if (d === 0) {
      // only 1 intersection
      intersections = [intersections[0]]
    }
  }


  return intersections
}

function findClosestIntersectionPoint (from: Position, intersectionPoints: Position[]): Position {
  const distancesToIntersections = intersectionPoints.map((intersectionPoint) => {
    return {
      distance: Math.pow(intersectionPoint.x - from.x, 2) + Math.pow(intersectionPoint.y - from.y, 2),
      intersectionPoint
    }
  })

  const closestIntersectionPoint = distancesToIntersections.sort((intersectionA, intersectionB) => intersectionA.distance - intersectionB.distance)[0]

  return closestIntersectionPoint.intersectionPoint
}

// pointA is like the origin of coordinates when calculating the angle
function calculateAngleBetweenPoints (pointA: Position, pointB: Position): number {
  console.log('calculateAngleBetweenPoints', pointA, pointB)
  // TODO remove that 0 default
  let rotationToPointB: number = 0

  /*
   *
   *                          +
   *        POINT B           |            POINT B
   *                          |
   *                          |
   *        B.x lt A.x        |            B.x gt A.x
   *        B.y gt A.y        |            B.y gt A.y
   *                          |
   *                          |
   *                          |
   *                          |
   * +----------------------POINT A---------------------+
   *                          |
   *                          |
   *                          |
   *        B.x lt A.x        |            B.x gt A.x
   *        B.y lt A.y        |            B.y lt A.y
   *                          |
   *                          |
   *                          |
   *        POINT B           |            POINT B
   *                          |
   *                          +
   *
   */

  if (pointA.x > pointB.x) {
    if (pointA.y > pointB.y) {
      console.log('A')
      const slopeBetweenPoints = Math.abs((pointA.y - pointB.y) / (pointA.x - pointB.x))
      rotationToPointB = Math.atan(slopeBetweenPoints) * 180 / Math.PI + 180
    } else if (pointA.y < pointB.y) {
      console.log('B')
      const slopeBetweenPoints = Math.abs((pointA.x - pointB.x) / (pointA.y - pointB.y))
      rotationToPointB = Math.atan(slopeBetweenPoints) * 180 / Math.PI + 90
    } else {
      rotationToPointB = 0
    }
  } else if (pointA.x < pointB.x) {
    if (pointA.y > pointB.y) {
      console.log('C')
      const slopeBetweenPoints = Math.abs((pointA.x - pointB.x) / (pointA.y - pointB.y))
      rotationToPointB = Math.atan(slopeBetweenPoints) * 180 / Math.PI + 270
    } else if (pointA.y < pointB.y) {
      console.log('D')
      const slopeBetweenPoints = Math.abs((pointA.y - pointB.y) / (pointA.x - pointB.x))
      rotationToPointB = Math.atan(slopeBetweenPoints) * 180 / Math.PI
    } else {
      rotationToPointB = 0
    }
  } else if (pointA.x === pointB.x) {
    if (pointA.y > pointB.y) {
      rotationToPointB = 90
    } else {
      rotationToPointB = 180
    }
  }

  return rotationToPointB
}

const CIRCLE_RADIUS = 100
const CIRCLE_CENTER = { x: 200, y: 200 }

function findRotationToCircleCenter (botPosition: Position, circleCenter: Position): Rotation {
  const { x, y } = botPosition
  // https://math.stackexchange.com/a/198769
  const botIsWithinTheCircle = Math.pow(x - circleCenter.x, 2) + Math.pow(y - circleCenter.y, 2) < Math.pow(CIRCLE_RADIUS, 2)
  let rotationToCircleBorder: Rotation

  if (botIsWithinTheCircle) {
    const slopeBetweenPoints = Math.abs(y - circleCenter.y) / Math.abs(x - circleCenter.x)
    const rotationToCircleCenter = Math.atan(slopeBetweenPoints) * 180 / Math.PI
    return rotationToCircleBorder = (rotationToCircleCenter + 180) % 360
  } else {
    rotationToCircleBorder = calculateAngleBetweenPoints(botPosition, circleCenter)

    return rotationToCircleBorder
  }
}

/*
 * I would like to specify the type of the bot
 * to be BotAPI<State<Status>> to say that the api methods
 * have to take a State<Status> but be able to refine
 * it in each individual method to the enum keys relevant
 * to that method. But it doesn't work. With BotAPI<State<Status>>
 * the compiler complains that for example Status.RotateToCircle can't
 * be assigned to Status.Unregistered (in the registerPlayerResponse method)
 */
export const bot: BotAPI<any> = {
  handlers: {
    registerPlayerResponse: (
      data: FailedRegisterPlayerResponse | SuccessfulRegisterPlayerResponse,
      state: State<Status.Unregistered>
    ): { state: State<Status.WaitToStart | Status.Unregistered>, actions: Action[] } => {
      console.log(chalk.cyan('RegisterPlayerResponse'))
      if (!data.success) {
        return { state, actions: [] }
      }

      if (data.success) {
        const botState: State<Status.WaitToStart> = {
          status: Status.WaitToStart,
          // TODO read the real rotation
          rotation: 0,
          position: data.data.position
        }

        return { state: botState, actions: [] }
      }

      throw new Error('not possible')
    },

    movePlayerResponse: (
      data: SuccessfulMovePlayerResponse | FailedMovePlayerResponse,
      state: State<Status.MoveToCircle | Status.MoveToNextCirclePoint>
    ): { state: State<Status.MoveToCircle | Status.MoveToNextCirclePoint | Status.RotateToNextCirclePoint | Status.Stop>, actions: Action[] } => {
      console.log(chalk.cyan('MovePlayerResponse'))
      if (!data.success) {
        return {
          state: {
            rotation: state.rotation,
            position: state.position,
            status: Status.Stop
          },
          actions: []
        }
      }

      if (state.status === Status.MoveToNextCirclePoint) {
        const xDelta = Math.abs(data.data.position.x - state.statusData.nextCirclePoint.x)
        const yDelta = Math.abs(data.data.position.y - state.statusData.nextCirclePoint.y)

        if (xDelta < 5 && yDelta < 5) {
          const translation = 0.01
          const angleB = calculateAngleBetweenPoints({ x: 0, y: 0 }, data.data.position)
          const rotatedPoint = withOriginBasis(translatePoint(withCircleBasis(data.data.position), (angleB + translation) % 360))
          const rotationToNextCirclePoint = calculateAngleBetweenPoints(data.data.position, rotatedPoint)

          return {
            state: {
              rotation: rotationToNextCirclePoint,
              position: data.data.position,
              status: Status.RotateToNextCirclePoint,
              statusData: {
                nextCirclePoint: rotatedPoint
              }
            },
            actions: [{ type: ActionTypes.Rotate, data: { rotation: rotationToNextCirclePoint } }]
          }
        } else {
          return {
            state: {
              rotation: state.rotation,
              position: data.data.position,
              status: Status.MoveToNextCirclePoint,
              statusData: {
                nextCirclePoint: state.statusData.nextCirclePoint
              }
            },
            actions: [{ type: ActionTypes.Move, data: { direction: MovementDirection.Forward } }]
          }
        }
      }

      if (state.status === Status.MoveToCircle) {
        const xDelta = Math.abs(data.data.position.x - state.statusData.destination.x)
        const yDelta = Math.abs(data.data.position.y - state.statusData.destination.y)

        if (xDelta < 5 && yDelta < 5) {
          const translation = 0.01
          const angleB = calculateAngleBetweenPoints({ x: 0, y: 0 }, data.data.position)
          const rotatedPoint = withOriginBasis(translatePoint(withCircleBasis(data.data.position), (angleB + translation) % 360))
          const rotationToNextCirclePoint = calculateAngleBetweenPoints(data.data.position, rotatedPoint)

          return {
            state: {
              rotation: state.rotation,
              position: data.data.position,
              status: Status.RotateToNextCirclePoint,
              statusData: {
                nextCirclePoint: rotatedPoint
              }
            },
            actions: [{ type: ActionTypes.Rotate, data: { rotation: rotationToNextCirclePoint } }]
          }
        } else {
          return {
            state: {
              rotation: state.rotation,
              position: data.data.position,
              status: Status.MoveToCircle,
              statusData: {
                destination: state.statusData.destination
              }
            },
            actions: [{ type: ActionTypes.Move, data: { direction: MovementDirection.Forward } }]
          }
        }
      }

      throw new Error('not possible')
    },

    rotatePlayerResponse: (
      data: SuccessfulRotatePlayerResponse | FailedRotatePlayerResponse,
      state: State<Status.RotateToCircle | Status.RotateToNextCirclePoint>
    ): { state: State<Status.MoveToCircle | Status.MoveToNextCirclePoint | Status.Stop>, actions: Action[] } => {
      console.log(chalk.cyan('RotatePlayerResponse'))
      if (!data.success) {
        return {
          state: {
            rotation: state.rotation,
            position: state.position,
            status: Status.Stop
          },
          actions: []
        }
      }

      if (state.status === Status.RotateToCircle) {
        const intersections = calculateIntersectionCircleLine(
          {
            center: {
              x: 200,
              y: 200
            },
            radius: 100
          },
          {
            point: state.position,
            slope: state.statusData.rotationToCircleBorder
          }
        )
        const closestIntersectionPoint = findClosestIntersectionPoint(state.position, intersections)

        const action: MoveAction = { type: ActionTypes.Move, data: { direction: MovementDirection.Forward } }
        return {
          state: {
            position: state.position,
            rotation: state.rotation,
            status: Status.MoveToCircle,
            statusData: {
              destination: closestIntersectionPoint
            }
          },
          actions: [action]
        }
      }

      if (state.status === Status.RotateToNextCirclePoint) {
        return {
          state: {
            position: state.position,
            rotation: state.rotation,
            status: Status.MoveToNextCirclePoint,
            statusData: {
              nextCirclePoint: state.statusData.nextCirclePoint
            }
          },
          actions: [{ type: ActionTypes.Move, data: { direction: MovementDirection.Forward } }]
        }
      }

      throw new Error('unexpected status')
    },

    radarScanNotification: (_scan: { players: { position: Position }[], shots: { position: Position }[], unknown: { position: Position }[] }, state: State<Status>): { state: State<Status>, actions: Action[] } => {
      console.log(chalk.cyan('RadarScanNotification'))
      return { state, actions: [] }
    },

    startGameNotification: (
      state: State<Status.WaitToStart>
    ): { state: State<Status.RotateToCircle>, actions: Action[] } => {
      console.log(chalk.cyan('StartGameNotification'))
      const rotationToCircleBorder = findRotationToCircleCenter(state.position, CIRCLE_CENTER)
      const action: RotateAction = { type: ActionTypes.Rotate, data: { rotation: rotationToCircleBorder } }

      return {
        state: {
          rotation: rotationToCircleBorder,
          position: state.position,
          status: Status.RotateToCircle,
          statusData: {
            rotationToCircleBorder
          }
        },
        actions: [action]
      }
    },

    joinGameNotification: (
      state: State<Status.WaitToStart>
    ): { state: State<Status.RotateToCircle>, actions: Action[] } => {
      console.log(chalk.cyan('JoinGameNotification'))
      const rotationToCircleBorder = findRotationToCircleCenter(state.position, CIRCLE_CENTER)
      const action: RotateAction = { type: ActionTypes.Rotate, data: { rotation: rotationToCircleBorder } }

      return {
        state: {
          rotation: rotationToCircleBorder,
          position: state.position,
          status: Status.RotateToCircle,
          statusData: {
            rotationToCircleBorder
          }
        },
        actions: [action]
      }
    }
  }
}

