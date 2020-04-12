import { expect } from 'chai'
import sinon from 'sinon'
import {
  MessageTypes,
  ResponseTypes,
  NotificationTypes,
  RequestTypes as MessageRequestTypes,
  JoinGameNotificationMessage
} from '../../src/messages'
import { RequestTypes, MovementDirection, shootRequest, deployMineRequest, moveForwardRequest, rotateRequest } from '../../src/requests'
import { messageDispatcher, DispatcherContext } from '../../src/message-dispatcher'
import { BotAPI } from '../../src/types'

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
  let bot: BotAPI<any>

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
    const context: DispatcherContext<{}> = { botState: {} }

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
      const { newContext } = messageDispatcher(message, bot, context)

      expect(newContext.botState).to.eql(state)
    })
  })

  describe('Start game notification', () => {
    const message = {
      type: MessageTypes.Notification,
      id: NotificationTypes.StartGame
    }
    let startGameNotification: sinon.SinonStub
    const context = { botState: {} }

    beforeEach(() => {
      startGameNotification = sinon.stub().returns({ state: {} })
      bot = { handlers: { startGameNotification } }
    })

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(startGameNotification).to.have.been.calledOnceWith(context.botState)
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      startGameNotification.returns({ state })
      const { newContext } = messageDispatcher(message, bot, context)

      expect(newContext.botState).to.eql(state)
    })

    it('does not reset the "inFlightRequest" flag to undefined', () => {
      const request = shootRequest()
      const { newContext } = messageDispatcher(message, bot, { ...context, inFlightRequest: request })

      expect(newContext.inFlightRequest).to.eql(request)
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

    let joinGameNotification: sinon.SinonStub
    const context = { botState: {} }

    beforeEach(() => {
      joinGameNotification = sinon.stub().returns({ state: {} })
      bot = { handlers: { joinGameNotification } }
    })

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(joinGameNotification).to.have.been.calledOnceWith(
        { data: message.details },
        context.botState
      )
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      joinGameNotification.returns({ state })
      const { newContext } = messageDispatcher(message, bot, context)

      expect(newContext.botState).to.eql(state)
    })

    it('does not reset the "inFlightRequest" flag to undefined', () => {
      const request = shootRequest()
      const { newContext } = messageDispatcher(message, bot, { ...context, inFlightRequest: request })

      expect(newContext.inFlightRequest).to.eql(request)
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
    let movePlayerResponse: sinon.SinonStub
    const context = { botState: {}, inFlightRequest: moveForwardRequest({ withTurbo: false }) }

    beforeEach(() => {
      movePlayerResponse = sinon.stub().returns({ state: {} })
      bot = { handlers: { movePlayerResponse } }
    })

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(movePlayerResponse).to.have.been.calledOnceWith(
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
      movePlayerResponse.returns({ state })
      const { newContext } = messageDispatcher(message, bot, context)

      expect(newContext.botState).to.eql(state)
    })

    it('sets the "inFlightRequest" flag to undefined', () => {
      const { newContext } = messageDispatcher(message, bot, context)

      expect(newContext.inFlightRequest).to.be.undefined
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
    let rotatePlayerResponse: sinon.SinonStub
    const context = { botState: {}, inFlightRequest: rotateRequest(90) }

    beforeEach(() => {
      rotatePlayerResponse = sinon.stub().returns({ state: {} })
      bot = { handlers: { rotatePlayerResponse } }
    })

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(rotatePlayerResponse).to.have.been.calledOnceWith(
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
      rotatePlayerResponse.returns({ state })
      const { newContext } = messageDispatcher(message, bot, context)

      expect(newContext.botState).to.eql(state)
    })

    it('sets the "inFlightRequest" flag to undefined', () => {
      const { newContext } = messageDispatcher(message, bot, context)

      expect(newContext.inFlightRequest).to.be.undefined
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
    let shootResponse: sinon.SinonStub
    const context = { botState: {}, inFlightRequest: shootRequest() }

    beforeEach(() => {
      shootResponse = sinon.stub().returns({ state: {} })
      bot = { handlers: { shootResponse } }
    })

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(shootResponse).to.have.been.calledOnceWith(
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
      shootResponse.returns({ state })
      const { newContext } = messageDispatcher(message, bot, context)

      expect(newContext.botState).to.eql(state)
    })

    it('sets the "inFlightRequest" flag to undefined', () => {
      const { newContext } = messageDispatcher(message, bot, context)

      expect(newContext.inFlightRequest).to.be.undefined
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
    let deployMineResponse: sinon.SinonStub
    const context = { botState: {}, inFlightRequest: deployMineRequest() }

    beforeEach(() => {
      deployMineResponse = sinon.stub().returns({ state: {} })
      bot = { handlers: { deployMineResponse } }
    })

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(deployMineResponse).to.have.been.calledOnceWith(
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
      deployMineResponse.returns({ state })
      const { newContext } = messageDispatcher(message, bot, context)

      expect(newContext.botState).to.eql(state)
    })

    it('sets the "inFlightRequest" flag to undefined', () => {
      const { newContext } = messageDispatcher(message, bot, context)

      expect(newContext.inFlightRequest).to.be.undefined
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
    let radarScanNotification: sinon.SinonStub
    const context = { botState: {} }

    beforeEach(() => {
      radarScanNotification = sinon.stub().returns({ state: {} })
      bot = { handlers: { radarScanNotification } }
    })

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(radarScanNotification).to.have.been.calledOnceWith(
        { data: message.data },
        context.botState
      )
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      radarScanNotification.returns({ state })
      const { newContext } = messageDispatcher(message, bot, context)

      expect(newContext.botState).to.eql(state)
    })

    it('does not reset the "inFlightRequest" flag to undefined', () => {
      const request = shootRequest()
      const { newContext } = messageDispatcher(message, bot, { ...context, inFlightRequest: request })

      expect(newContext.inFlightRequest).to.eql(request)
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
    let hitNotification: sinon.SinonStub
    const context = { botState: {} }

    beforeEach(() => {
      hitNotification = sinon.stub().returns({ state: {} })
      bot = { handlers: { hitNotification } }
    })

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(hitNotification).to.have.been.calledOnceWith(
        message.data,
        context.botState
      )
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      hitNotification.returns({ state })
      const { newContext } = messageDispatcher(message, bot, context)

      expect(newContext.botState).to.eql(state)
    })

    it('does not reset the "inFlightRequest" flag to undefined', () => {
      const request = shootRequest()
      const { newContext } = messageDispatcher(message, bot, { ...context, inFlightRequest: request })

      expect(newContext.inFlightRequest).to.eql(request)
    })
  })

  describe('Tick notification', () => {
    const message = {
      type: MessageTypes.Notification,
      id: NotificationTypes.Tick
    }
    let tickNotification: sinon.SinonStub
    const context = { botState: {} }

    beforeEach(() => {
      tickNotification = sinon.stub().returns({ state: {} })
      bot = { handlers: { tickNotification } }
    })

    it('dispatchs the message', () => {
      messageDispatcher(message, bot, context)

      expect(tickNotification).to.have.been.calledOnceWith(
        context.botState
      )
    })

    it('returns the new state', () => {
      const state = { foo: 'bar' }
      tickNotification.returns({ state, requests: [] })
      const { newContext } = messageDispatcher(message, bot, context)

      expect(newContext.botState).to.eql(state)
    })

    it('stores in the context "inFlightRequests" the returned request', () => {
      const state = { foo: 'bar' }
      tickNotification.returns({ state, request: 'bar' })

      const { newContext } = messageDispatcher(message, bot, context)

      expect(newContext.inFlightRequest).to.eql('bar')
    })

    it('passes the "inFlightRequest" to the handler', () => {
      const request = shootRequest()
      messageDispatcher(message, bot, { ...context, inFlightRequest: request })

      expect(tickNotification).to.have.been.calledWith(
        context.botState,
        { inFlightRequest: request }
      )
    })

    it('returns the request transformed as a message', generateRequestMessage((request, expectedMessage) => {
      tickNotification.returns({ state: {}, request })
      const { messages } = messageDispatcher(message, bot, context)

      expect(messages[0]).to.eql(expectedMessage)
    }))
  })
})

