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
  JoinGameNotification,
  GameSettings
} from '../src/types'
import {
  Request,
  rotateRequest,
  moveForwardRequest
} from '../src/requests'
import { calculateAngleBetweenPoints, calculateDistanceBetweenTwoPoints } from '../src/utils'

enum Status {
  Started = 'Started',
  NonStarted = 'NonStarted'
}

interface State {
  status: Status
  game?: {
    settings: GameSettings
  }
  bot: {
    destination?: Position
    rotation: number
    position: Position
  }
}

function randWithBoundaries (min: number, max: number): number {
  let value: number | undefined

  while (value === undefined) {
    const random = Math.round(Math.random() * max)

    if (random > min) {
      value = random
    }
  }

  return value
}

function botMovementBoundaries (settings: GameSettings): [Position, Position] {
  const { playerRadius, arenaWidth, arenaHeight } = settings
  const minX = playerRadius
  const minY = playerRadius
  const maxX = arenaWidth - playerRadius
  const maxY = arenaHeight - playerRadius

  return [{ x: minX, y: minY }, { x: maxX, y: maxY }]
}

function generateDestination (boundaries: [Position, Position]): Position {
  const [min, max] = boundaries
  const x = randWithBoundaries(min.x, max.x)
  const y = randWithBoundaries(min.y, max.y)

  return { x, y }
}

/*
* # About
* Simple bot implementation. This bot does the following:
*
* - Wander in the arena
*
* ## Arena wandering
*
* After joining the game the handler generates a random destination coordinates
* and calculates what rotation the bot should have to get there. It then
* moves bit by bit till in that direction. Once it's close
* enough to the destination it will generate a new destination coordinates and
* start over.
*
*/

export const bot: BotAPI<any> = {
  handlers: {
    registerPlayerResponse: (
      data: FailedRegisterPlayerResponse | SuccessfulRegisterPlayerResponse,
      _state: State
    ): { state: State, requests: Request[] } => {
      if (!data.success) {
        return process.exit(1)
      }

      const botState: State = {
        status: Status.NonStarted,
        bot: {
          rotation: data.data.rotation,
          position: data.data.position
        }
      }

      return { state: botState, requests: [] }
    },

    movePlayerResponse: (
      data: SuccessfulMovePlayerResponse | FailedMovePlayerResponse,
      state: State
    ): { state: State, requests: Request[] } => {
      console.log(chalk.cyan('MovePlayerResponse'))

      if (!data.success) {
        return process.exit(1)
      }

      state.bot.position = data.data.position

      return { state, requests: [] }
    },

    rotatePlayerResponse: (
      data: SuccessfulRotatePlayerResponse | FailedRotatePlayerResponse,
      state: State
    ): { state: State, requests: Request[] } => {
      console.log(chalk.cyan('RotatePlayerResponse'))

      if (!data.success) {
        return process.exit(1)
      }

      state.bot.rotation = data.data.rotation

      return { state , requests: [] }
    },

    tickNotification: (state: State): { state: State, requests: Request[] } => {
      console.log(chalk.cyan('TickNotificationn'))

      if (!state.game || state.status === Status.NonStarted) {
        return { state, requests: [] }
      }

      if (!state.bot.destination) {
        // Init the wandering
        state.bot.destination = generateDestination(botMovementBoundaries(state.game.settings))
        const rotation = calculateAngleBetweenPoints(state.bot.position, state.bot.destination)

        return { state, requests: [rotateRequest(rotation)] }
      } else {
        const distance = calculateDistanceBetweenTwoPoints(state.bot.destination, state.bot.position)

        if (distance < 5) {
          state.bot.destination = generateDestination(botMovementBoundaries(state.game.settings))
          const rotation = calculateAngleBetweenPoints(state.bot.position, state.bot.destination)

          return { state, requests: [rotateRequest(rotation)] }
        } else {
          return { state, requests: [moveForwardRequest({ withTurbo: false })] }
        }
      }
    },

    joinGameNotification: (
      data: JoinGameNotification,
      state: State
    ): { state: State, requests: Request[] } => {
      console.log(chalk.cyan('JoinGameNotification'))

      state.status = Status.Started
      state.game = { settings: data.data.game.settings }

      return {
        state,
        requests: []
      }
    }
  }
}
