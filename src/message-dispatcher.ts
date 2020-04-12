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
  isPlayerHitNotificationMessage,
  isTickNotification
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

  return data
}

export type DispatcherContext<S> = {
  botState: S
  inFlightRequest?: Request
}

export function messageDispatcher<S> (
  message: any,
  bot: BotAPI<S>,
  context: DispatcherContext<S>
): { newContext: DispatcherContext<S>, messages: any[] } {
  if (isRegisterPlayerResponseMessage(message)) {
    if (!bot.handlers.registerPlayerResponse) {
      return { newContext: context, messages: [] }
    }

    // TODO handle all kind of requests from all message handlers
    if (message.success === false) {
      const { state: newBotState } = bot.handlers.registerPlayerResponse(
        { success: message.success, data: 'Failed player register' },
        context.botState
      )

      return { newContext: { botState: newBotState }, messages: [] }
    } else {
      if (typeof message.details !== 'object') {
        throw new Error('invalid response message')
      }

      const { state: newBotState } = bot.handlers.registerPlayerResponse(
        { success: true, data: message.details },
        context.botState
      )

      return { newContext: { botState: newBotState }, messages: [] }
    }
  }

  if (isMovePlayerResponseMessage(message)) {
    if (!bot.handlers.movePlayerResponse) {
      return { newContext: context, messages: [] }
    }

    if (message.success === false) {
      const { state: newBotState } = bot.handlers.movePlayerResponse(
        { success: false, data: 'Failed to move player' },
        context.botState
      )

      return { newContext: { botState: newBotState }, messages: [] }
    } else {
      if (typeof message.data !== 'object') {
        throw new Error('invalid response message')
      }

      const { position, tokens } = message.data.component.details
      const requestDetails = message.data.request
      const { state: newBotState } = bot.handlers.movePlayerResponse(
        { success: true, data: { position, tokens, request: requestDetails } },
        context.botState
      )

      return { newContext: { botState: newBotState }, messages: [] }
    }
  }

  if (isRotatePlayerResponseMessage(message)) {
    if (!bot.handlers.rotatePlayerResponse) {
      return { newContext: context, messages: [] }
    }

    if (message.success === false) {
      // TODO handle possible response messages
      const { state: newBotState } = bot.handlers.rotatePlayerResponse(
        { success: false, data: 'Failed to rotate player' },
        context.botState
      )

      return { newContext: { botState: newBotState }, messages: [] }
    }

    if (typeof message.data !== 'object') {
      throw new Error('invalid response message')
    }

    const { rotation, tokens } = message.data.component.details
    const requestDetails = message.data.request
    const { state: newBotState } = bot.handlers.rotatePlayerResponse(
      { success: message.success, data: { rotation, tokens, request: requestDetails } },
      context.botState
    )

    return { newContext: { botState: newBotState }, messages: [] }
  }

  if (isShootResponseMessage(message)) {
    if (!bot.handlers.shootResponse) {
      return { newContext: context, messages: [] }
    }

    if (message.success === false) {
      // TODO handle possible response messages
      const { state: newBotState } = bot.handlers.shootResponse(
        { success: false, data: 'Failed to shoot' },
        context.botState
      )

      return { newContext: { botState: newBotState }, messages: [] }
    }

    if (typeof message.data !== 'object') {
      throw new Error('invalid response message')
    }

    const { tokens } = message.data.component.details
    const requestDetails = message.data.request
    const { state: newBotState } = bot.handlers.shootResponse(
      {
        success: message.success,
        data: {
          tokens,
          request: requestDetails
        }
      },
      context.botState
    )

    return { newContext: { botState: newBotState }, messages: [] }
  }

  if (isDeployMineResponseMessage(message)) {
    if (!bot.handlers.deployMineResponse) {
      return { newContext: context, messages: [] }
    }

    if (message.success === false) {
      // TODO handle possible response messages
      const { state: newBotState } = bot.handlers.deployMineResponse(
        { success: false, data: 'Failed to deploy mine' },
        context.botState
      )

      return { newContext: { botState: newBotState }, messages: [] }
    }

    if (typeof message.data !== 'object') {
      throw new Error('invalid response message')
    }

    const { tokens } = message.data.component.details
    const requestDetails = message.data.request

    const { state: newBotState } = bot.handlers.deployMineResponse(
      { success: message.success, data: { tokens, request: requestDetails } },
      context.botState
    )

    return { newContext: { botState: newBotState }, messages: [] }
  }

  if (isRadarScanNotificationMessage(message)) {
    if (!bot.handlers.radarScanNotification) {
      return { newContext: context, messages: [] }
    }

    if (typeof message.data !== 'object') {
      throw new Error('invalid message response')
    }

    const { data } = message
    const { state: newBotState } = bot.handlers.radarScanNotification({ data }, context.botState)

    return { newContext: { botState: newBotState }, messages: [] }
  }

  if (isStartGameNotificationMessage(message)) {
    if (!bot.handlers.startGameNotification) {
      return { newContext: context, messages: [] }
    }

    const { state: newBotState } = bot.handlers.startGameNotification(context.botState)

    return { newContext: { botState: newBotState }, messages: [] }
  }

  if (isJoinGameNotificationMessage(message)) {
    if (!bot.handlers.joinGameNotification) {
      return { newContext: context, messages: [] }
    }

    const { details } = message
    const { state: newBotState } = bot.handlers.joinGameNotification({ data: details }, context.botState)

    return { newContext: { botState: newBotState }, messages: [] }
  }

  if (isPlayerHitNotificationMessage(message)) {
    if (!bot.handlers.hitNotification) {
      return { newContext: context, messages: [] }
    }

    const { data } = message
    const { state: newBotState } = bot.handlers.hitNotification(data, context.botState)

    return { newContext: { botState: newBotState }, messages: [] }
  }

  if (isTickNotification(message)) {
    if (!bot.handlers.tickNotification) {
      return { newContext: context, messages: [] }
    }

    const { state: newBotState, request } = bot.handlers.tickNotification(context.botState, { inFlightRequest: context.inFlightRequest })
    let messages: RequestMessage[] = []
    const messageFromRequest = requestToMessage(request)

    if (messageFromRequest) {
      messages = [messageFromRequest]
    }

    const newContext: DispatcherContext<S> = { botState: newBotState, inFlightRequest: request }

    return { newContext, messages }
  }

  console.log('unexpected message')
  console.dir(message, { colors: true, depth: null })

  return { newContext: context, messages: [] }
}

