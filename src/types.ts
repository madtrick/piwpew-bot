import { Request } from './requests'
export { Request }

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
      state: S
    ) => { state: S, request: Request }

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
