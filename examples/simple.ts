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

interface State {
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

      if (!data.success || !state.bot.destination || !state.game) {
        return process.exit(1)
      }

      state.bot.position = data.data.position
      const distance = calculateDistanceBetweenTwoPoints(state.bot.destination, data.data.position)

      if (distance < 5) {
        const destination = generateDestination(botMovementBoundaries(state.game.settings))
        const rotation = calculateAngleBetweenPoints(state.bot.position, destination)
        return { state, requests: [rotateRequest(rotation)] }
      } else {
        return { state, requests: [moveForwardRequest({ withTurbo: false })] }
      }
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

      return { state , requests: [moveForwardRequest({ withTurbo: false })] }
    },

    joinGameNotification: (
      data: JoinGameNotification,
      state: State
    ): { state: State, requests: Request[] } => {
      console.log(chalk.cyan('JoinGameNotification'))

      state.game = { settings: data.data.game.settings }

      const destination = generateDestination(botMovementBoundaries(state.game.settings))
      const rotation = calculateAngleBetweenPoints(state.bot.position, destination)
      state.bot.destination = destination

      return {
        state,
        requests: [rotateRequest(rotation)]
      }
    }
  }
}
