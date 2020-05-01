import { Rotation, Position, ScannedPlayer, ScannedUnknown, ScannedMine, ScannedShot } from './types'
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
  Hit = 'Hit',
  Tick = 'Tick'
}

export interface RegisterPlayerRequestMessage {
  type: MessageTypes.Request
  id: RequestTypes.RegisterPlayer
  data: {
    game: {
      version: string
    }
    id: string
  }
}

export function registerPlayerRequestMessage (id: string): RegisterPlayerRequestMessage {
  const message: RegisterPlayerRequestMessage = {
    type: MessageTypes.Request,
    id: RequestTypes.RegisterPlayer,
    data: {
      game: {
        version: '2.1.2'
      },
      id
    }
  }

  return message
}

export interface FailedRegisterPlayerResponseMessage {
  type: MessageTypes.Response
  id: ResponseTypes.RegisterPlayer
  success: false
  details: {
    msg: string
  }
}

export interface SuccessfulRegisterPlayerResponseMessage {
  type: MessageTypes.Response
  id: ResponseTypes.RegisterPlayer
  success: true
  details: {
    id: string
    position: Position
    rotation: Rotation
    life: number
    tokens: number
  }
}

export type RegisterPlayerResponseMessage = FailedRegisterPlayerResponseMessage | SuccessfulRegisterPlayerResponseMessage

export interface MovePlayerRequestMessage {
  type: MessageTypes.Request
  id: RequestTypes.MovePlayer
  data: {
    movement: {
      direction: MovementDirection
      withTurbo?: boolean
    }
  }
}

export function movePlayerRequestMessage (direction: MovementDirection, withTurbo: boolean): MovePlayerRequestMessage {
  const data: MovePlayerRequestMessage = {
    type: MessageTypes.Request,
    id: RequestTypes.MovePlayer,
    data: {
      movement: {
        direction,
        withTurbo
      }
    }
  }

  return data
}


export interface FailedMovePlayerResponseMessage {
  type: MessageTypes.Response
  id: ResponseTypes.MovePlayer
  success: false
  details: {
    msg: string
  }
}

export interface SuccessfulMovePlayerResponseMessage {
  type: MessageTypes.Response
  id: ResponseTypes.MovePlayer
  success: true
  data: {
    component: {
      details: {
        position: Position
        tokens: number
      }
    }
    request: {
      withTurbo: boolean
      cost: number
    }
  }
}

export type MovePlayerResponseMessage = FailedMovePlayerResponseMessage | SuccessfulMovePlayerResponseMessage

export interface ShootRequestMessage {
  type: MessageTypes.Request
  id: RequestTypes.Shoot
}

export function shootRequestMessage (): ShootRequestMessage {
  const data: ShootRequestMessage = {
    type: MessageTypes.Request,
    id: RequestTypes.Shoot
  }

  return data
}


export interface FailedShootResponseMessage {
  type: MessageTypes.Response
  id: ResponseTypes.Shoot
  success: false
}

export interface SuccessfulShootResponseMessage {
  type: MessageTypes.Response
  id: ResponseTypes.Shoot
  success: true
  data: {
    component: {
      details: {
        tokens: number
      }
    }
    request: {
      cost: number
    }
  }
}

export type ShootResponseMessage = FailedShootResponseMessage | SuccessfulShootResponseMessage

export interface DeployMineRequestMessage {
  type: MessageTypes.Request
  id: RequestTypes.DeployMine
}

export function deployMineRequestMessage (): DeployMineRequestMessage {
  const data: DeployMineRequestMessage = {
    type: MessageTypes.Request,
    id: RequestTypes.DeployMine
  }

  return data
}

export interface FailedDeployMineResponseMessage {
  type: MessageTypes.Response
  id: ResponseTypes.Shoot
  success: false
  details: {
    msg: string
  }
}

export interface SuccessfulDeployMineResponseMessage {
  type: MessageTypes.Response
  id: ResponseTypes.Shoot
  success: boolean
  data: {
    component: {
      details: {
        tokens: number
      }
    }
    request: {
      cost: number
    }
  }
}

export type DeployMineResponseMessage = FailedDeployMineResponseMessage | SuccessfulDeployMineResponseMessage

export interface RotatePlayerRequestMessage {
  type: MessageTypes.Request
  id: RequestTypes.RotatePlayer
  data: {
    rotation: Rotation
  }
}

export function rotatePlayerRequestMessage (rotation: Rotation): RotatePlayerRequestMessage {
  const data: RotatePlayerRequestMessage = {
    type: MessageTypes.Request,
    id: RequestTypes.RotatePlayer,
    data: {
      rotation
    }
  }

  return data
}

export interface FailedRotatePlayerResponseMessage {
  type: MessageTypes.Response
  id: 'RotatePlayer'
  success: false
  details: {
    msg: string
  }
}

export interface SuccessfulRotatePlayerResponseMessage {
  type: MessageTypes.Response
  id: 'RotatePlayer'
  success: true
  data: {
    component: {
      details: {
        rotation: number
        tokens: number
      }
    }
    request: {
      cost: number
    }
  }
}

export type RotatePlayerResponseMessage = FailedRotatePlayerResponseMessage | SuccessfulRotatePlayerResponseMessage

export type ResponseMessage =
  RegisterPlayerResponseMessage
  | MovePlayerResponseMessage
  | RotatePlayerResponseMessage
  | ShootResponseMessage
  | DeployMineResponseMessage

export type RequestMessage =
  RegisterPlayerRequestMessage
  | MovePlayerRequestMessage
  | RotatePlayerRequestMessage
  | ShootRequestMessage
  | DeployMineRequestMessage

export interface PlayerHitNotificationMessage {
  type: MessageTypes.Notification
  id: NotificationTypes.Hit
  data: {
    damage: number
  }
}

export interface RadarScanNotificationMessage {
  type: MessageTypes.Notification
  id: NotificationTypes.RadarScan
  data: {
    players: ScannedPlayer[]
    unknown: ScannedUnknown[]
    mines: ScannedMine[]
    shots: ScannedShot[]
  }
}

export interface StartGameNofiticationMessage {
  type: MessageTypes.Notification
  id: NotificationTypes.StartGame
}

export interface JoinGameNotificationMessage {
  type: MessageTypes.Notification
  id: NotificationTypes.JoinGame
  details: {
    game: {
      settings: {
        playerSpeed: number
        shotSpeed: number
        turboMultiplier: number
        arenaWidth: number
        arenaHeight: number
        playerRadius: number
        radarScanRadius: number
      }
    }
  }
}

export interface TickNotificationMessage {
  type: MessageTypes.Notification
  id: NotificationTypes.Tick
}

export type NotificationMessage = 
  StartGameNofiticationMessage
  | JoinGameNotificationMessage
  | RadarScanNotificationMessage
  | PlayerHitNotificationMessage
  | TickNotificationMessage

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

export function isShootResponseMessage (message: any): message is ShootResponseMessage {
  const { type, id } = message

  return type === MessageTypes.Response && id === ResponseTypes.Shoot
}

export function isDeployMineResponseMessage (message: any): message is DeployMineResponseMessage {
  const { type, id } = message

  return type === MessageTypes.Response && id === ResponseTypes.DeployMine
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

export function isTickNotification (message: any): message is TickNotificationMessage {
  const { type, id } = message

  return type === MessageTypes.Notification && id === NotificationTypes.Tick
}

export function isPlayerHitNotificationMessage (message: any): message is PlayerHitNotificationMessage {
  const { type, id } = message

  return type === MessageTypes.Notification && id === NotificationTypes.Hit
}

