import { Request, MovementDirection } from './requests'
import {
  MovePlayerResponseMessage,
  movePlayerRequestMessage,
  isMovePlayerResponseMessage,
  RotatePlayerResponseMessage,
  rotatePlayerRequestMessage,
  isRotatePlayerResponseMessage,
  DeployMineResponseMessage,
  isDeployMineResponseMessage,
  ShootResponseMessage,
  isShootResponseMessage,
  shootRequestMessage,
  RegisterPlayerResponseMessage,
  isRegisterPlayerResponseMessage,
  StartGameNofiticationMessage,
  isStartGameNotificationMessage,
  JoinGameNotificationMessage,
  isJoinGameNotificationMessage,
  RadarScanNotificationMessage,
  isRadarScanNotificationMessage,
  PlayerHitNotificationMessage,
  isPlayerHitNotificationMessage,
  ResponseMessage,
  NotificationMessage,
  isTickNotification,
  RequestMessage,
  ResponseTypes
} from './messages'
export {
  Request,
  MovementDirection,
  MovePlayerResponseMessage,
  movePlayerRequestMessage,
  isMovePlayerResponseMessage,
  RotatePlayerResponseMessage,
  rotatePlayerRequestMessage,
  isRotatePlayerResponseMessage,
  DeployMineResponseMessage,
  isDeployMineResponseMessage,
  ShootResponseMessage,
  isShootResponseMessage,
  shootRequestMessage,
  RegisterPlayerResponseMessage,
  isRegisterPlayerResponseMessage,
  StartGameNofiticationMessage,
  isStartGameNotificationMessage,
  JoinGameNotificationMessage,
  isJoinGameNotificationMessage,
  RadarScanNotificationMessage,
  isRadarScanNotificationMessage,
  PlayerHitNotificationMessage,
  isPlayerHitNotificationMessage,
  ResponseMessage,
  NotificationMessage,
  isTickNotification,
  RequestMessage,
  ResponseTypes
}

export interface Position {
  x: number
  y: number
}

export type Rotation = number

export interface BotAPI<S> {
  initState?: () => S
  onMessage?: (
    data: { message: ResponseMessage | NotificationMessage },
    state: S,
    context: { inFlightRequestMessage?: RequestMessage }
  ) => { state: S, request?: RequestMessage }

  handlers: {
    radarScanNotification?: (
      data: RadarScanNotification,
      state: S
    ) => { state: S }

    registerPlayerResponse?: (
      data: SuccessfulRegisterPlayerResponse | FailedRegisterPlayerResponse,
      state: S
    ) => { state: S }

    rotatePlayerResponse?: (
      data: SuccessfulRotatePlayerResponse | FailedRotatePlayerResponse,
      state: S
    ) => { state: S }

    movePlayerResponse?: (
      data: SuccessfulMovePlayerResponse | FailedMovePlayerResponse,
      state: S
    ) => { state: S }

    shootResponse?: (
      data: SuccessfulShootResponse | FailedShootResponse,
      state: S
    ) => { state: S }

    deployMineResponse?: (
      data: SuccessfulDeployMineResponse | FailedDeployMineResponse,
      state: S
    ) => { state: S }

    hitNotification?: (
      data: PlayerHitNotification,
      state: S
    ) => { state: S }

    tickNotification?: (
      state: S,
      context: { inFlightRequest?: Request }
    ) => { state: S, request?: Request }

    // TODO include handler for destroyed player

    startGameNotification?: (
      state: S
    ) => { state: S }

    joinGameNotification?: (
      data: JoinGameNotification,
      state: S
    ) => { state: S }
  }
}

export interface ScannedPlayer {
  id: string
  position: Position
  rotation: Rotation
}

export interface ScannedShot {
  position: Position
  rotation: Rotation
}

export interface ScannedMine {
  position: Position
}

export interface ScannedUnknown {
  position: Position
}

export interface RadarScanNotification {
  data: {
    players: ScannedPlayer[]
    shots: ScannedShot[]
    mines: ScannedMine[]
    unknown: ScannedUnknown[]
  }
}

export interface SuccessfulRegisterPlayerResponse {
  success: true
  data: {
    id: string
    position: Position
    rotation: Rotation
    life: number
    tokens: number
  }
}

export interface FailedRegisterPlayerResponse {
  success: false
  data: string
}

export interface SuccessfulMovePlayerResponse {
  success: true
  data: {
    tokens: number
    position: Position
    request: {
      withTurbo: boolean
      cost: number
    }
  }
}

export interface FailedMovePlayerResponse {
  success: false
  data: string
}

export interface SuccessfulRotatePlayerResponse {
  success: true
  data: {
    tokens: number
    rotation: number
    request: {
      cost: number
    }
  }
}

export interface FailedRotatePlayerResponse {
  success: false
  data: string
}

export interface SuccessfulShootResponse {
  success: true
  data: {
    tokens: number
    request: {
      cost: number
    }
  }
}

export interface FailedShootResponse {
  success: false
  data: string
}

export interface SuccessfulDeployMineResponse {
  success: true
  data: {
    tokens: number
    request: {
      cost: number
    }
  }
}

export interface FailedDeployMineResponse {
  success: false
  data: string
}

export interface PlayerHitNotification {
  damage: number
}

export interface GameSettings {
  playerSpeed: number
  shotSpeed: number
  turboMultiplier: number
  arenaWidth: number
  arenaHeight: number
  radarScanRadius: number
  playerRadius: number
}

export interface JoinGameNotification {
  data: {
    game: {
      settings: GameSettings
    }
  }
}
