import { IPlanner } from './planner'

export interface Position {
  x: number
  y: number
}

export enum ActionTypes {
  Rotate,
  Shoot,
  Move,
  DeployMine
}

export type Rotation = number
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
