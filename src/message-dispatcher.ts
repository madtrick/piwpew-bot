import { BotAPI, Rotation } from './types'
import {
  // MoveAction,
  // ShootAction,
  // RotateAction,
  // DeployMineAction,
  Action,
  ActionTypes,
  MovementDirection
} from './actions'
import {
  MessageTypes,
  RequestTypes,
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
  isPlayerShotHitNotificationMessage
} from './messages'

type RequestMessage = MovePlayerRequestMessage | ShootRequestMessage | DeployMineRequestMessage | RotatePlayerRequestMessage

// function actionToMessage (action: MoveAction): MovePlayerRequestMessage
// function actionToMessage (action: ShootAction): ShootRequestMessage
// function actionToMessage (action: RotateAction): RotatePlayerRequestMessage
// function actionToMessage (action: DeployMineAction): DeployMineRequestMessage
function actionToMessage (action: Action | undefined): RequestMessage | undefined {
  if (action && action.type === ActionTypes.Move) {
    return move(action.data.direction)
  }

  if (action && action.type === ActionTypes.Shoot) {
    return shoot()
  }

  if (action && action.type === ActionTypes.Rotate) {
    return rotate(action.data.rotation)
  }

  if (action && action.type === ActionTypes.DeployMine) {
    return deployMine()
  }

  return undefined
}

function move (direction: MovementDirection): MovePlayerRequestMessage {
  const data: MovePlayerRequestMessage = {
    type: MessageTypes.Request,
    id: RequestTypes.MovePlayer,
    data: {
      movement: {
        direction: direction
      }
    }
  }

  return data
}

function rotate (rotation: Rotation): RotatePlayerRequestMessage {
  const data: RotatePlayerRequestMessage = {
    type: MessageTypes.Request,
    id: RequestTypes.RotatePlayer,
    data: {
      rotation
    }
  }

  return data
}

function shoot (): ShootRequestMessage {
  const data: ShootRequestMessage = {
    type: MessageTypes.Request,
    id: RequestTypes.Shoot
  }

  return data
}

function deployMine (): DeployMineRequestMessage {
  const data: DeployMineRequestMessage = {
    type: MessageTypes.Request,
    id: RequestTypes.DeployMine
  }

  // writeMessagesToFile('send', data)

  return data
}

export function messageDispatcher (message: any, bot: BotAPI<any>, context: { botState: any }): { newBotState: any, messages: any[] } {
  if (isRegisterPlayerResponseMessage(message)) {
    if (!bot.handlers.registerPlayerResponse) {
      return { newBotState: context.botState, messages: [] }
    }

    // TODO handle all kind of actions from all message handlers
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

      const { state: newBotState, actions: [action] } = bot.handlers.registerPlayerResponse(
        { success: true, data: message.details },
        context.botState
      )

      // TODO remove this message handling logic
      const messages = []
      let responseMessage

      if (action && action.type === ActionTypes.Move) {
        responseMessage = move(action.data.direction)
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
        { success: message.success, data: 'Failed to move player' },
        context.botState
      )

      return { newBotState, messages: [] }
    } else {
      if (typeof message.details !== 'object') {
        throw new Error('invalid response message')
      }

      const { position } = message.details
      const { state: newBotState, actions: [action] } = bot.handlers.movePlayerResponse(
        { success: true, data: { position } },
        context.botState
      )
      let messages: RequestMessage[] = []
      const messageFromAction = actionToMessage(action)

      if (messageFromAction) {
        messages = [messageFromAction]
      }

      return { newBotState, messages }
    }
  }

  if (isRotatePlayerResponseMessage(message)) {
    if (!bot.handlers.rotatePlayerResponse) {
      return { newBotState: context.botState, messages: [] }
    }

    const { state: newBotState, actions: [action] } = bot.handlers.rotatePlayerResponse(
      { success: message.success },
      context.botState
    )
    let messages: RequestMessage[] = []
    const messageFromAction = actionToMessage(action)

    if (messageFromAction) {
      messages = [messageFromAction]
    }

    return { newBotState, messages }
  }

  if (isShootResponseMessage(message)) {
    if (!bot.handlers.shootResponse) {
      return { newBotState: context.botState, messages: [] }
    }

    const { state: newBotState, actions: [action] } = bot.handlers.shootResponse(
      { success: message.success },
      context.botState
    )
    let messages: RequestMessage[] = []
    const messageFromAction = actionToMessage(action)

    if (messageFromAction) {
      messages = [messageFromAction]
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
    const { state: newBotState, actions: [action] } = bot.handlers.radarScanNotification(data, context.botState)
    let messages: RequestMessage[] = []
    const messageFromAction = actionToMessage(action)

    if (messageFromAction) {
      messages = [messageFromAction]
    }

    return { newBotState, messages }
  }

  if (isStartGameNotificationMessage(message)) {
    if (!bot.handlers.startGameNotification) {
      return { newBotState: context.botState, messages: [] }
    }

    const { state: newBotState, actions: [action] } = bot.handlers.startGameNotification(context.botState)
    let messages: RequestMessage[] = []
    const messageFromAction = actionToMessage(action)

    if (messageFromAction) {
      messages = [messageFromAction]
    }

    return { newBotState, messages }
  }

  if (isJoinGameNotificationMessage(message)) {
    if (!bot.handlers.joinGameNotification) {
      return { newBotState: context.botState, messages: [] }
    }

    const { state: newBotState, actions: [action] } = bot.handlers.joinGameNotification(context.botState)
    let messages: RequestMessage[] = []
    const messageFromAction = actionToMessage(action)

    if (messageFromAction) {
      messages = [messageFromAction]
    }

    return { newBotState, messages }
  }

  if (isPlayerShotHitNotificationMessage(message)) {
    if (!bot.handlers.shotHitNotification) {
      return { newBotState: context.botState, messages: [] }
    }

    const { data } = message
    const { state: newBotState, actions: [action] } = bot.handlers.shotHitNotification(data, context.botState)
    let messages: RequestMessage[] = []
    const messageFromAction = actionToMessage(action)

    if (messageFromAction) {
      messages = [messageFromAction]
    }

    return { newBotState, messages }
  }

  console.log('unexpected message')
  console.dir(message, { colors: true, depth: null })

  return { newBotState: context.botState, messages: [] }
}

