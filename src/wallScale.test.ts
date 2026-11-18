import { describe, expect, it } from 'vitest'
import {
  calculateReadableScale,
  calculateWallScale,
  READABLE_REFERENCE_SCALE,
} from './wallScale'

describe('wall scale', () => {
  it('fits the wall to the viewport', () => {
    expect(calculateWallScale(1280, 720)).toBeCloseTo(720 / 1536)
    expect(calculateWallScale(1280, 960)).toBeCloseTo(1280 / 2064)
  })

  it('uses 1280x960 as the minimum readable scale', () => {
    expect(calculateReadableScale(1280, 720)).toBeCloseTo(
      READABLE_REFERENCE_SCALE,
    )
    expect(calculateReadableScale(1280, 960)).toBeCloseTo(
      READABLE_REFERENCE_SCALE,
    )
    expect(calculateReadableScale(1920, 1080)).toBeCloseTo(1080 / 1536)
  })
})
