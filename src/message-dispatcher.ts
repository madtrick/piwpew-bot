import { BotAPI } from './types'
import {
  Request,
  RequestTypes
} from './requests'
import {
  isRegisterPlayerResponseMessage,
  isMovePlayerResponseMessage,
  isRotatePlayerResponseMessage,
  isRadarScanNotificationMessage,
  isStartGameNotificationMessage,
  isJoinGameNotificationMessage,
  isShootResponseMessage,
  isDeployMineResponseMessage,
  isPlayerHitNotificationMessage,
  isTickNotification,
  movePlayerRequestMessage,
  rotatePlayerRequestMessage,
  shootRequestMessage,
  deployMineRequestMessage,
  RequestMessage,
  MessageTypes
} from './messages'

function requestToMessage (request: Request | undefined): RequestMessage | undefined {
  if (request && request.type === RequestTypes.Move) {
    return movePlayerRequestMessage(request.data.direction, request.data.withTurbo)
  }

  if (request && request.type === RequestTypes.Shoot) {
    return shootRequestMessage()
  }

  if (request && request.type === RequestTypes.Rotate) {
    return rotatePlayerRequestMessage(request.data.rotation)
  }

  if (request && request.type === RequestTypes.DeployMine) {
    return deployMineRequestMessage()
  }

  return undefined
}

export type DispatcherContext<S> = {
  botState: S
  inFlightRequest?: Request
  inFlightRequestMessage?: RequestMessage
}

export function messageDispatcher<S> (
  message: any,
  bot: BotAPI<S>,
  context: DispatcherContext<S>
): { newContext: DispatcherContext<S>, messages: any[] } {
  if (bot.onMessage) {
    if (
      isRegisterPlayerResponseMessage(message) ||
      isMovePlayerResponseMessage(message) ||
      isRotatePlayerResponseMessage(message) ||
      isShootResponseMessage(message) ||
      isDeployMineResponseMessage(message) ||
      isRadarScanNotificationMessage(message) ||
      isPlayerHitNotificationMessage(message) ||
      isStartGameNotificationMessage(message) ||
      isJoinGameNotificationMessage(message) ||
      isTickNotification(message)
    ) {
      if ( context.inFlightRequestMessage && message.type === MessageTypes.Response) {
        if (context.inFlightRequestMessage.id === message.id) {
          delete context.inFlightRequestMessage
        } else {
          throw new Error(`Unexpected response "${message.id}" expected "${context.inFlightRequestMessage.id}"`)
        }
      }

      const { state: newBotState, request } = bot.onMessage(
        { message },
        context.botState,
        { inFlightRequestMessage: context.inFlightRequestMessage }
      )
      let messages: RequestMessage[] = []
      let inFlightRequestMessage: RequestMessage | undefined = context.inFlightRequestMessage

      if (request) {
        inFlightRequestMessage = request
        messages = [request]
      }

      const newContext: DispatcherContext<S> = { botState: newBotState, inFlightRequestMessage }

      return { newContext, messages }
    }
  }

  if (isRegisterPlayerResponseMessage(message)) {
    if (!bot.handlers.registerPlayerResponse) {
      return { newContext: context, messages: [] }
    }

    // Have to use a switch statement to get the discriminated union type
    // oer the message.success property working
    //
    // https://stackoverflow.com/a/51969193
    //
    // Having to resort to a switch seems to be a bug in the
    // compiler
    //
    // https://github.com/microsoft/TypeScript/issues/30763
    let result: { state: S }
    switch (message.success) {
      case true:
        if (typeof message.details !== 'object') {
          throw new Error('invalid response message')
        }

        result = bot.handlers.registerPlayerResponse(
          { success: true, data: message.details },
          context.botState
        )

        return { newContext: { botState: result.state }, messages: [] }
      case false:
        const { state } = bot.handlers.registerPlayerResponse(
          { success: message.success, data: 'Failed player register' },
          context.botState
        )

        return { newContext: { botState: state }, messages: [] }
    }
  }

  if (isMovePlayerResponseMessage(message)) {
    if (!bot.handlers.movePlayerResponse) {
      return { newContext: context, messages: [] }
    }

    let result: { state: S }
    switch (message.success) {
      case true:
        if (typeof message.data !== 'object') {
          throw new Error('invalid response message')
        }

        const { position, tokens } = message.data.component.details
        const requestDetails = message.data.request
        result = bot.handlers.movePlayerResponse(
          { success: true, data: { position, tokens, request: requestDetails } },
          context.botState
        )

        return { newContext: { botState: result.state }, messages: [] }
      case false:
        result = bot.handlers.movePlayerResponse(
          { success: false, data: 'Failed to move player' },
          context.botState
        )

        return { newContext: { botState: result.state }, messages: [] }
    }
  }

  if (isRotatePlayerResponseMessage(message)) {
    if (!bot.handlers.rotatePlayerResponse) {
      return { newContext: context, messages: [] }
    }

    let result: { state: S }
    switch(message.success) {
      case true:
        if (typeof message.data !== 'object') {
          throw new Error('invalid response message')
        }

        const { rotation, tokens } = message.data.component.details
        const requestDetails = message.data.request
        result = bot.handlers.rotatePlayerResponse(
          { success: message.success, data: { rotation, tokens, request: requestDetails } },
          context.botState
        )

        return { newContext: { botState: result.state }, messages: [] }
      case false:
        result = bot.handlers.rotatePlayerResponse(
          { success: false, data: 'Failed to rotate player' },
          context.botState
        )

        return { newContext: { botState: result.state }, messages: [] }
    }
  }

  if (isShootResponseMessage(message)) {
    if (!bot.handlers.shootResponse) {
      return { newContext: context, messages: [] }
    }

    let result: { state: S }
    switch (message.success) {
      case true:
        if (typeof message.data !== 'object') {
          throw new Error('invalid response message')
        }

        const { tokens } = message.data.component.details
        const requestDetails = message.data.request
        result = bot.handlers.shootResponse(
          {
            success: message.success,
            data: {
              tokens,
              request: requestDetails
            }
          },
          context.botState
        )

        return { newContext: { botState: result.state }, messages: [] }
      case false:
        // TODO handle possible response messages
        const { state } = bot.handlers.shootResponse(
          { success: false, data: 'Failed to shoot' },
          context.botState
        )

        return { newContext: { botState: state }, messages: [] }
    }
  }

  if (isDeployMineResponseMessage(message)) {
    if (!bot.handlers.deployMineResponse) {
      return { newContext: context, messages: [] }
    }

    let result: { state: S }
    switch (message.success) {
      case true:
        if (typeof message.data !== 'object') {
          throw new Error('invalid response message')
        }

        const { tokens } = message.data.component.details
        const requestDetails = message.data.request

        result = bot.handlers.deployMineResponse(
          { success: message.success, data: { tokens, request: requestDetails } },
          context.botState
        )

        return { newContext: { botState: result.state }, messages: [] }
      case false:
        // TODO handle possible response messages
        const { state } = bot.handlers.deployMineResponse(
          { success: false, data: 'Failed to deploy mine' },
          context.botState
        )

        return { newContext: { botState: state }, messages: [] }
    }
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

    return { newContext: { ...context, botState: newBotState }, messages: [] }
  }

  if (isStartGameNotificationMessage(message)) {
    if (!bot.handlers.startGameNotification) {
      return { newContext: context, messages: [] }
    }

    const { state: newBotState } = bot.handlers.startGameNotification(context.botState)

    return { newContext: { ...context, botState: newBotState }, messages: [] }
  }

  if (isJoinGameNotificationMessage(message)) {
    if (!bot.handlers.joinGameNotification) {
      return { newContext: context, messages: [] }
    }

    const { details } = message
    const { state: newBotState } = bot.handlers.joinGameNotification({ data: details }, context.botState)

    return { newContext: { ...context, botState: newBotState }, messages: [] }
  }

  if (isPlayerHitNotificationMessage(message)) {
    if (!bot.handlers.hitNotification) {
      return { newContext: context, messages: [] }
    }

    const { data } = message
    const { state: newBotState } = bot.handlers.hitNotification(data, context.botState)

    return { newContext: { ...context, botState: newBotState }, messages: [] }
  }

  if (isTickNotification(message)) {
    if (!bot.handlers.tickNotification) {
      return { newContext: context, messages: [] }
    }

    const { state: newBotState, request } = bot.handlers.tickNotification(context.botState, { inFlightRequest: context.inFlightRequest })
    let messages: RequestMessage[] = []
    let inFlightRequest = context.inFlightRequest
    const messageFromRequest = requestToMessage(request)

    if (request) {
      inFlightRequest = request
    }

    if (messageFromRequest) {
      messages = [messageFromRequest]
    }


    const newContext: DispatcherContext<S> = { botState: newBotState, inFlightRequest }

    return { newContext, messages }
  }

  console.log('unexpected message')
  console.dir(message, { colors: true, depth: null })

  return { newContext: context, messages: [] }
}

