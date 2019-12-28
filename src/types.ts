import { IPlanner } from './planner'
import { Action } from './actions'

export interface Position {
  x: number
  y: number
}

export type Rotation = number
export interface Bot {
  planner: IPlanner
  // TODO do I need this property in the planner. Isn't it
  // part already of planner.locations.current
  location: Position
  rotation: Rotation
}

export interface BotState<T> {
  tracker: boolean
  shooter: boolean
  bot: T
}

export interface BotAPI<S> {
  handlers: {
    radarScanNotification?: (
      scan: {
        players: { position: Position }[],
        shots: { position: Position }[],
        unknown: { position: Position }[]
      },
      state: S
    ) => { state: S, actions: Action[] }

    registerPlayerResponse?: (
      data: SuccessfulRegisterPlayerResponse | FailedRegisterPlayerResponse,
      state: S
    ) => { state: S, actions: Action[] }

    rotatePlayerResponse?: (
      data: SuccessfulRotatePlayerResponse | FailedRotatePlayerResponse,
      state: S
    ) => { state: S, actions: Action[] }

    movePlayerResponse?: (
      data: SuccessfulMovePlayerResponse | FailedMovePlayerResponse,
      state: S
    ) => { state: S, actions: Action[] }

    shootResponse?: (
      data: SuccessfulShootResponse | FailedShootResponse,
      state: S
    ) => { state: S, actions: Action[] }

    startGameNotification?: (state: S) => { state: S, actions: Action[] }

    joinGameNotification?: (state: S) => { state: S, actions: Action[] }
  }
}

export interface SuccessfulRegisterPlayerResponse {
  success: true
  data: {
    position: Position
    rotation: Rotation
  }
}

export interface FailedRegisterPlayerResponse {
  success: false
  data: string
}

export interface SuccessfulMovePlayerResponse {
  success: false
  data: string
}

export interface FailedMovePlayerResponse {
  success: true
  data: {
    position: Position
  }
}

export interface SuccessfulRotatePlayerResponse {
  success: true
}

export interface FailedRotatePlayerResponse {
  success: false
}

export interface SuccessfulShootResponse {
  success: true
}

export interface FailedShootResponse {
  success: false
}
