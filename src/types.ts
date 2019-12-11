import { IPlanner } from './planner'

export enum MessageTypes {
  Request = 'Request',
    Response = 'Response',
    Notification = 'Notification'
}

export enum RequestTypes {
  RegisterPlayer = 'RegisterPlayer',
    MovePlayer = 'MovePlayer',
    RotatePlayer = 'RotatePlayer',
    Shoot = 'Shoot',
    DeployMine = 'DeployMine'
}

export enum ResponseTypes {
  RegisterPlayer = 'RegisterPlayer',
  MovePlayer = 'MovePlayer',
  RotatePlayer = 'RotatePlayer'
}

export enum NotificationTypes {
  RadarScan = 'RadarScan',
  StartGame = 'StartGame',
  JoinGame = 'JoinGame'
}

export interface Position {
  x: number
  y: number
}

export interface RegisterPlayerRequestMessage {
  type: MessageTypes.Request,
  id: RequestTypes.RegisterPlayer
  data: {
    id: string
  }
}

export interface RegisterPlayerResponseMessage {
  type: MessageTypes.Response
  id: ResponseTypes.RegisterPlayer
  success: boolean
  details?: {
    id: string
    position: Position
    rotation: number
  }
}

export interface MovePlayerRequestMessage {
  type: MessageTypes.Request
  id: RequestTypes.MovePlayer
  data: {
    movement: {
      direction: MovementDirection
    }
  }
}

export interface RotatePlayerRequestMessage {
  type: MessageTypes.Request
  id: RequestTypes.RotatePlayer
  data: {
    rotation: number
  }
}

export interface MovePlayerResponseMessage {
  type: MessageTypes.Response
  id: ResponseTypes.MovePlayer
  success: boolean
  // details are only present if `success` === true
  details?: {
    position: Position
  }
}

export interface RotatePlayerResponseMessage {
  type: MessageTypes.Response
  id: 'RotatePlayer'
  success: boolean
}

export interface RadarScanNotificationMessage {
  type: MessageTypes.Notification
  id: NotificationTypes.RadarScan
  data: {
    players: { position: Position }[]
    unknown: { position: Position }[]
    shots: { position: Position }[]
  }
}

export interface ShootRequestMessage {
  type: MessageTypes.Request
  id: RequestTypes.Shoot
}

export interface DeployMineRequestMessage {
  type: MessageTypes.Request
  id: RequestTypes.DeployMine
}

export interface StartGameNofiticationMessage {
  type: MessageTypes.Notification
  id: NotificationTypes.StartGame
}

export interface JoinGameNotificationMessage {
  type: MessageTypes.Notification
  id: NotificationTypes.JoinGame
}

export interface RadarScan {
  players: { position: Position }[]
  unknown: { position: Position }[]
}

export type Rotation = number

export enum ActionTypes {
  Rotate,
  Shoot,
  Move,
  DeployMine
}

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
