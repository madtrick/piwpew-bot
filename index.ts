import * as fs from 'fs'
import * as path from 'path'
import WebSocket from 'ws'
import * as _ from 'lodash'
import yargs from 'yargs'
import Planner from './src/planner'
import Oracle from './src/oracle'
import Gunner from './src/gunner'
import {
  Position,
  Bot,
  MovementDirection,
  MessageTypes,
  NotificationTypes,
  ResponseTypes,
  RequestTypes,
  Message,
  RegisterPlayerResponseMessage,
  MovePlayerRequestMessage,
  MovePlayerResponseMessage,
  RotatePlayerResponseMessage,
  RadarScanNotificationMessage,
  ShootRequestMessage,
  StartGameNofiticationMessage
} from './src/types'


interface State {
  bot?: Bot
}

const ws = new WebSocket('ws://localhost:8080')
const gunner = new Gunner()
const argv = yargs.demand(['i']).argv
const messagesLogPath = path.join(__dirname, argv.i + '-messages.log')
let oracle
let lastMovementConfirmed = false

function move (ws: WebSocket, direction: MovementDirection): void {
  const data: MovePlayerRequestMessage = {
    sys: {
      type: MessageTypes.Request,
      id: RequestTypes.MovePlayer
    },
    data: {
      movement: {
        direction: direction
      }
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

function isRegisterPlayerResponseMessage (message: any): message is RegisterPlayerResponseMessage {
  return message.type === MessageTypes.Response && message.id === ResponseTypes.RegisterPlayer
}

function isMovePlayerResponseMessage (message: any): message is MovePlayerResponseMessage {
  return message.type === MessageTypes.Response && message.id === ResponseTypes.MovePlayer
}

function isRotatePlayerResponseMessage (message: any): message is RotatePlayerResponseMessage {
  return message.type === MessageTypes.Response && message.id === 'ComponentUpdate'
}

function isRadarScanNotificationMessage (message: any): message is RadarScanNotificationMessage {
  return message.type === MessageTypes.Notification && message.id === NotificationTypes.RadarScan
}

function isStartGameNotificationMessage (message: any): message is StartGameNofiticationMessage {
  return message.type === MessageTypes.Notification && message.id === NotificationTypes.StartGame
}

function analyzeMessage (ws: WebSocket, message: any, state: State): State {
  const data = message.data

  if (isRegisterPlayerResponseMessage(message)) {
    const { data: { position, rotation } } = message.component

    state.bot = {
      planner: new Planner({
        tracker: argv.t,
        direction: MovementDirection.Forward,
        position,
        rotation
      }),
      location: position,
      rotation
    }

    oracle = new Oracle({ shooter: argv.s })
  }

  if (isMovePlayerResponseMessage(message)) {
    lastMovementConfirmed = true
    const { data: { position } } = message.component
    state.bot.planner.locations.current = position
    state.bot.location = position
  }

  if (isRotatePlayerResponseMessage(message)) {
    // TODO
  }

  if (isRadarScanNotificationMessage(message)) {
    if (lastMovementConfirmed) {
      const action = oracle.decide(state.bot, data, state.bot.planner, gunner)

      if (action.type === 'move') {
        move(ws, action.data)
        lastMovementConfirmed = false
      }

      if (action.type === 'shoot') {
        shoot(ws)
      }
    }
  }

  if (isStartGameNotificationMessage(message)) {
    move(ws, MovementDirection.Forward)
  }

  console.log('unexpected message')
  console.dir(message, { colors: true, depth: null })
  lastMovementConfirmed = true // reset

  return state
}

function orderMessages (messages: Message[]): Message[] {
  const order = ['MovePlayerAck', 'RadarScanNotification']

  return messages.sort((messageA, messageB) => {
    const indexA = order.indexOf(messageA.type)
    const indexB = order.indexOf(messageB.type)

    if (indexA && indexB) {
      return indexA - indexB
    }

    if (indexA || indexB) {
      return -1
    }

    return 0
  })
}

function analyzeMessages (ws: WebSocket, messages: Message[], state: State): State {
  return messages.reduce((s, message) => {
    return analyzeMessage(ws, message, s)
  }, state)
}

ws.on('open', function open (): void {
  truncateMessagesFile()

  ws.send(JSON.stringify({ type: 'RegisterPlayerCommand', data: { id: Date.now() } }), { mask: true })

  const state: State = {}
  ws.on('message', function handleMessage (json: string): void {
    const messages = JSON.parse(json)

    writeMessagesToFile('recv', messages)
    analyzeMessages(ws, orderMessages(messages), state)
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
