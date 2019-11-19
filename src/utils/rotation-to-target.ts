import { Position, Rotation } from '../types'

export default function (origin: Position, target: Position): Rotation {
  const { x, y } = origin
  const { x: tx, y: ty } = target
  const dx = Math.abs(tx - x)
  const dy = Math.abs(ty - y)
  const rotation = Math.atan2(dy, dx) * 180 / Math.PI

  // first quadrant
  if (tx > x && ty >= y) {
    return rotation
  }

  // second quadrant
  if (tx < x && ty >= y) {
    return 180 - rotation
  }

  // third quadrant
  if (x >= tx && y > ty) {
    return 180 + rotation
  }

  // fourth quadrant
  if (x < tx && y > ty) {
    return 360 - rotation
  }

  return rotation
}
