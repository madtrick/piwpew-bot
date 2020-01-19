import { Rotation, Position } from './types'
import { MovementDirection } from './requests'

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
  RotatePlayer = 'RotatePlayer',
  Shoot = 'Shoot',
  DeployMine = 'DeployMine'
}

export enum NotificationTypes {
  RadarScan = 'RadarScan',
  StartGame = 'StartGame',
  JoinGame = 'JoinGame',
  ShotHit = 'ShotHit'
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
    rotation: Rotation
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
    rotation: Rotation
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
  data: {
    rotation: number
  }
}

export interface PlayerShotHitNotificationMessage {
  type: MessageTypes.Notification
  id: NotificationTypes.ShotHit
  data: {
    damage: number
  }
}

export interface RadarScanNotificationMessage {
  type: MessageTypes.Notification
  id: NotificationTypes.RadarScan
  data: {
    players: { position: Position, id: string, rotation: Rotation }[]
    unknown: { position: Position }[]
    shots: { position: Position, rotation: Rotation }[]
  }
}

export interface ShootRequestMessage {
  type: MessageTypes.Request
  id: RequestTypes.Shoot
}

export interface ShootResponseMessage {
  type: MessageTypes.Response
  id: ResponseTypes.Shoot
  success: boolean
  data: {
    shots: number
  }
}

export interface DeployMineRequestMessage {
  type: MessageTypes.Request
  id: RequestTypes.DeployMine
}

export interface DeployMineResponseMessage {
  type: MessageTypes.Response
  id: ResponseTypes.Shoot
  success: boolean
  data: {
    mines: number
  }
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

export function isRegisterPlayerResponseMessage (message: any): message is RegisterPlayerResponseMessage {
  const { type, id } = message

  return type === MessageTypes.Response && id === ResponseTypes.RegisterPlayer
}

export function isMovePlayerResponseMessage (message: any): message is MovePlayerResponseMessage {
  const { type, id } = message

  return type === MessageTypes.Response && id === ResponseTypes.MovePlayer
}

export function isRotatePlayerResponseMessage (message: any): message is RotatePlayerResponseMessage {
  const { type, id } = message

  return type === MessageTypes.Response && id === 'RotatePlayer'
}

export function isRadarScanNotificationMessage (message: any): message is RadarScanNotificationMessage {
  const { type, id } = message

  return type === MessageTypes.Notification && id === NotificationTypes.RadarScan
}

export function isStartGameNotificationMessage (message: any): message is StartGameNofiticationMessage {
  const { type, id } = message

  return type === MessageTypes.Notification && id === NotificationTypes.StartGame
}

export function isJoinGameNotificationMessage (message: any): message is JoinGameNotificationMessage {
  const { type, id } = message

  return type === MessageTypes.Notification && id === NotificationTypes.JoinGame
}

export function isShootResponseMessage (message: any): message is ShootResponseMessage {
  const { type, id } = message

  return type === MessageTypes.Response && id === ResponseTypes.Shoot
}

export function isDeployMineResponseMessage (message: any): message is DeployMineResponseMessage {
  const { type, id } = message

  return type === MessageTypes.Response && id === ResponseTypes.DeployMine
}

export function isPlayerShotHitNotificationMessage (message: any): message is PlayerShotHitNotificationMessage {
  const { type, id } = message

  return type === MessageTypes.Notification && id === NotificationTypes.ShotHit
}
