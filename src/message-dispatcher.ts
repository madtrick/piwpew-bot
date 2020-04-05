import { BotAPI, Rotation } from './types'
import {
  Request,
  RequestTypes,
  MovementDirection
} from './requests'
import {
  MessageTypes,
  RequestTypes as MessageRequestTypes,
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
  isShootResponseMessage,
  isDeployMineResponseMessage,
  isPlayerHitNotificationMessage
} from './messages'

type RequestMessage = MovePlayerRequestMessage | ShootRequestMessage | DeployMineRequestMessage | RotatePlayerRequestMessage

function requestToMessage (request: Request | undefined): RequestMessage | undefined {
  if (request && request.type === RequestTypes.Move) {
    return move(request.data.direction, request.data.withTurbo)
  }

  if (request && request.type === RequestTypes.Shoot) {
    return shoot()
  }

  if (request && request.type === RequestTypes.Rotate) {
    return rotate(request.data.rotation)
  }

  if (request && request.type === RequestTypes.DeployMine) {
    return deployMine()
  }

  return undefined
}

function move (direction: MovementDirection, withTurbo: boolean): MovePlayerRequestMessage {
  const data: MovePlayerRequestMessage = {
    type: MessageTypes.Request,
    id: MessageRequestTypes.MovePlayer,
    data: {
      movement: {
        direction,
        withTurbo
      }
    }
  }

  return data
}

function rotate (rotation: Rotation): RotatePlayerRequestMessage {
  const data: RotatePlayerRequestMessage = {
    type: MessageTypes.Request,
    id: MessageRequestTypes.RotatePlayer,
    data: {
      rotation
    }
  }

  return data
}

function shoot (): ShootRequestMessage {
  const data: ShootRequestMessage = {
    type: MessageTypes.Request,
    id: MessageRequestTypes.Shoot
  }

  return data
}

function deployMine (): DeployMineRequestMessage {
  const data: DeployMineRequestMessage = {
    type: MessageTypes.Request,
    id: MessageRequestTypes.DeployMine
  }

  // writeMessagesToFile('send', data)

  return data
}

export function messageDispatcher (message: any, bot: BotAPI<any>, context: { botState: any }): { newBotState: any, messages: any[] } {
  if (isRegisterPlayerResponseMessage(message)) {
    if (!bot.handlers.registerPlayerResponse) {
      return { newBotState: context.botState, messages: [] }
    }

    // TODO handle all kind of requests from all message handlers
    if (message.success === false) {
      const { state: newBotState } = bot.handlers.registerPlayerResponse(
        { success: message.success, data: 'Failed player register' },
        context.botState
      )

      return { newBotState, messages: [] }
    } else {
      if (typeof message.details !== 'object') {
        throw new Error('invalid response message')
      }

      const { state: newBotState, requests: [request] } = bot.handlers.registerPlayerResponse(
        { success: true, data: message.details },
        context.botState
      )

      // TODO remove this message handling logic
      const messages = []
      let responseMessage

      if (request && request.type === RequestTypes.Move) {
        responseMessage = move(request.data.direction, false)
      }

      if (responseMessage) {
        messages.push(responseMessage)
      }

      return { newBotState, messages }
    }
  }

  if (isMovePlayerResponseMessage(message)) {
    if (!bot.handlers.movePlayerResponse) {
      return { newBotState: context.botState, messages: [] }
    }

    if (message.success === false) {
      const { state: newBotState } = bot.handlers.movePlayerResponse(
        { success: false, data: 'Failed to move player' },
        context.botState
      )

      return { newBotState, messages: [] }
    } else {
      if (typeof message.data !== 'object') {
        throw new Error('invalid response message')
      }

      const { position, tokens } = message.data.component.details
      const requestDetails = message.data.request
      const { state: newBotState, requests: [request] } = bot.handlers.movePlayerResponse(
        { success: true, data: { position, tokens, request: requestDetails } },
        context.botState
      )
      let messages: RequestMessage[] = []
      const messageFromRequest = requestToMessage(request)

      if (messageFromRequest) {
        messages = [messageFromRequest]
      }

      return { newBotState, messages }
    }
  }

  if (isRotatePlayerResponseMessage(message)) {
    if (!bot.handlers.rotatePlayerResponse) {
      return { newBotState: context.botState, messages: [] }
    }

    if (message.success === false) {
      // TODO handle possible response messages
      const { state: newBotState } = bot.handlers.rotatePlayerResponse(
        { success: false, data: 'Failed to rotate player' },
        context.botState
      )

      return { newBotState, messages: [] }
    }

    if (typeof message.data !== 'object') {
      throw new Error('invalid response message')
    }

    const { rotation, tokens } = message.data.component.details
    const requestDetails = message.data.request
    const { state: newBotState, requests: [request] } = bot.handlers.rotatePlayerResponse(
      { success: message.success, data: { rotation, tokens, request: requestDetails } },
      context.botState
    )
    let messages: RequestMessage[] = []
    const messageFromRequest = requestToMessage(request)

    if (messageFromRequest) {
      messages = [messageFromRequest]
    }

    return { newBotState, messages }
  }

  if (isShootResponseMessage(message)) {
    if (!bot.handlers.shootResponse) {
      return { newBotState: context.botState, messages: [] }
    }

    if (message.success === false) {
      // TODO handle possible response messages
      const { state: newBotState } = bot.handlers.shootResponse(
        { success: false, data: 'Failed to shoot' },
        context.botState
      )

      return { newBotState, messages: [] }
    }

    if (typeof message.data !== 'object') {
      throw new Error('invalid response message')
    }

    const { tokens } = message.data.component.details
    const requestDetails = message.data.request
    const { state: newBotState, requests: [request] } = bot.handlers.shootResponse(
      {
        success: message.success,
        data: {
          tokens,
          request: requestDetails
        }
      },
      context.botState
    )
    let messages: RequestMessage[] = []
    const messageFromRequest = requestToMessage(request)

    if (messageFromRequest) {
      messages = [messageFromRequest]
    }

    return { newBotState, messages }
  }

  if (isDeployMineResponseMessage(message)) {
    if (!bot.handlers.deployMineResponse) {
      return { newBotState: context.botState, messages: [] }
    }

    if (message.success === false) {
      // TODO handle possible response messages
      const { state: newBotState } = bot.handlers.deployMineResponse(
        { success: false, data: 'Failed to deploy mine' },
        context.botState
      )

      return { newBotState, messages: [] }
    }

    if (typeof message.data !== 'object') {
      throw new Error('invalid response message')
    }

    const { tokens } = message.data.component.details
    const requestDetails = message.data.request

    const { state: newBotState, requests: [request] } = bot.handlers.deployMineResponse(
      { success: message.success, data: { tokens, request: requestDetails } },
      context.botState
    )
    let messages: RequestMessage[] = []
    const messageFromRequest = requestToMessage(request)

    if (messageFromRequest) {
      messages = [messageFromRequest]
    }

    return { newBotState, messages }
  }

  if (isRadarScanNotificationMessage(message)) {
    if (!bot.handlers.radarScanNotification) {
      return { newBotState: context.botState, messages: [] }
    }

    if (typeof message.data !== 'object') {
      throw new Error('invalid message response')
    }

    const { data } = message
    const { state: newBotState, requests: [request] } = bot.handlers.radarScanNotification({ data }, context.botState)
    let messages: RequestMessage[] = []
    const messageFromRequest = requestToMessage(request)

    if (messageFromRequest) {
      messages = [messageFromRequest]
    }

    return { newBotState, messages }
  }

  if (isStartGameNotificationMessage(message)) {
    if (!bot.handlers.startGameNotification) {
      return { newBotState: context.botState, messages: [] }
    }

    const { state: newBotState, requests: [request] } = bot.handlers.startGameNotification(context.botState)
    let messages: RequestMessage[] = []
    const messageFromRequest = requestToMessage(request)

    if (messageFromRequest) {
      messages = [messageFromRequest]
    }

    return { newBotState, messages }
  }

  if (isJoinGameNotificationMessage(message)) {
    if (!bot.handlers.joinGameNotification) {
      return { newBotState: context.botState, messages: [] }
    }

    const { details } = message
    const { state: newBotState, requests: [request] } = bot.handlers.joinGameNotification({ data: details }, context.botState)
    let messages: RequestMessage[] = []
    const messageFromRequest = requestToMessage(request)

    if (messageFromRequest) {
      messages = [messageFromRequest]
    }

    return { newBotState, messages }
  }

  if (isPlayerHitNotificationMessage(message)) {
    if (!bot.handlers.hitNotification) {
      return { newBotState: context.botState, messages: [] }
    }

    const { data } = message
    const { state: newBotState, requests: [request] } = bot.handlers.hitNotification(data, context.botState)
    let messages: RequestMessage[] = []
    const messageFromRequest = requestToMessage(request)

    if (messageFromRequest) {
      messages = [messageFromRequest]
    }

    return { newBotState, messages }
  }

  console.log('unexpected message')
  console.dir(message, { colors: true, depth: null })

  return { newBotState: context.botState, messages: [] }
}

