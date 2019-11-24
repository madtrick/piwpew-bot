import * as fs from 'fs'
import * as path from 'path'
import WebSocket from 'ws'
import * as _ from 'lodash'
import yargs from 'yargs'
import Planner from './src/planner'
import Oracle from './src/oracle'
import Gunner from './src/gunner'
import {
  ActionTypes,
  Bot,
  Rotation,
  MovementDirection,
  MessageTypes,
  NotificationTypes,
  ResponseTypes,
  RequestTypes,
  RegisterPlayerRequestMessage,
  RegisterPlayerResponseMessage,
  MovePlayerRequestMessage,
  MovePlayerResponseMessage,
  RotatePlayerRequestMessage,
  RotatePlayerResponseMessage,
  RadarScanNotificationMessage,
  ShootRequestMessage,
  StartGameNofiticationMessage
} from './src/types'
import { ARENA_HEIGHT, ARENA_WIDTH } from './src/constants'


interface State {
  bot?: Bot
  oracle?: Oracle
}

const ws = new WebSocket('ws://localhost:8889')
const gunner = new Gunner()
const argv = yargs.demand(['i']).argv
const playerId = argv.i as string
const messagesLogPath = path.join(__dirname, argv.i + '-messages.log')
let lastMovementConfirmed = false

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

function isRegisterPlayerResponseMessage (message: any): message is RegisterPlayerResponseMessage {
  console.log(message)
  const { type, id } = message

  return type === MessageTypes.Response && id === ResponseTypes.RegisterPlayer
}

function isMovePlayerResponseMessage (message: any): message is MovePlayerResponseMessage {
  const { type, id } = message

  return type === MessageTypes.Response && id === ResponseTypes.MovePlayer
}

function isRotatePlayerResponseMessage (message: any): message is RotatePlayerResponseMessage {
  const { type, id } = message

  return type === MessageTypes.Response && id === 'ComponentUpdate'
}

function isRadarScanNotificationMessage (message: any): message is RadarScanNotificationMessage {
  const { type, id } = message

  return type === MessageTypes.Notification && id === NotificationTypes.RadarScan
}

function isStartGameNotificationMessage (message: any): message is StartGameNofiticationMessage {
  const { type, id } = message

  return type === MessageTypes.Notification && id === NotificationTypes.StartGame
}

function analyzeMessage (ws: WebSocket, message: any, state: State): State {
  const data = message.data

  if (isRegisterPlayerResponseMessage(message)) {
    if (message.success && message.details) {
      const { position, rotation } = message.details

      state.bot = {
        planner: new Planner({
          tracker: argv.t as boolean,
          direction: MovementDirection.Forward,
          position,
          rotation,
          arena: {
            width: ARENA_WIDTH,
            height: ARENA_HEIGHT
          }
        }),
        location: position,
        rotation
      }

      state.oracle = new Oracle({ shooter: argv.s as boolean })
    }

    return state
  }

  if (isMovePlayerResponseMessage(message)) {
    if (message.success && message.details) {
      lastMovementConfirmed = true
      const { position } = message.details
      state.bot!.planner.locations.current = position
      state.bot!.location = position
    }

    return state
  }

  if (isRotatePlayerResponseMessage(message)) {
    // TODO
    return state
  }

  if (isRadarScanNotificationMessage(message)) {
    if (lastMovementConfirmed) {
      const action = state.oracle!.decide(state.bot!, data, state.bot!.planner, gunner)

      if (action.type === ActionTypes.Move) {
        move(ws, action.data.direction)
        lastMovementConfirmed = false
      }

      if (action.type === ActionTypes.Rotate) {
        rotate(ws, action.data.rotation)
      }

      if (action.type === ActionTypes.Shoot) {
        shoot(ws)
      }
    }

    return state
  }

  if (isStartGameNotificationMessage(message)) {
    move(ws, MovementDirection.Forward)

    return state
  }

  console.log('unexpected message')
  console.dir(message, { colors: true, depth: null })
  lastMovementConfirmed = true // reset

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

  let state: State = {}
  ws.on('message', function handleMessage (json: string): void {
    const message = JSON.parse(json)

    writeMessagesToFile('recv', message)
    state = analyzeMessage(ws, message, state)
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
