import { expect } from 'chai'
import * as sinon from 'sinon'
import {
  MessageTypes,
  ResponseTypes,
  NotificationTypes,
  RequestTypes
} from '../../src/messages'
import { ActionTypes, MovementDirection } from '../../src/actions'
import { messageDispatcher } from '../../src/message-dispatcher'

const generateActionMessage = (fn: (message: any, action: any) => void) => {
  return () => {
    [
      {
        action: { type: ActionTypes.Move, data: { direction: MovementDirection.Forward } },
        message: {
          type: MessageTypes.Request,
          id: RequestTypes.MovePlayer,
          data: {
            movement: {
              direction: MovementDirection.Forward
            }
          }
        }
      },
      {
        action: { type: ActionTypes.Shoot },
        message: {
          type: MessageTypes.Request,
          id: RequestTypes.Shoot
        }
      },
      {
        action: { type: ActionTypes.Rotate, data: { rotation: 45 } },
        message: {
          type: MessageTypes.Request,
          id: RequestTypes.RotatePlayer,
          data: {
            rotation: 45
          }
        }
      },
      {
        action: { type: ActionTypes.DeployMine },
        message: {
          type: MessageTypes.Request,
          id: RequestTypes.DeployMine
        }
      }
    ].forEach((pair) => fn(pair.action, pair.message))
  }
}

describe('Message dispatcher', () => {
  describe('Register player response', () => {
    const message = {
      type: MessageTypes.Response,
      id: ResponseTypes.RegisterPlayer,
      success: true,
      details: {
        id: 'player-1',
        position: { x: 100, y: 200 },
        rotation: 359
      }
    }
    const bot = {
      handlers: {
        registerPlayerResponse: sinon.stub().returns({ state: {}, actions: [] })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.registerPlayerResponse).to.have.been.calledOnceWith(
        { success: message.success, data: message.details },
        context.botState
      )
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      bot.handlers.registerPlayerResponse.returns({ state, actions: [] })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })
  })

  describe('Start game notification', () => {
    const message = {
      type: MessageTypes.Notification,
      id: NotificationTypes.StartGame
    }
    const bot = {
      handlers: {
        startGameNotification: sinon.stub().returns({ state: {}, actions: [] })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.startGameNotification).to.have.been.calledOnceWith(context.botState)
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      bot.handlers.startGameNotification.returns({ state, actions: [] })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })

    it('returns the action transformed as a message', generateActionMessage((action, expectedMessage) => {
      bot.handlers.startGameNotification.returns({ state: {}, actions: [action] })
      const { messages } = messageDispatcher(message, bot, context)

      expect(messages[0]).to.eql(expectedMessage)
    }))
  })

  describe('Join game notification', () => {
    const message = {
      type: MessageTypes.Notification,
      id: NotificationTypes.JoinGame
    }
    const bot = {
      handlers: {
        joinGameNotification: sinon.stub().returns({ state: {}, actions: [] })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.joinGameNotification).to.have.been.calledOnceWith(context.botState)
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      bot.handlers.joinGameNotification.returns({ state, actions: [] })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })

    it('returns the action transformed as a message', generateActionMessage((action, expectedMessage) => {
      bot.handlers.joinGameNotification.returns({ state: {}, actions: [action] })
      debugger
      const { messages } = messageDispatcher(message, bot, context)

      expect(messages[0]).to.eql(expectedMessage)
    }))
  })

  describe('Move player response', () => {
    const message = {
      type: MessageTypes.Response,
      id: ResponseTypes.MovePlayer,
      success: true,
      details: {
        position: { x: 100, y: 100 }
      }
    }
    const bot = {
      handlers: {
        movePlayerResponse: sinon.stub().returns({ state: {}, actions: [] })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.movePlayerResponse).to.have.been.calledOnceWith(
        { success: true, data: { position: message.details.position } },
        context.botState
      )
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      bot.handlers.movePlayerResponse.returns({ state, actions: [] })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })

    it('returns the action transformed as a message', generateActionMessage((action, expectedMessage) => {
      bot.handlers.movePlayerResponse.returns({ state: {}, actions: [action] })
      const { messages } = messageDispatcher(message, bot, context)

      expect(messages[0]).to.eql(expectedMessage)
    }))
  })

  describe('Rotate player response', () => {
    const message = {
      type: MessageTypes.Response,
      id: ResponseTypes.RotatePlayer,
      success: true
    }
    const bot = {
      handlers: {
        rotatePlayerResponse: sinon.stub().returns({ state: {}, actions: [] })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.rotatePlayerResponse).to.have.been.calledOnceWith(
        { success: true },
        context.botState
      )
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      bot.handlers.rotatePlayerResponse.returns({ state, actions: [] })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })

    it('returns the action transformed as a message', generateActionMessage((action, expectedMessage) => {
      bot.handlers.rotatePlayerResponse.returns({ state: {}, actions: [action] })
      const { messages } = messageDispatcher(message, bot, context)

      expect(messages[0]).to.eql(expectedMessage)
    }))
  })

  describe('Shoot response', () => {
    const message = {
      type: MessageTypes.Response,
      id: ResponseTypes.Shoot,
      success: true
    }
    const bot = {
      handlers: {
        shootResponse: sinon.stub().returns({ state: {}, actions: [] })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.shootResponse).to.have.been.calledOnceWith(
        { success: true },
        context.botState
      )
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      bot.handlers.shootResponse.returns({ state, actions: [] })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })

    it('returns the action transformed as a message', generateActionMessage((action, expectedMessage) => {
      bot.handlers.shootResponse.returns({ state: {}, actions: [action] })
      const { messages } = messageDispatcher(message, bot, context)

      expect(messages[0]).to.eql(expectedMessage)
    }))
  })

  describe('Radar scan notification', () => {
    const message = {
      type: MessageTypes.Notification,
      id: NotificationTypes.RadarScan,
      data: {
        players: [],
        shots: [],
        mines: [],
        unknown: []
      }
    }
    const bot = {
      handlers: {
        radarScanNotification: sinon.stub().returns({ state: {}, actions: [] })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.radarScanNotification).to.have.been.calledOnceWith(
        message.data,
        context.botState
      )
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      bot.handlers.radarScanNotification.returns({ state, actions: [] })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })

    it('returns the action transformed as a message', generateActionMessage((action, expectedMessage) => {
      bot.handlers.radarScanNotification.returns({ state: {}, actions: [action] })
      const { messages } = messageDispatcher(message, bot, context)

      expect(messages[0]).to.eql(expectedMessage)
    }))
  })

  describe('Player hit notification', () => {
    const message = {
      type: MessageTypes.Notification,
      id: NotificationTypes.ShotHit,
      data: {
        damage: 1
      }
    }
    const bot = {
      handlers: {
        shotHitNotification: sinon.stub().returns({ state: {}, actions: [] })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.shotHitNotification).to.have.been.calledOnceWith(
        message.data,
        context.botState
      )
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      bot.handlers.shotHitNotification.returns({ state, actions: [] })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })

    it('returns the action transformed as a message', generateActionMessage((action, expectedMessage) => {
      bot.handlers.shotHitNotification.returns({ state: {}, actions: [action] })
      const { messages } = messageDispatcher(message, bot, context)

      expect(messages[0]).to.eql(expectedMessage)
    }))
  })
})

