import chalk from 'chalk'

import {
  BotAPI,
  RadarScanNotification,
  SuccessfulRegisterPlayerResponse,
  FailedRegisterPlayerResponse,
  SuccessfulMovePlayerResponse,
  FailedMovePlayerResponse,
  SuccessfulRotatePlayerResponse,
  FailedRotatePlayerResponse,
  Position,
  Rotation
} from '../src/types'
import {
  Request,
  rotateRequest,
  moveForwardRequest
  // moveBackwardRequest
} from '../src/requests'
import { calculateAngleBetweenPoints } from '../src/utils'

enum Status {
  Unregistered,
  NotStarted,
  RotateToCorner,
  MovingToCorner,
  AvoidingShot,
  Stop
}

const TOP_LEFT_CORNER = { x: 100, y: 200 }
const TOP_RIGHT_CORNER = { x: 200, y: 200 }
const BOTTOM_LEFT_CORNER = { x: 100, y: 100 }
const BOTTOM_RIGHT_CORNER = { x: 200, y: 100 }
const PLAYER_RADIUS = 16

const ORDER = [TOP_LEFT_CORNER, BOTTOM_RIGHT_CORNER, TOP_RIGHT_CORNER, BOTTOM_LEFT_CORNER]

enum AvoidingShotStatus {
  Backtracking,
  Backtracked,
  Pivoting
}

type AvoidingShotStatusData<S> = S extends AvoidingShotStatus.Pivoting ? { pivot: Position, currentStatus: any, currentData: any } : never

type StatusData<S> =
  S extends Status.RotateToCorner ? { status: Status.RotateToCorner, statusData: { rotationToCorner: number, cornerIndex: number } } :
  S extends Status.Unregistered ? { status: Status.Unregistered } :
  S extends Status.NotStarted ? { status: Status.NotStarted } :
  S extends Status.MovingToCorner ? { status: Status.MovingToCorner, statusData: { cornerIndex: number } } :
  S extends Status.AvoidingShot ? { status: Status.AvoidingShot, avoidingShotStatus: AvoidingShotStatus, statusData: AvoidingShotStatusData<AvoidingShotStatus> } :
  S extends Status.Stop ? { status: Status.Stop } :
  never

type RadarData<S> =
  S extends Status.Unregistered ? {} :
  S extends Status.NotStarted ? {} :
  { radarData: { players: { position: Position }[] } }

type State<S extends Status> = { position: Position, rotation: Rotation } & RadarData<S> & StatusData<S>

function calculateDistanceBetweenTwoPoints (pointA: Position, pointB: Position): number {
  return Math.sqrt(
    Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2)
  )
}

function approximateNextPosition (from: Position, rotation: Rotation): Position {
  const movementSpeed = 5
  const radians = (rotation * Math.PI) / 180
  const dX = movementSpeed * Math.cos(radians)
  const dY = movementSpeed * Math.sin(radians)
  const newX = Math.round(dX + from.x)
  const newY = Math.round(dY + from.y)

  return { x: newX, y: newY }
}

function circlesIntersect (circleA: { center: Position, radius: number }, circleB: { center: Position, radius: number }): boolean {
  const { center: { x: xa, y: ya }, radius: radiusA } = circleA
  const { center: { x: xb, y: yb }, radius: radiusB } = circleB
  const value = Math.pow((xa - xb), 2) + Math.pow((ya - yb), 2)

  return Math.pow(radiusA - radiusB, 2) <= value && value <= Math.pow(radiusA + radiusB, 2)
}

function circleInsideAnother (circleA: { center: Position, radius: number }, circleB: { center: Position, radius: number }): boolean {
  // Formula got at https://stackoverflow.com/a/33490701
  const { center: { x: xa, y: ya }, radius: radiusA } = circleA
  const { center: { x: xb, y: yb }, radius: radiusB } = circleB
  const distance = Math.sqrt(Math.pow((xa - xb), 2) + Math.pow((ya - yb), 2))

  return radiusA > (distance + radiusB)
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
    ): { state: State<Status.NotStarted | Status.Unregistered>, requests: Request[] } => {
      console.log(chalk.cyan('RegisterPlayerResponse'))
      if (!data.success) {
        return { state, requests: [] }
      }

      if (data.success) {
        const botState: State<Status.NotStarted> = {
          // TODO read the real rotation
          status: Status.NotStarted,
          rotation: 0,
          position: data.data.position
        }

        return { state: botState, requests: [] }
      }

      throw new Error('not possible')
    },

    movePlayerResponse: (
      data: SuccessfulMovePlayerResponse | FailedMovePlayerResponse,
      state: State<Status.MovingToCorner | Status.AvoidingShot>
    ): { state: State<Status.MovingToCorner | Status.Stop | Status.RotateToCorner | Status.AvoidingShot>, requests: Request[] } => {
      console.log(chalk.cyan('MovePlayerResponse'))
      if (!data.success) {
        return {
          state: {
            ...state,
            status: Status.Stop
          },
          requests: []
        }
      }

      if (state.status === Status.AvoidingShot) {
        if (state.avoidingShotStatus === AvoidingShotStatus.Pivoting) {
          const { pivot } = state.statusData
          const xDelta = Math.abs(data.data.position.x - pivot.x)
          const yDelta = Math.abs(data.data.position.y - pivot.y)

          if (xDelta < 5 && yDelta < 5) {
            return {
              state: {
                ...state,
                status: state.statusData.currentStatus,
                statusData: state.statusData.currentData,
                position: data.data.position
              },
              // TODO the request should depend on the current status
              requests: [moveForwardRequest()]
            }
          } else {
            return {
              state: {
                ...state,
                position: data.data.position
              },
              requests: [moveForwardRequest()]
            }
          }
        } else {
          return {
            state: {
              ...state,
              position: data.data.position,
              avoidingShotStatus: AvoidingShotStatus.Backtracked
            },
            requests: []
          }
        }
      }

      if (state.status === Status.MovingToCorner) {
        // TODO remove the hardcoded values for the arena center
        const currentCornerIndex = state.statusData.cornerIndex
        const corner = ORDER[currentCornerIndex]
        const xDelta = Math.abs(data.data.position.x - corner.x)
        const yDelta = Math.abs(data.data.position.y - corner.y)

        if (xDelta < 5 && yDelta < 5) {
          const nextCornerIndex = (currentCornerIndex + 1) % ORDER.length
          const nextCorner = ORDER[nextCornerIndex]
          const rotationToCorner = calculateAngleBetweenPoints(data.data.position, nextCorner)

          return {
            state: {
              ...state,
              status: Status.RotateToCorner,
              statusData: {
                rotationToCorner,
                cornerIndex: nextCornerIndex
              },
              rotation: rotationToCorner,
              position: data.data.position
            },
            requests: [rotateRequest(rotationToCorner)]
          }
        } else {
          return {
            state: {
              ...state,
              position: data.data.position
            },
            requests: [moveForwardRequest()]
          }
        }
      }

      throw new Error('not possible')
    },

    rotatePlayerResponse: (
      data: SuccessfulRotatePlayerResponse | FailedRotatePlayerResponse,
      state: State<Status.RotateToCorner | Status.AvoidingShot>
    ): { state: State<Status.MovingToCorner | Status.AvoidingShot | Status.Stop>, requests: Request[] } => {
      console.log(chalk.cyan('RotatePlayerResponse'))
      if (!data.success) {
        return {
          state: {
            ...state,
            status: Status.Stop
          },
          requests: []
        }
      }

      if (state.status === Status.RotateToCorner) {
        return {
          state: {
            ...state,
            rotation: state.statusData.rotationToCorner,
            status: Status.MovingToCorner,
            statusData: {
              cornerIndex: state.statusData.cornerIndex
            }
          },
          requests: [moveForwardRequest()]
        }
      }

      if (state.status === Status.AvoidingShot) {
        if (state.avoidingShotStatus === AvoidingShotStatus.Pivoting) {
          return {
            state,
            requests: [moveForwardRequest()]
          }
        }
      }

      throw new Error('not possible')
    },

    radarScanNotification: (
      data: RadarScanNotification,
      state: State<Exclude<Status, Status.NotStarted | Status.Unregistered>>
    ): { state: State<Status>, requests: Request[] } => {
      console.log(chalk.cyan('RadarScanNotification'))
      const currentRadarData = state.radarData
      const scanPairs: { position: Position }[][] = []
      // TODO take into account the state of the bot. Are we moving backward/forward? rotating?
      const { x, y } = state.position
      const approximatedNextPosition = approximateNextPosition({ x: x + 3, y: y + 3 }, state.rotation)
      const oldStatus = state.status

      state.radarData.players = data.data.players

      if (state.status === Status.AvoidingShot && state.avoidingShotStatus === AvoidingShotStatus.Backtracked) {
        state.status = state.statusData.currentStatus
        state.statusData = state.statusData.currentData
      }

      if (state.status !== Status.AvoidingShot) {
        const possibleShotCollition = data.data.shots.find((shot) => {
          const shotHit = circlesIntersect(
            { center: approximatedNextPosition, radius: 16 },
            { center: shot.position, radius: 1 }
          ) || circleInsideAnother(
            { center: approximatedNextPosition, radius: 16 },
            { center: shot.position, radius: 1 }
          )

          if (shotHit) {
            console.log('Possible hit with', shot.position, approximatedNextPosition)
          }

          return shotHit
        })

        if (possibleShotCollition && state.status !== Status.Stop) {
          const angleBetweenBotAndShot = calculateAngleBetweenPoints(state.position, possibleShotCollition.position)
          const anglePerpendicularToRotation = (angleBetweenBotAndShot + 90) % 360
          const angleInRadians = (anglePerpendicularToRotation * Math.PI) / 180
          const distance = 32

          let x2: number
          let y2: number
          debugger

          if (anglePerpendicularToRotation <= 90) {
            console.log('First Q')
            x2 = distance * Math.cos(angleInRadians) + possibleShotCollition.position.x
            y2 = distance * Math.sin(angleInRadians) + possibleShotCollition.position.y
          } else if (anglePerpendicularToRotation > 90 && anglePerpendicularToRotation <= 180) {
            console.log('Second Q')
            x2 = distance * Math.cos(angleInRadians) + possibleShotCollition.position.x
            y2 = distance * Math.sin(angleInRadians) + possibleShotCollition.position.y
          } else if (anglePerpendicularToRotation > 180 && anglePerpendicularToRotation <= 270) {
            console.log('Third Q')
            x2 = distance * Math.cos(angleInRadians) + possibleShotCollition.position.x
            y2 = distance * Math.sin(angleInRadians) + possibleShotCollition.position.y
          } else if (anglePerpendicularToRotation > 270 && anglePerpendicularToRotation <= 360) {
            console.log('Fourth Q')
            x2 = distance * Math.cos(angleInRadians) + possibleShotCollition.position.x
            y2 = distance * Math.sin(angleInRadians) + possibleShotCollition.position.y
          }

          const pivot = { x: x2!, y: y2! }
          const angleToPivot = calculateAngleBetweenPoints(state.position, pivot)
          return {
            state: {
              ...state,
              status: Status.AvoidingShot,
              avoidingShotStatus: AvoidingShotStatus.Pivoting,
              rotation: angleToPivot,
              statusData: {
                pivot,
                currentStatus: state.status,
                currentData: state.statusData
              }
            },
            requests: [rotateRequest(angleToPivot)]
          }
          // return {
          //   state: {
          //     ...state,
          //     status: Status.AvoidingShot,
          //     avoidingShotStatus: AvoidingShotStatus.Backtracking,
          //     statusData: {
          //       currentStatus: state.status,
          //       currentData: state.statusData
          //     }
          //   },
          //   requests: [moveBackwardRequest()]
          // }
        }
      }
      //   if (possibleShotCollition && state.status !== Status.Stop) {
      //     return {
      //       state: {
      //         ...state,
      //         status: Status.AvoidingShot,
      //         avoidingShotStatus: AvoidingShotStatus.Backtracking,
      //         statusData: {
      //           currentStatus: state.status,
      //           currentData: state.statusData
      //         }
      //       },
      //       requests: [moveBackwardRequest()]
      //     }
      //   }
      // }

      currentRadarData.players.forEach((previouslyScannedPlayer) => {
        data.data.players.forEach((scannedPlayer) => {
          // This only works if there's one player in the radar
          const xDelta = Math.abs(scannedPlayer.position.x - previouslyScannedPlayer.position.x)
          const yDelta = Math.abs(scannedPlayer.position.y - previouslyScannedPlayer.position.y)

          if (xDelta < 1 || yDelta < 1) {
            scanPairs.push([previouslyScannedPlayer, scannedPlayer])
            return
          }
        })
      })

      let nextStateAndRequest: { state: State<Status.RotateToCorner>, requests: Request[] } | undefined
      scanPairs.forEach((scanPair) => {
        const [currentScan, previousScan] = scanPair
        const distanceCurrentScan = calculateDistanceBetweenTwoPoints(currentScan.position, state.position)
        const distancePreviousScan = calculateDistanceBetweenTwoPoints(previousScan.position, state.position)

        if (distanceCurrentScan > distancePreviousScan) {
          console.log('>>>> Getting away')
        }

        if (distanceCurrentScan < distancePreviousScan) {
          console.log('>>>> Getting closer')
        }

        if (distanceCurrentScan === distancePreviousScan) {
          console.log('>>>> Same distance')
          const distanceForApproximatePosition = calculateDistanceBetweenTwoPoints(currentScan.position, approximatedNextPosition)

          if (distanceForApproximatePosition > distanceCurrentScan) {
            return { state, requests: [] }
          }

          const nextCorner = ORDER.find((corner) => {
            const rotationToCorner = calculateAngleBetweenPoints(state.position, corner)
            const { x: newX, y: newY } = approximateNextPosition(state.position, rotationToCorner)

            // Calculate if after moving the bot would still collide
            const { x: ox, y: oy } = currentScan.position
            const value = Math.pow((newX - ox), 2) + Math.pow((newY - oy), 2)
            // TODO the Math.pow(PLAYER_RADIUS - PLAYER_RADIUS, 2) part is useless
            // but will it keep it here in case we have players with different radius

            return !(
              Math.pow(PLAYER_RADIUS - PLAYER_RADIUS, 2) <= value &&
              value <= Math.pow(PLAYER_RADIUS + PLAYER_RADIUS, 2)
            )
          })

          if (nextCorner) {
            // TODO we have found a new target. Exit the outer loop
            const rotationToCorner = calculateAngleBetweenPoints(state.position, nextCorner)

            nextStateAndRequest = {
              state: {
                ...state,
                rotation: rotationToCorner,
                radarData: {
                  players: data.data.players
                },
                status: Status.RotateToCorner,
                statusData: {
                  rotationToCorner,
                  cornerIndex: ORDER.indexOf(nextCorner)
                }
              },
              requests: [rotateRequest(rotationToCorner)]
            }
          }
        }

        return undefined
      })

      if (nextStateAndRequest) {
        return nextStateAndRequest
      } else {
        if (oldStatus === Status.AvoidingShot) {
          // Reset to previous behaviour
          if (state.status === Status.MovingToCorner) {
            return {
              state,
              requests: [moveForwardRequest()]
            }
          } else if (state.status === Status.RotateToCorner) {
            return { state, requests: [rotateRequest(state.statusData.rotationToCorner)] }
          } else {
            console.log('Unhandled reset state', state.status)
            return { state, requests: [] }
          }
        } else {
          return { state, requests: [] }
        }
      }
    },

    startGameNotification: (
      state: State<Status.NotStarted>
    ): { state: State<Status.RotateToCorner>, requests: Request[] } => {
      console.log(chalk.cyan('StartGameNotification'))
      const corner = ORDER[0]
      const rotationToCorner = calculateAngleBetweenPoints(state.position, corner)

      return {
        state: {
          radarData: {
            players: []
          },
          status: Status.RotateToCorner,
          statusData: {
            rotationToCorner,
            cornerIndex: 0
          },
          rotation: state.rotation,
          position: state.position
        },
        requests: [rotateRequest(rotationToCorner)]
      }
    },

    joinGameNotification: (
      state: State<Status.NotStarted>
    ): { state: State<Status.RotateToCorner>, requests: Request[] } => {
      console.log(chalk.cyan('JoinGameNotification'))
      const corner = ORDER[0]
      const rotationToCorner = calculateAngleBetweenPoints(state.position, corner)

      return {
        state: {
          radarData: {
            players: []
          },
          status: Status.RotateToCorner,
          statusData: {
            rotationToCorner,
            cornerIndex: 0
          },
          rotation: state.rotation,
          position: state.position
        },
        requests: [rotateRequest(rotationToCorner)]
      }
    }
  }
}

