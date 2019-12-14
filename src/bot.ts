import {
  BotAPI,
  BotState,
  SuccessfulRegisterPlayerResponse,
  FailedRegisterPlayerResponse,
  SuccessfulMovePlayerResponse,
  FailedMovePlayerResponse,
  SuccessfulRotatePlayerResponse,
  FailedRotatePlayerResponse
} from '..'
import { Position, Action, ActionTypes, MovementDirection } from './types'
import Planner from './planner'
import Oracle from './oracle'
import Gunner from './gunner'

const ARENA_WIDTH = 500
const ARENA_HEIGHT = 500

export const bot: BotAPI = {
  handlers: {
    registerPlayerResponse: (data: FailedRegisterPlayerResponse | SuccessfulRegisterPlayerResponse, state: BotState) => {
      if (!data.success) {
        return { state, actions: [] }
      }

      if (data.success) {
        return {
          state: {
            ...state,
            bot: {
              gunner: new Gunner(),
              oracle: new Oracle({ shooter: state.shooter }),
              planner: new Planner({
                tracker: state.tracker,
                direction: MovementDirection.Forward,
                position: data.data.position,
                rotation: data.data.rotation,
                arena: {
                  width: ARENA_WIDTH,
                  height: ARENA_HEIGHT
                }
              }),
              location: data.data.position,
              rotation: data.data.rotation
            }
          },
          actions: []
        }
      }

      throw new Error('not possible')
    },

    movePlayerResponse: (data: SuccessfulMovePlayerResponse | FailedMovePlayerResponse, state: BotState) => {
      if (!data.success) {
        return { state, actions: [] }
      }

      const { position } = data.data
      state.bot.planner.locations.previous = state.bot!.planner.locations.current
      state.bot.planner.locations.current = position
      state.bot.location = position

      return { state, actions: [] }
    },

    rotatePlayerResponse: (_data: SuccessfulRotatePlayerResponse | FailedRotatePlayerResponse, state: BotState): { state: BotState, actions: Action[] } => {
      return { state, actions: [] }
    },

    radarScanNotification: (scan: { players: { position: Position }[], shots: { position: Position }[], unknown: { position: Position }[] }, state: BotState): { state: BotState, actions: Action[] } => {
      const action = state.bot.oracle.decide(state.bot, scan, state.bot.planner, state.bot.gunner)

      return { state, actions: [action] }
    },

    startGameNotification: (state: BotState): { state: BotState, actions: Action[] } => {
      return { state, actions: [{ type: ActionTypes.Move, data: { direction: MovementDirection.Forward } }] }
    },

    joinGameNotification: (state: BotState): { state: BotState, actions: Action[] } => {
      return { state, actions: [{ type: ActionTypes.Move, data: { direction: MovementDirection.Forward } }] }
    }
  }
}
