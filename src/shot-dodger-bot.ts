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
  Rotation
} from './types'
import {
  Action,
  rotateAction,
  moveForwardAction
} from './actions'
import { calculateAngleBetweenPoints } from './utils'

enum Status {
  Unregistered,
  NotStarted,
  RotateToCorner,
  MovingToCorner,
  Stop
}

const TOP_LEFT_CORNER = { x: 100, y: 200 }
const TOP_RIGHT_CORNER = { x: 200, y: 200 }
const BOTTOM_LEFT_CORNER = { x: 100, y: 100 }
const BOTTOM_RIGHT_CORNER = { x: 200, y: 100 }
const PLAYER_RADIUS = 16

const ORDER = [TOP_LEFT_CORNER, BOTTOM_RIGHT_CORNER, TOP_RIGHT_CORNER, BOTTOM_LEFT_CORNER]

type StatusData<S> =
  S extends Status.RotateToCorner ? { status: Status.RotateToCorner, statusData: { rotationToCorner: number, cornerIndex: number } } :
  S extends Status.Unregistered ? { status: Status.Unregistered } :
  S extends Status.NotStarted ? { status: Status.NotStarted } :
  S extends Status.MovingToCorner ? { status: Status.MovingToCorner, statusData: { cornerIndex: number } } :
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
    ): { state: State<Status.NotStarted | Status.Unregistered>, actions: Action[] } => {
      console.log(chalk.cyan('RegisterPlayerResponse'))
      if (!data.success) {
        return { state, actions: [] }
      }

      if (data.success) {
        const botState: State<Status.NotStarted> = {
          // TODO read the real rotation
          status: Status.NotStarted,
          rotation: 0,
          position: data.data.position
        }

        return { state: botState, actions: [] }
      }

      throw new Error('not possible')
    },

    movePlayerResponse: (
      data: SuccessfulMovePlayerResponse | FailedMovePlayerResponse,
      state: State<Status.MovingToCorner>
    ): { state: State<Status.MovingToCorner | Status.Stop | Status.RotateToCorner>, actions: Action[] } => {
      console.log(chalk.cyan('MovePlayerResponse'))
      if (!data.success) {
        return {
          state: {
            ...state,
            status: Status.Stop
          },
          actions: []
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
            actions: [rotateAction(rotationToCorner)]
          }
        } else {
          return {
            state: {
              ...state,
              position: data.data.position
            },
            actions: [moveForwardAction()]
          }
        }
      }

      throw new Error('not possible')
    },

    rotatePlayerResponse: (
      data: SuccessfulRotatePlayerResponse | FailedRotatePlayerResponse,
      state: State<Status.RotateToCorner>
    ): { state: State<Status.MovingToCorner | Status.Stop>, actions: Action[] } => {
      console.log(chalk.cyan('RotatePlayerResponse'))
      if (!data.success) {
        return {
          state: {
            ...state,
            status: Status.Stop
          },
          actions: []
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
          actions: [moveForwardAction()]
        }
      }

      throw new Error('not possible')
    },

    radarScanNotification: (
      scan: {
        players: { position: Position }[],
        shots: { position: Position }[],
        unknown: { position: Position }[]
      },
      state: State<Exclude<Status, Status.NotStarted | Status.Unregistered>>
    ): { state: State<Status>, actions: Action[] } => {
      console.log(chalk.cyan('RadarScanNotification'))
      const currentRadarData = state.radarData
      const scanPairs: { position: Position }[][] = []

      state.radarData.players = scan.players

      currentRadarData.players.forEach((previouslyScannedPlayer) => {
        scan.players.forEach((scannedPlayer) => {
          const xDelta = Math.abs(scannedPlayer.position.x - previouslyScannedPlayer.position.x)
          const yDelta = Math.abs(scannedPlayer.position.y - previouslyScannedPlayer.position.y)

          if (xDelta < 1 || yDelta < 1) {
            scanPairs.push([previouslyScannedPlayer, scannedPlayer])
            return
          }
        })
      })

      console.dir(scanPairs, { depth: null, colors: true })

      let nextStateAndAction: { state: State<Status.RotateToCorner>, actions: Action[] } | undefined
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
          const approximatedNextPosition = approximateNextPosition(state.position, state.rotation)
          const distanceForApproximatePosition = calculateDistanceBetweenTwoPoints(currentScan.position, approximatedNextPosition)

          if (distanceForApproximatePosition > distanceCurrentScan) {
            return { state, actions: [] }
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

            nextStateAndAction = {
              state: {
                ...state,
                rotation: rotationToCorner,
                radarData: {
                  players: scan.players
                },
                status: Status.RotateToCorner,
                statusData: {
                  rotationToCorner,
                  cornerIndex: ORDER.indexOf(nextCorner)
                }
              },
              actions: [rotateAction(rotationToCorner)]
            }
          }
        }

        return undefined
      })

      if (nextStateAndAction) {
        return nextStateAndAction
      } else {
        return { state, actions: [] }
      }
    },

    startGameNotification: (
      state: State<Status.NotStarted>
    ): { state: State<Status.RotateToCorner>, actions: Action[] } => {
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
        actions: [rotateAction(rotationToCorner)]
      }
    },

    joinGameNotification: (
      state: State<Status.NotStarted>
    ): { state: State<Status.RotateToCorner>, actions: Action[] } => {
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
        actions: [rotateAction(rotationToCorner)]
      }
    }
  }
}

