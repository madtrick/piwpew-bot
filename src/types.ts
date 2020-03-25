import { Request } from './requests'
export { Request }

export interface Position {
  x: number
  y: number
}

export type Rotation = number
export type HandlerReturn<S> = { state: S, requests: Request[] }

export interface BotAPI<S> {
  initState?: () => S

  handlers: {
    radarScanNotification?: (
      data: RadarScanNotification,
      state: S
    ) => HandlerReturn<S>

    registerPlayerResponse?: (
      data: SuccessfulRegisterPlayerResponse | FailedRegisterPlayerResponse,
      state: S
    ) => HandlerReturn<S>

    rotatePlayerResponse?: (
      data: SuccessfulRotatePlayerResponse | FailedRotatePlayerResponse,
      state: S
    ) => HandlerReturn<S>

    movePlayerResponse?: (
      data: SuccessfulMovePlayerResponse | FailedMovePlayerResponse,
      state: S
    ) => HandlerReturn<S>

    shootResponse?: (
      data: SuccessfulShootResponse | FailedShootResponse,
      state: S
    ) => HandlerReturn<S>

    deployMineResponse?: (
      data: SuccessfulDeployMineResponse | FailedDeployMineResponse,
      state: S
    ) => HandlerReturn<S>

    hitNotification?: (
      data: PlayerHitNotification,
      state: S
    ) => HandlerReturn<S>

    // TODO include handler for destroyed player

    startGameNotification?: (state: S) => HandlerReturn<S>

    joinGameNotification?: (state: S) => HandlerReturn<S>
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
