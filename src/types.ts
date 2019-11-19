import { IPlanner } from './planner'

export enum MessageTypes {
  Request = 'Request',
  Response = 'Response',
  Notification = 'Notification'
}

export enum RequestTypes {
  MovePlayer = 'MovePlayer',
  Shoot = 'Shoot'
}

export enum ResponseTypes {
  RegisterPlayer = 'RegisterPlayer',
  MovePlayer = 'MovePlayer',
  RotatePlayer = 'RotatePlayer'
}

export enum NotificationTypes {
  RadarScan = 'RadarScan',
  StartGame = 'StartGame'
}

export interface Position {
  x: number
  y: number
}

export interface Message {
  type: string
}

export interface RegisterPlayerResponseMessage {
  type: MessageTypes.Response
  id: ResponseTypes.RegisterPlayer
  component: {
    data: {
      id: string
      position: Position
      rotation: number
    }
  }
}

export interface MovePlayerRequestMessage {
  sys: {
    type: MessageTypes.Request
    id: RequestTypes.MovePlayer
  }
  data: {
    movement: {
      direction: MovementDirection
    }
  }
}

export interface MovePlayerResponseMessage {
  type: MessageTypes.Response
  id: ResponseTypes.MovePlayer
  component: {
    data: {
      id: string
      position: Position
    }
  }
}

export interface RotatePlayerResponseMessage {
  type: MessageTypes.Response
  id: 'ComponentUpdate'
  component: {
    data: {
      id: string
      rotation: number
    }
  }
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

export interface StartGameNofiticationMessage {
  type: MessageTypes.Notification
  id: NotificationTypes.StartGame
}


export interface RadarScan {
  players: { position: Position }[]
}

export type Rotation = number

export enum ActionTypes {
  Rotate,
  Shoot,
  Move
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
