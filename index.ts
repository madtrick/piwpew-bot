import * as fs from 'fs'
import * as path from 'path'
import WebSocket from 'ws'
import * as _ from 'lodash'
import yargs from 'yargs'
import {
  BotAPI,
  BotState,
  Rotation
} from './src/types'
import { ActionTypes, MovementDirection } from './src/actions'

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
  isJoinGameNotificationMessage,
  isShootResponseMessage
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

function dispatchMessage (ws: WebSocket, message: any, state: BotState<any>, bot: BotAPI<any>): BotState<any> {
  if (isRegisterPlayerResponseMessage(message)) {
    if (!bot.handlers.registerPlayerResponse) {
      return state
    }

    if (!message.success) {
      const { state: newBotState } = bot.handlers.registerPlayerResponse(
        { success: message.success, data: 'Failed player register' },
        state.bot
      )

      state.bot = newBotState

      return state
    } else {
      if (typeof message.details !== 'object') {
        throw new Error('invalid response message')
      }

      const { position, rotation } = message.details
      const { state: newBotState } = bot.handlers.registerPlayerResponse(
        { success: true, data: { position, rotation } },
        state.bot
      )

      state.bot = newBotState

      return state
    }
  }

  if (isMovePlayerResponseMessage(message)) {
    if (!bot.handlers.movePlayerResponse) {
      return state
    }

    if (!message.success) {
      const { state: newBotState } = bot.handlers.movePlayerResponse(
        { success: message.success, data: 'Failed to move player' },
        state.bot
      )

      state.bot = newBotState

      return state
    } else {
      if (typeof message.details !== 'object') {
        throw new Error('invalid response message')
      }

      const { position } = message.details
      const { state: newBotState, actions: [action] } = bot.handlers.movePlayerResponse(
        { success: true, data: { position } },
        state.bot
      )

      state.bot = newBotState

      if (action && action.type === ActionTypes.Move) {
        move(ws, action.data.direction)
      }

      if (action && action.type === ActionTypes.Rotate) {
        rotate(ws, action.data.rotation)
      }

      return state
    }
  }

  if (isRotatePlayerResponseMessage(message)) {
    if (!bot.handlers.rotatePlayerResponse) {
      return state
    }

    const { state: newBotState, actions: [action] } = bot.handlers.rotatePlayerResponse(
      { success: message.success },
      state.bot
    )

    state.bot = newBotState

    if (action && action.type === ActionTypes.Move) {
      move(ws, action.data.direction)
    }

    if (action && action.type === ActionTypes.Shoot) {
      shoot(ws)
    }

    return state
  }

  if (isShootResponseMessage(message)) {
    if (!bot.handlers.shootResponse) {
      return state
    }

    const { state: newBotState, actions: [action] } = bot.handlers.shootResponse(
      { success: message.success },
      state.bot
    )

    state.bot = newBotState

    if (action && action.type === ActionTypes.Rotate) {
      rotate(ws, action.data.rotation)
    }

    if (action && action.type === ActionTypes.Shoot) {
      shoot(ws)
    }

    return state
  }

  if (isRadarScanNotificationMessage(message)) {
    if (!bot.handlers.radarScanNotification) {
      return state
    }

    if (typeof message.data !== 'object') {
      throw new Error('invalid message response')
    }

    const { data } = message
    const { state: newBotState, actions: [action] } = bot.handlers.radarScanNotification(data, state.bot)

    state.bot = newBotState

    if (!action) {
      return state
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

    return state
  }

  if (isStartGameNotificationMessage(message)) {
    if (!bot.handlers.startGameNotification) {
      return state
    }

    const { state: newBotState, actions: [action] } = bot.handlers.startGameNotification(state.bot)

    state.bot = newBotState

    if (action && action.type === ActionTypes.Move) {
      move(ws, action.data.direction)
    }

    if (action && action.type === ActionTypes.Rotate) {
      rotate(ws, action.data.rotation)
    }

    return state
  }

  if (isJoinGameNotificationMessage(message)) {
    if (!bot.handlers.joinGameNotification) {
      return state
    }

    const { state: newBotState, actions: [action] } = bot.handlers.joinGameNotification(state.bot)

    state.bot = newBotState

    if (action && action.type === ActionTypes.Move) {
      move(ws, action.data.direction)
    }

    if (action && action.type === ActionTypes.Rotate) {
      rotate(ws, action.data.rotation)
    }

    return state
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

  let botImport: Promise<{ bot: BotAPI<any>}>
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
