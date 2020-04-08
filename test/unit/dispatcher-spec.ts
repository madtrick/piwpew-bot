import { expect } from 'chai'
import * as sinon from 'sinon'
import {
  MessageTypes,
  ResponseTypes,
  NotificationTypes,
  RequestTypes as MessageRequestTypes,
  JoinGameNotificationMessage
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
        rotation: 359,
        life: 100,
        tokens: 150
      }
    }
    const bot = {
      handlers: {
        registerPlayerResponse: sinon.stub().returns({ state: {} })
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
      bot.handlers.registerPlayerResponse.returns({ state })
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
        startGameNotification: sinon.stub().returns({ state: {} })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.startGameNotification).to.have.been.calledOnceWith(context.botState)
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      bot.handlers.startGameNotification.returns({ state })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })
  })

  describe('Join game notification', () => {
    const message: JoinGameNotificationMessage = {
      type: MessageTypes.Notification,
      id: NotificationTypes.JoinGame,
      details: {
        game: {
          settings: {
            playerSpeed: 10,
            shotSpeed: 10,
            arenaWidth: 400,
            arenaHeight: 400,
            playerRadius: 80,
            radarScanRadius: 80,
            turboMultiplier: 2
          }
        }
      }
    }

    const bot = {
      handlers: {
        joinGameNotification: sinon.stub().returns({ state: {} })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.joinGameNotification).to.have.been.calledOnceWith(
        { data: message.details },
        context.botState
      )
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      bot.handlers.joinGameNotification.returns({ state })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })
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
        movePlayerResponse: sinon.stub().returns({ state: {} })
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
      bot.handlers.movePlayerResponse.returns({ state })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })
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
        rotatePlayerResponse: sinon.stub().returns({ state: {} })
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
      bot.handlers.rotatePlayerResponse.returns({ state })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })
  })

  describe('Shoot response', () => {
    const message = {
      type: MessageTypes.Response,
      id: ResponseTypes.Shoot,
      success: true,
      data: {
        component: {
          details: {
            tokens: 10
          }
        },
        request: {
          cost: 2
        }
      }
    }
    const bot = {
      handlers: {
        shootResponse: sinon.stub().returns({ state: {} })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.shootResponse).to.have.been.calledOnceWith(
        {
          success: true,
          data: {
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
      bot.handlers.shootResponse.returns({ state })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })
  })

  describe('DeployMine response', () => {
    const message = {
      type: MessageTypes.Response,
      id: ResponseTypes.DeployMine,
      success: true,
      data: {
        component: {
          details: {
            tokens: 3
          }
        },
        request: {
          cost: 2
        }
      }
    }
    const bot = {
      handlers: {
        deployMineResponse: sinon.stub().returns({ state: {} })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.deployMineResponse).to.have.been.calledOnceWith(
        {
          success: true,
          data: {
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
      bot.handlers.deployMineResponse.returns({ state })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })
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
        radarScanNotification: sinon.stub().returns({ state: {} })
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
      bot.handlers.radarScanNotification.returns({ state })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })
  })

  describe('Player hit notification', () => {
    const message = {
      type: MessageTypes.Notification,
      id: NotificationTypes.Hit,
      data: {
        damage: 1
      }
    }
    const bot = {
      handlers: {
        hitNotification: sinon.stub().returns({ state: {} })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.hitNotification).to.have.been.calledOnceWith(
        message.data,
        context.botState
      )
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      bot.handlers.hitNotification.returns({ state })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })
  })

  describe('Tick notification', () => {
    const message = {
      type: MessageTypes.Notification,
      id: NotificationTypes.Tick
    }
    const bot = {
      handlers: {
        tickNotification: sinon.stub().returns({ state: {}, requests: [] })
      }
    }
    const context = { botState: {} }

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(bot.handlers.tickNotification).to.have.been.calledOnceWith(
        context.botState
      )
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      bot.handlers.tickNotification.returns({ state, requests: [] })
      const { newBotState } = messageDispatcher(message, bot, context)

      expect(newBotState).to.eql(state)
    })

    it('returns the request transformed as a message', generateRequestMessage((request, expectedMessage) => {
      bot.handlers.tickNotification.returns({ state: {}, request })
      const { messages } = messageDispatcher(message, bot, context)

      expect(messages[0]).to.eql(expectedMessage)
    }))
  })
})

