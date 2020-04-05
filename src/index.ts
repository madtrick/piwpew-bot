import * as fs from 'fs'
import * as path from 'path'
import * as yargs from 'yargs'
import { Channel, createLogChannel, WebSocketChannel } from './channel'
import { messageDispatcher } from './message-dispatcher'

import {
  MessageTypes,
  RequestTypes,
  RegisterPlayerRequestMessage
} from './messages'
import { BotAPI } from './bot'


const argv = yargs
  .options({
    'i': {
      alias: 'id',
      type: 'string',
      demand: true,
      describe: 'Bot id'
    },
    'm': {
      alias: 'module',
      type: 'string',
      demand: true,
      describe: 'Module implementing the BotAPI'
    },
    'r': {
      alias: 'replay',
      type: 'string',
      demand: false,
      describe: 'Log file to be replayed'
    },
    's': {
      alias: 'server',
      type: 'string',
      demand: false,
      default: 'wss://game.piwpew.com',
      describe: 'Address of the game engine'
    }
  }).argv
let channel: Channel

if (argv.r) {
  channel = createLogChannel({ path: argv.r as string })
} else {
  // TODO implement connection timeout
  channel = new WebSocketChannel(`${argv.s}/ws/player`)
}

const playerId = argv.i as string
const messagesLogPath = path.join(process.cwd(), argv.i + '-messages.log')

channel.on('open', function open (): void {
  truncateMessagesFile()

  const botImport: Promise<{ bot: BotAPI<any>}> = import(path.resolve(__dirname, path.relative(__dirname, argv.m)))

  botImport.then(({ bot }) => {
    const state = { botState : {} }

    if (bot.initState !== undefined) {
      state.botState = bot.initState()
    }

    channel.on('message', function handleMessage (json: string): void {
      const message = JSON.parse(json)

      writeMessagesToFile('recv', message)
      // TODO rename to dispatchMessage
      const { newBotState, messages } = messageDispatcher(message, bot, state)
      state.botState = newBotState

      messages.forEach((message) => {
        writeMessagesToFile('send', message)
        channel.send(JSON.stringify(message))
      })
    })

    const message: RegisterPlayerRequestMessage = {
      type: MessageTypes.Request,
      id: RequestTypes.RegisterPlayer,
      data: {
        game: {
          version: '1.1.0'
        },
        id: playerId
      }
    }

    writeMessagesToFile('send', message)
    channel.send(JSON.stringify(message))
  })
})

channel.on('close', function close (): void {
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
