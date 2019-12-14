import {
  BotAPI,
  BotState,
  SuccessfulRegisterPlayerResponse,
  FailedRegisterPlayerResponse,
  SuccessfulMovePlayerResponse,
  FailedMovePlayerResponse,
  SuccessfulRotatePlayerResponse,
  FailedRotatePlayerResponse,
  Position,
  Action
} from './types'

export const bot: BotAPI = {
  handlers: {
    registerPlayerResponse: (data: FailedRegisterPlayerResponse | SuccessfulRegisterPlayerResponse, state: BotState) => {
      if (!data.success) {
        return { state, actions: [] }
      }

      if (data.success) {
        return {
          state: { ...state },
          actions: []
        }
      }

      throw new Error('not possible')
    },

    movePlayerResponse: (data: SuccessfulMovePlayerResponse | FailedMovePlayerResponse, state: BotState) => {
      if (!data.success) {
        return { state, actions: [] }
      }

      return { state, actions: [] }
    },

    rotatePlayerResponse: (_data: SuccessfulRotatePlayerResponse | FailedRotatePlayerResponse, state: BotState): { state: BotState, actions: Action[] } => {
      return { state, actions: [] }
    },

    radarScanNotification: (_scan: { players: { position: Position }[], shots: { position: Position }[], unknown: { position: Position }[] }, state: BotState): { state: BotState, actions: Action[] } => {
      return { state, actions: [] }
    },

    startGameNotification: (state: BotState): { state: BotState, actions: Action[] } => {
      return { state, actions: [] }
    },

    joinGameNotification: (state: BotState): { state: BotState, actions: Action[] } => {
      return { state, actions: [] }
    }
  }
}

