import { IPlanner } from './planner'

export interface Position {
  x: number
  y: number
}

export enum ActionTypes {
  Rotate,
  Shoot,
  Move,
  DeployMine,
  Exit
}

export type Rotation = number
export enum MovementDirection {
  Forward = 'forward'
}

export interface Bot {
  planner: IPlanner
  // TODO do I need this property in the planner. Isn't it
  // part already of planner.locations.current
  location: Position
  rotation: Rotation
}

export interface RotateAction {
  type: ActionTypes.Rotate
  data: {
    rotation: Rotation
  }
}

export interface MoveAction {
  type: ActionTypes.Move
  data: {
    direction: MovementDirection
  }
}

export interface ShootAction {
  type: ActionTypes.Shoot
}

export interface DeployMineAction {
  type: ActionTypes.DeployMine
}

export type Action = RotateAction | MoveAction | ShootAction | DeployMineAction

export interface BotState {
  tracker: boolean
  shooter: boolean
  bot: any
}

export interface BotAPI {
  handlers: {
    radarScanNotification: (scan: { players: { position: Position }[], shots: { position: Position }[], unknown: { position: Position }[] }, state: BotState) => { state: BotState, actions: Action[] }
    registerPlayerResponse: (data: SuccessfulRegisterPlayerResponse | FailedRegisterPlayerResponse, state: BotState) => { state: BotState, actions: Action[] }
    rotatePlayerResponse: (success: SuccessfulRotatePlayerResponse | FailedRotatePlayerResponse, state: BotState) => { state: BotState, actions: Action[] }
    movePlayerResponse: (data: SuccessfulMovePlayerResponse | FailedMovePlayerResponse, state: BotState) => { state: BotState, actions: Action[] }
    startGameNotification: (state: BotState) => { state: BotState, actions: Action[] }
    joinGameNotification: (state: BotState) => { state: BotState, actions: Action[] }
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
