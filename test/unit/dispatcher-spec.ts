import { expect } from 'chai'
import * as sinon from 'sinon'
import {
  MessageTypes,
  ResponseTypes,
  NotificationTypes,
  RequestTypes as MessageRequestTypes
} from '../../src/messages'
import { RequestTypes, MovementDirection } from '../../src/requests'
import { messageDispatcher } from '../../src/message-dispatcher'

const generateRequestMessage = (fn: (message: any, request: any) => void) => {
  return () => {
    [
      {
        request: { type: RequestTypes.Move, data: { direction: MovementDirection.Forward, withTurbo: false } },
        message: {
          type: MessageTypes.Request,
          id: MessageRequestTypes.MovePlayer,
          data: {
            movement: {
              direction: MovementDirection.Forward,
              withTurbo: false
            }
          }
        }
      },
      {
        request: { type: RequestTypes.Shoot },
        message: {
          type: MessageTypes.Request,
          id: MessageRequestTypes.Shoot
        }
      },
      {
        request: { type: RequestTypes.DeployMine },
        message: {
          type: MessageTypes.Request,
          id: MessageRequestTypes.DeployMine
        }
      },
      {
        request: { type: RequestTypes.Rotate, data: { rotation: 45 } },
        message: {
          type: MessageTypes.Request,
          id: MessageRequestTypes.RotatePlayer,
          data: {
            rotation: 45
          }
        }
      },
      {
        request: { type: RequestTypes.DeployMine },
        message: {
          type: MessageTypes.Request,
          id: MessageRequestTypes.DeployMine
        }
      }
    ].forEach((pair) => fn(pair.request, pair.message))
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
        registerPlayerResponse: sinon.stub().returns({ state: {}, requests: [] })
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
      bot.handlers.registerPlayerResponse.returns({ state, requests: [] })
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
        startGameNotification: sinon.stub().returns({ state: {}, requests: [] })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.startGameNotification).to.have.been.calledOnceWith(context.botState)
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      bot.handlers.startGameNotification.returns({ state, requests: [] })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })

    it('returns the request transformed as a message', generateRequestMessage((request, expectedMessage) => {
      bot.handlers.startGameNotification.returns({ state: {}, requests: [request] })
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
        joinGameNotification: sinon.stub().returns({ state: {}, requests: [] })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.joinGameNotification).to.have.been.calledOnceWith(context.botState)
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      bot.handlers.joinGameNotification.returns({ state, requests: [] })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })

    it('returns the request transformed as a message', generateRequestMessage((request, expectedMessage) => {
      bot.handlers.joinGameNotification.returns({ state: {}, requests: [request] })
      const { messages } = messageDispatcher(message, bot, context)

      expect(messages[0]).to.eql(expectedMessage)
    }))
  })

  describe('Move player response', () => {
    const message = {
      type: MessageTypes.Response,
      id: ResponseTypes.MovePlayer,
      success: true,
      data: {
        component: {
          details: {
            position: { x: 100, y: 100 },
            tokens: 100
          }
        },
        request: {
          withTurbo: true,
          cost: 3
        }
      }
    }
    const bot = {
      handlers: {
        movePlayerResponse: sinon.stub().returns({ state: {}, requests: [] })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.movePlayerResponse).to.have.been.calledOnceWith(
        {
          success: true,
          data: {
            tokens: 100,
            position: message.data.component.details.position,
            request: {
              withTurbo: true,
              cost: 3
            }
          }
        },
        context.botState
      )
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      bot.handlers.movePlayerResponse.returns({ state, requests: [] })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })

    it('returns the request transformed as a message', generateRequestMessage((request, expectedMessage) => {
      bot.handlers.movePlayerResponse.returns({ state: {}, requests: [request] })
      const { messages } = messageDispatcher(message, bot, context)

      expect(messages[0]).to.eql(expectedMessage)
    }))
  })

  describe('Rotate player response', () => {
    const message = {
      type: MessageTypes.Response,
      id: ResponseTypes.RotatePlayer,
      success: true,
      data: {
        component: {
          details: {
            rotation: 123,
            tokens: 456
          }
        },
        request: {
          cost: 100
        }
      }
    }
    const bot = {
      handlers: {
        rotatePlayerResponse: sinon.stub().returns({ state: {}, requests: [] })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.rotatePlayerResponse).to.have.been.calledOnceWith(
        {
          success: true,
          data: {
            rotation: message.data.component.details.rotation,
            tokens: message.data.component.details.tokens,
            request: {
              cost: message.data.request.cost
            }
          }
        },
        context.botState
      )
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      bot.handlers.rotatePlayerResponse.returns({ state, requests: [] })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })

    it('returns the request transformed as a message', generateRequestMessage((request, expectedMessage) => {
      bot.handlers.rotatePlayerResponse.returns({ state: {}, requests: [request] })
      const { messages } = messageDispatcher(message, bot, context)

      expect(messages[0]).to.eql(expectedMessage)
    }))
  })

  describe('Shoot response', () => {
    const message = {
      type: MessageTypes.Response,
      id: ResponseTypes.Shoot,
      success: true,
      data: {
        shots: 10
      }
    }
    const bot = {
      handlers: {
        shootResponse: sinon.stub().returns({ state: {}, requests: [] })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.shootResponse).to.have.been.calledOnceWith(
        { success: true, data: { shots: 10 } },
        context.botState
      )
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      bot.handlers.shootResponse.returns({ state, requests: [] })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })

    it('returns the request transformed as a message', generateRequestMessage((request, expectedMessage) => {
      bot.handlers.shootResponse.returns({ state: {}, requests: [request] })
      const { messages } = messageDispatcher(message, bot, context)

      expect(messages[0]).to.eql(expectedMessage)
    }))
  })

  describe('DeployMine response', () => {
    const message = {
      type: MessageTypes.Response,
      id: ResponseTypes.DeployMine,
      success: true,
      data: {
        mines: 2
      }
    }
    const bot = {
      handlers: {
        deployMineResponse: sinon.stub().returns({ state: {}, requests: [] })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.deployMineResponse).to.have.been.calledOnceWith(
        { success: true, data: { mines: 2 } },
        context.botState
      )
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      bot.handlers.deployMineResponse.returns({ state, requests: [] })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })

    it('returns the request transformed as a message', generateRequestMessage((request, expectedMessage) => {
      bot.handlers.deployMineResponse.returns({ state: {}, requests: [request] })
      const { messages } = messageDispatcher(message, bot, context)

      expect(messages[0]).to.eql(expectedMessage)
    }))
  })

  describe('Radar scan notification', () => {
    const message = {
      type: MessageTypes.Notification,
      id: NotificationTypes.RadarScan,
      data: {
        players: [{ position: { x: 10, y: 20 }, rotation: 45, id: 'player-1' }],
        shots: [{ position: { x: 36, y: 37 }, rotation: 90 }],
        mines: [{ position: { x: 90, y: 90 } }],
        unknown: [{ x: 90, y: 90 }]
      }
    }
    const bot = {
      handlers: {
        radarScanNotification: sinon.stub().returns({ state: {}, requests: [] })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.radarScanNotification).to.have.been.calledOnceWith(
        { data: message.data },
        context.botState
      )
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      bot.handlers.radarScanNotification.returns({ state, requests: [] })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })

    it('returns the request transformed as a message', generateRequestMessage((request, expectedMessage) => {
      bot.handlers.radarScanNotification.returns({ state: {}, requests: [request] })
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
        shotHitNotification: sinon.stub().returns({ state: {}, requests: [] })
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
      bot.handlers.shotHitNotification.returns({ state, requests: [] })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })

    it('returns the request transformed as a message', generateRequestMessage((request, expectedMessage) => {
      bot.handlers.shotHitNotification.returns({ state: {}, requests: [request] })
      const { messages } = messageDispatcher(message, bot, context)

      expect(messages[0]).to.eql(expectedMessage)
    }))
  })
})

