import { Rotation } from './types'

export enum MovementDirection {
  Forward = 'forward',
  Backward = 'backward'
}

export enum RequestTypes {
  Rotate,
  Shoot,
  Move,
  DeployMine,
  Exit
}

export interface RotateRequest {
  type: RequestTypes.Rotate
  data: {
    rotation: Rotation
  }
}

export interface MoveRequest {
  type: RequestTypes.Move
  data: {
    direction: MovementDirection
  }
}

export interface ShootRequest {
  type: RequestTypes.Shoot
}

export interface DeployMineRequest {
  type: RequestTypes.DeployMine
}

export type Request = RotateRequest | MoveRequest | ShootRequest | DeployMineRequest

export function rotateRequest (rotation: Rotation): RotateRequest {
  return { type: RequestTypes.Rotate, data: { rotation } }
}

export function moveForwardRequest (): MoveRequest {
  return { type: RequestTypes.Move, data: { direction: MovementDirection.Forward } }
}

export function moveBackwardRequest (): MoveRequest {
  return { type: RequestTypes.Move, data: { direction: MovementDirection.Backward } }
}
