export const WALL_WIDTH = 2064
export const WALL_HEIGHT = 1536

const READABLE_REFERENCE_WIDTH = 1280
const READABLE_REFERENCE_HEIGHT = 960

export const READABLE_REFERENCE_SCALE = Math.min(
  READABLE_REFERENCE_WIDTH / WALL_WIDTH,
  READABLE_REFERENCE_HEIGHT / WALL_HEIGHT,
)

export function calculateWallScale(width: number, height: number): number {
  return Math.min(width / WALL_WIDTH, height / WALL_HEIGHT)
}

export function calculateReadableScale(width: number, height: number): number {
  return Math.max(
    calculateWallScale(width, height),
    READABLE_REFERENCE_SCALE,
  )
}
