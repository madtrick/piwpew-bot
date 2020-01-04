import WebSocket from 'ws'
import { EventEmitter } from 'events'
import * as readline from 'readline'
import * as fs from 'fs'

export interface Channel {
  on (event: 'close' | 'open', cb: () => void): void
  on (event: 'message', cb: (data: string) => void): void
  send (data: any, options?: undefined): void
}

export class WebSocketChannel extends WebSocket implements Channel {}

interface LoglineDescriptor {
  type: 'recv' | 'send' | 'break' | 'unknown'
  data?: string
}

export class LogChannel extends EventEmitter implements Channel {
  private index: number = 0
  private lines: LoglineDescriptor[]
  private prompt: readline.ReadLine

  constructor (lines: LoglineDescriptor[]) {
    super()
    this.lines = lines
    this.prompt = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
  }

  on (event: string, cb: any): this {
    super.on(event, cb)

    if (event === 'message') {
      // noop
    }

    if (event === 'open') {
      process.nextTick(() => this.emit('open'))
    }

    return this
  }

  send (data: string, _options: any): void {
    const line = this.lines[this.index]

    if (line.type !== 'send') {
      throw new Error('Unexpected send')
    }

    if (line.data !== data) {
      throw new Error('Unexpected data')
    }

    this.index = this.index + 1
    this.start()
  }

  private async start (): Promise<void> {
    const processLines = (index: number, lines: LoglineDescriptor[]) => {
      const line = lines[index]

      if (line.type === 'recv') {
        this.index = this.index + 1
        this.emit('message', line.data)
        processLines(this.index, lines)
      }

      if (line.type === 'send') {
        return
      }

      if (line.type === 'break') {
        this.prompt.question('Press enter to continue', () => {
          this.index = this.index + 1
          processLines(this.index, lines)
        })
      }
    }

    processLines(this.index, this.lines)
  }
}

function processLogline (line: string): LoglineDescriptor {
  const recvRegex = /^\[recv\](.+)/
  const sendRegex = /^\[send\](.+)/
  const breakRegex = /^\[break\]$/

  const recvMatch = line.match(recvRegex)
  if (recvMatch) {
    return {
      type: 'recv',
      data: recvMatch[1]
    }
  }


  const breakMatch = line.match(breakRegex)
  if (breakMatch) {
    return {
      type: 'break',
      data: undefined
    }
  }

  const sendMatch = line.match(sendRegex)
  if (sendMatch) {
    return {
      type: 'send',
      data: sendMatch[1]
    }
  }

  return { type: 'unknown', data: line }
}

export function createLogChannel (options: { path: string }): LogChannel {
  const lines = fs.readFileSync(options.path).toString().split('\n')

  return new LogChannel(lines.map(processLogline))
}
