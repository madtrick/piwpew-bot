import { Rotation } from './types'

export enum MovementDirection {
  Forward = 'forward',
  Backward = 'backward'
}

export enum ActionTypes {
  Rotate,
  Shoot,
  Move,
  DeployMine,
  Exit
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

export function rotateAction (rotation: Rotation): RotateAction {
  return { type: ActionTypes.Rotate, data: { rotation } }
}

export function moveForwardAction (): MoveAction {
  return { type: ActionTypes.Move, data: { direction: MovementDirection.Forward } }
}

export function moveBackwardAction (): MoveAction {
  return { type: ActionTypes.Move, data: { direction: MovementDirection.Backward } }
}
