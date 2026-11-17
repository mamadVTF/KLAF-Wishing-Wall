import type { CSSProperties } from 'react'
import styles from './LogoBands.module.css'

const TILE_COLUMNS = 288
const TILE_ROWS = 8
const TILE_COUNT = TILE_COLUMNS * TILE_ROWS

function createRevealDelays() {
  const tileOrder = Array.from({ length: TILE_COUNT }, (_, index) => index)
  let seed = 0x6a09e667

  // Seeded Fisher–Yates keeps the tile order random-looking and stable.
  for (let index = TILE_COUNT - 1; index > 0; index -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const swapIndex = seed % (index + 1)
    ;[tileOrder[index], tileOrder[swapIndex]] = [
      tileOrder[swapIndex],
      tileOrder[index],
    ]
  }

  const delays = Array<string>(TILE_COUNT)
  tileOrder.forEach((tileIndex, revealIndex) => {
    delays[tileIndex] = `${(revealIndex / TILE_COUNT) * 1400}ms`
  })
  return delays
}

const REVEAL_DELAYS = createRevealDelays()

function PixelReveal() {
  return (
    <span className={styles.pixelGrid} aria-hidden="true">
      {Array.from({ length: TILE_COUNT }, (_, index) => (
        <span
          key={index}
          className={styles.pixelTile}
          style={{ '--reveal-delay': REVEAL_DELAYS[index] } as CSSProperties}
        />
      ))}
    </span>
  )
}

export function LogoBands() {
  return (
    <footer className={`${styles.band} ${styles.bottomBand}`}>
      <img
        className={styles.logo}
        src="/images/logo-bottom-group.png"
        alt="KLAF partners and sponsors"
      />
      <PixelReveal />
    </footer>
  )
}
