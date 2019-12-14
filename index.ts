import * as fs from 'fs'
import * as path from 'path'
import WebSocket from 'ws'
import * as _ from 'lodash'
import yargs from 'yargs'
import {
  Action,
  ActionTypes,
  Position,
  Rotation,
  MovementDirection
} from './src/types'

import { bot } from './src/bot'

import {
  MessageTypes,
  RequestTypes,
  RegisterPlayerRequestMessage,
  MovePlayerRequestMessage,
  RotatePlayerRequestMessage,
  ShootRequestMessage,
  DeployMineRequestMessage,
  isRegisterPlayerResponseMessage,
  isMovePlayerResponseMessage,
  isRotatePlayerResponseMessage,
  isRadarScanNotificationMessage,
  isStartGameNotificationMessage,
  isJoinGameNotificationMessage
} from './src/messages'

const ws = new WebSocket('ws://localhost:8889')
const argv = yargs.demand(['i']).argv
const playerId = argv.i as string
const messagesLogPath = path.join(__dirname, argv.i + '-messages.log')

function move (ws: WebSocket, direction: MovementDirection): void {
  const data: MovePlayerRequestMessage = {
    type: MessageTypes.Request,
    id: RequestTypes.MovePlayer,
    data: {
      movement: {
        direction: direction
      }
    }
  }

  writeMessagesToFile('send', data)

  ws.send(JSON.stringify(data))
}

function rotate (ws: WebSocket, rotation: Rotation): void {
  const data: RotatePlayerRequestMessage = {
    type: MessageTypes.Request,
    id: RequestTypes.RotatePlayer,
    data: {
      rotation
    }
  }

  writeMessagesToFile('send', data)

  ws.send(JSON.stringify(data))
}

function shoot (ws: WebSocket): void {
  const data: ShootRequestMessage = {
    type: MessageTypes.Request,
    id: RequestTypes.Shoot
  }

  writeMessagesToFile('send', data)

  ws.send(JSON.stringify(data))
}

function deployMine (ws: WebSocket): void {
  const data: DeployMineRequestMessage = {
    type: MessageTypes.Request,
    id: RequestTypes.DeployMine
  }

  writeMessagesToFile('send', data)

  ws.send(JSON.stringify(data))
}

export interface BotState {
  tracker: boolean
  shooter: boolean
  bot: any
}

interface RegisterPlayerResponseHandler {
  (data: SuccessfulRegisterPlayerResponse | FailedRegisterPlayerResponse, state: BotState): { state: BotState, actions: Action[] }

}

export interface BotAPI {
  handlers: {
    radarScanNotification: (scan: { players: { position: Position }[], shots: { position: Position }[], unknown: { position: Position }[] }, state: BotState) => { state: BotState, actions: Action[] }
    registerPlayerResponse: RegisterPlayerResponseHandler
    rotatePlayerResponse: (success: SuccessfulRotatePlayerResponse | FailedRotatePlayerResponse, state: BotState) => { state: BotState, actions: Action[] }
    movePlayerResponse: (data: SuccessfulMovePlayerResponse | FailedMovePlayerResponse, state: BotState) => { state: BotState, actions: Action[] }
    startGameNotification: (state: BotState) => { state: BotState, actions: Action[] }
    joinGameNotification: (state: BotState) => { state: BotState, actions: Action[] }
  }
}

export interface SuccessfulRegisterPlayerResponse {
  success: true
  data: {
    position: Position
    rotation: Rotation
  }
}

export interface FailedRegisterPlayerResponse {
  success: false
  data: string
}

export interface SuccessfulMovePlayerResponse {
  success: false
  data: string
}

export interface FailedMovePlayerResponse {
  success: true
  data: {
    position: Position
  }
}

export interface SuccessfulRotatePlayerResponse {
  success: true
}

export interface FailedRotatePlayerResponse {
  success: false
}

function dispatchMessage (ws: WebSocket, message: any, state: BotState, bot: BotAPI): BotState {
  if (isRegisterPlayerResponseMessage(message)) {
    if (!message.success) {
      const { state: newState } = bot.handlers.registerPlayerResponse({ success: message.success, data: 'Failed player register' }, state)

      return newState
    } else {
      if (typeof message.details !== 'object') {
        throw new Error('invalid response message')
      }

      const { position, rotation } = message.details
      const { state: newState } = bot.handlers.registerPlayerResponse({ success: true, data: { position, rotation } }, state)

      return newState
    }
  }

  if (isMovePlayerResponseMessage(message)) {
    if (!message.success) {
      const { state: newState } = bot.handlers.movePlayerResponse({ success: message.success, data: 'Failed to move player' }, state)

      return newState
    } else {
      if (typeof message.details !== 'object') {
        throw new Error('invalid response message')
      }

      const { position } = message.details
      const { state: newState } = bot.handlers.movePlayerResponse({ success: true, data: { position } }, state)

      return newState
    }
  }

  if (isRotatePlayerResponseMessage(message)) {
    const { state: newState } = bot.handlers.rotatePlayerResponse({ success: message.success }, state)

    return newState
  }

  if (isRadarScanNotificationMessage(message)) {
    if (typeof message.data !== 'object') {
      throw new Error('invalid message response')
    }

    const { data } = message
    const { state: newState, actions: [action] } = bot.handlers.radarScanNotification(data, state)

    if (action.type === ActionTypes.Move) {
      move(ws, action.data.direction)

      return newState
    }

    if (action.type === ActionTypes.Rotate) {
      rotate(ws, action.data.rotation)

      return newState
    }

    if (action.type === ActionTypes.Shoot) {
      shoot(ws)

      return newState
    }

    if (action.type === ActionTypes.DeployMine) {
      deployMine(ws)

      return newState
    }
  }

  if (isStartGameNotificationMessage(message)) {
    const { state: newState, actions: [action] } = bot.handlers.startGameNotification(state)

    if (action.type === ActionTypes.Move) {
      move(ws, action.data.direction)
    }

    return newState
  }

  if (isJoinGameNotificationMessage(message)) {
    const { state: newState, actions: [action] } = bot.handlers.joinGameNotification(state)

    if (action.type === ActionTypes.Move) {
      move(ws, action.data.direction)
    }

    return newState
  }

  console.log('unexpected message')
  console.dir(message, { colors: true, depth: null })

  return state
}

ws.on('open', function open (): void {
  truncateMessagesFile()

  const message: RegisterPlayerRequestMessage = {
    type: MessageTypes.Request,
    id: RequestTypes.RegisterPlayer,
    data: {
      id: playerId
    }
  }

  ws.send(JSON.stringify(message), { mask: true })

  let state: BotState = {
    // TODO fix the typings here
    tracker: argv.t as boolean,
    shooter: argv.s as boolean,
    bot: {}
  }
  ws.on('message', function handleMessage (json: string): void {
    const message = JSON.parse(json)

    writeMessagesToFile('recv', message)
    state = dispatchMessage(ws, message, state, bot)
  })
})

ws.on('close', function close (): void {
  console.log('Connection closed')
  process.exit(0)
})

function truncateMessagesFile (): void {
  if (fs.existsSync(messagesLogPath)) {
    fs.truncateSync(messagesLogPath)
  }
}

function writeMessagesToFile (prefix: string, messages: any): void {
  const data = '[' + prefix + ']' + JSON.stringify(messages) + '\n'

  fs.appendFileSync(messagesLogPath, data)
}
