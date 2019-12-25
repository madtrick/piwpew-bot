import * as fs from 'fs'
import * as path from 'path'
import WebSocket from 'ws'
import * as _ from 'lodash'
import yargs from 'yargs'
import {
  BotAPI,
  BotState,
  ActionTypes,
  Rotation,
  MovementDirection
} from './src/types'

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

function dispatchMessage (ws: WebSocket, message: any, state: BotState<any>, bot: BotAPI): BotState<any> {
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
      const { state: newState, actions: [action] } = bot.handlers.movePlayerResponse({ success: true, data: { position } }, state)

      if (action && action.type === ActionTypes.Move) {
        move(ws, action.data.direction)
      }

      if (action && action.type === ActionTypes.Rotate) {
        rotate(ws, action.data.rotation)
      }

      return newState
    }
  }

  if (isRotatePlayerResponseMessage(message)) {
    const { state: newState, actions: [action] } = bot.handlers.rotatePlayerResponse({ success: message.success }, state)

    if (action && action.type === ActionTypes.Move) {
      move(ws, action.data.direction)
    }

    return newState
  }

  if (isRadarScanNotificationMessage(message)) {
    if (typeof message.data !== 'object') {
      throw new Error('invalid message response')
    }

    const { data } = message
    const { state: newState, actions: [action] } = bot.handlers.radarScanNotification(data, state)

    if (!action) {
      return newState
    }

    if (action.type === ActionTypes.Move) {
      move(ws, action.data.direction)
    }

    if (action.type === ActionTypes.Rotate) {
      rotate(ws, action.data.rotation)
    }

    if (action.type === ActionTypes.Shoot) {
      shoot(ws)
    }

    if (action.type === ActionTypes.DeployMine) {
      deployMine(ws)
    }

    return newState
  }

  if (isStartGameNotificationMessage(message)) {
    const { state: newState, actions: [action] } = bot.handlers.startGameNotification(state)

    if (action && action.type === ActionTypes.Move) {
      move(ws, action.data.direction)
    }

    if (action && action.type === ActionTypes.Rotate) {
      rotate(ws, action.data.rotation)
    }

    return newState
  }

  if (isJoinGameNotificationMessage(message)) {
    const { state: newState, actions: [action] } = bot.handlers.joinGameNotification(state)

    if (action && action.type === ActionTypes.Move) {
      move(ws, action.data.direction)
    }

    if (action && action.type === ActionTypes.Rotate) {
      rotate(ws, action.data.rotation)
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

  let state: BotState<any> = {
    // TODO fix the typings here
    tracker: argv.t as boolean,
    shooter: argv.s as boolean,
    bot: {}
  }

  let botImport: Promise<{ bot: BotAPI}>
  if (argv.p) {
    botImport = import(argv.p as string)
  } else {
    botImport = import('./src/bot')
  }

  botImport.then(({ bot }) => {
    ws.on('message', function handleMessage (json: string): void {
      const message = JSON.parse(json)

      writeMessagesToFile('recv', message)
      state = dispatchMessage(ws, message, state, bot)
    })
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
