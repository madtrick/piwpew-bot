import { Position } from './types'

function radiansToDegrees (radians: number): number {
  return Math.atan(radians) * 180 / Math.PI
}

/*
* This function calculates the angle between to points. It takes two points as
* arguments. The angle is calculated between the first point (center) and
* the second one.
*
*                          +
*        POINT B           |            POINT B
*                          |
*                          |
*        B.x lt A.x        |            B.x gt A.x
*        B.y gt A.y        |            B.y gt A.y
*                          |
*                          |
*                          |
*                          |
* +----------------------POINT A---------------------+
*                          |
*                          |
*                          |
*        B.x lt A.x        |            B.x gt A.x
*        B.y lt A.y        |            B.y lt A.y
*                          |
*                          |
*                          |
*        POINT B           |            POINT B
*                          |
*                          +
*
*/
export function calculateAngleBetweenPoints (pointA: Position, pointB: Position): number {
  // TODO remove that 0 default
  let angleBetweenPoints: number = 0

  if (pointA.x > pointB.x) {
    if (pointA.y > pointB.y) {
      const angleInRadians = Math.abs((pointA.y - pointB.y) / (pointA.x - pointB.x))
      angleBetweenPoints = radiansToDegrees(angleInRadians) + 180
    } else if (pointA.y < pointB.y) {
      const angleInRadians = Math.abs((pointA.x - pointB.x) / (pointA.y - pointB.y))
      angleBetweenPoints = radiansToDegrees(angleInRadians) + 90
    } else if (pointA.y === pointB.y) {
      // TODO shouldn't this be 180?
      angleBetweenPoints = 0
    }
  } else if (pointA.x < pointB.x) {
    if (pointA.y > pointB.y) {
      const angleInRadians = Math.abs((pointA.x - pointB.x) / (pointA.y - pointB.y))
      angleBetweenPoints = radiansToDegrees(angleInRadians) + 270
    } else if (pointA.y < pointB.y) {
      const angleInRadians = Math.abs((pointA.y - pointB.y) / (pointA.x - pointB.x))
      angleBetweenPoints = radiansToDegrees(angleInRadians)
    } else if (pointA.y === pointB.y) {
      angleBetweenPoints = 0
    }
  } else if (pointA.x === pointB.x) {
    if (pointA.y > pointB.y) {
      // TODO shouldn't this be 270?
      angleBetweenPoints = 90
    } else {
      // TODO shouldn't this be 90?
      angleBetweenPoints = 180
    }
  }

  return angleBetweenPoints
}

export function calculateDistanceBetweenTwoPoints (pointA: Position, pointB: Position): number {
  return Math.sqrt(
    Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2)
  )
}
