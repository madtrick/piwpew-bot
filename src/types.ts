import { Request } from './requests'

export interface Position {
  x: number
  y: number
}

export type Rotation = number

export interface BotAPI<S> {
  initState?: () => S

  handlers: {
    radarScanNotification?: (
      data: RadarScanNotification,
      state: S
    ) => { state: S, requests: Request[] }

    registerPlayerResponse?: (
      data: SuccessfulRegisterPlayerResponse | FailedRegisterPlayerResponse,
      state: S
    ) => { state: S, requests: Request[] }

    rotatePlayerResponse?: (
      data: SuccessfulRotatePlayerResponse | FailedRotatePlayerResponse,
      state: S
    ) => { state: S, requests: Request[] }

    movePlayerResponse?: (
      data: SuccessfulMovePlayerResponse | FailedMovePlayerResponse,
      state: S
    ) => { state: S, requests: Request[] }

    shootResponse?: (
      data: SuccessfulShootResponse | FailedShootResponse,
      state: S
    ) => { state: S, requests: Request[] }

    deployMineResponse?: (
      data: SuccessfulDeployMineResponse | FailedDeployMineResponse,
      state: S
    ) => { state: S, requests: Request[] }

    shotHitNotification?: (
      data: PlayerShotHitNotification,
      state: S
    ) => { state: S, requests: Request[] }

    // TODO include handler for destroyed player

    startGameNotification?: (state: S) => { state: S, requests: Request[] }

    joinGameNotification?: (state: S) => { state: S, requests: Request[] }
  }
}

export interface RadarScanNotification {
  data: {
    players: { position: Position, id: string, rotation: Rotation }[]
    shots: { position: Position, rotation: Rotation }[]
    unknown: { position: Position }[]
  }
}

export interface SuccessfulRegisterPlayerResponse {
  success: true
  data: {
    id: string
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
  data: {
    rotation: number
  }
}

export interface FailedRotatePlayerResponse {
  success: false
}

export interface SuccessfulShootResponse {
  success: true
  data: {
    shots: number
  }
}

export interface FailedShootResponse {
  success: false
}

export interface SuccessfulDeployMineResponse {
  success: true
  data: {
    mines: number
  }
}

export interface FailedDeployMineResponse {
  success: false
}

export interface PlayerShotHitNotification {
  damage: number
}
