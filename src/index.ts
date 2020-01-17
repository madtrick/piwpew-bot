import * as fs from 'fs'
import * as path from 'path'
import * as _ from 'lodash'
import * as yargs from 'yargs'
import { BotAPI } from './types'
import { Channel, createLogChannel, WebSocketChannel } from './channel'
import { messageDispatcher } from './message-dispatcher'

import {
  MessageTypes,
  RequestTypes,
  RegisterPlayerRequestMessage
} from './messages'


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
    }
  }).argv
let channel: Channel

if (argv.r) {
  // TODO fix the argv typing
  channel = createLogChannel({ path: argv.r as string })
} else {
  channel = new WebSocketChannel('ws://localhost:8889')
}

const playerId = argv.i as string
const messagesLogPath = path.join(__dirname, argv.i + '-messages.log')

channel.on('open', function open (): void {
  truncateMessagesFile()

  const botImport: Promise<{ bot: BotAPI<any>}> = import(path.resolve(__dirname, path.relative(__dirname, argv.m)))

  botImport.then(({ bot }) => {
    let state = { botState : {} }

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
