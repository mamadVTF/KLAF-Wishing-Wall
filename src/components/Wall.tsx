import { useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import { useStore } from 'zustand'
import { wallStore } from '../wallStore'
import {
  calculateReadableScale,
  calculateWallScale,
} from '../wallScale'
import { WishBubble } from './WishBubble'
import styles from './Wall.module.css'

interface WallProps {
  showSpawnPositions?: boolean
}

export function Wall({ showSpawnPositions = false }: WallProps) {
  const slots = useStore(wallStore, (state) => state.slots)
  const positions = useStore(wallStore, (state) => state.positions)
  const spawnPositions = useStore(wallStore, (state) => state.spawnPositions)
  const capacity = useStore(wallStore, (state) => state.capacity)
  const focusId = useStore(wallStore, (state) => state.focusId)

  useEffect(() => {
    const updateWallScale = () => {
      const scale = calculateWallScale(window.innerWidth, window.innerHeight)
      document.documentElement.style.setProperty('--wall-scale', `${scale}`)
      document.documentElement.style.setProperty(
        '--wall-font-scale',
        `${calculateReadableScale(window.innerWidth, window.innerHeight)}`,
      )
    }

    updateWallScale()
    window.addEventListener('resize', updateWallScale)
    return () => window.removeEventListener('resize', updateWallScale)
  }, [])

  return (
    <main className={styles.wall}>
      <div className={styles.contentArea}>
        {showSpawnPositions &&
          spawnPositions.slice(0, capacity).map((position, index) => (
            <div
              className={styles.spawnMarker}
              key={`spawn-marker-${index}`}
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
            >
              <span>
                {index + 1}: X {position.x}% · Y {position.y}%
              </span>
            </div>
          ))}
        {/* All 12 slots are always rendered so their fixed scatter positions
            (per-index class rules below) never shift as wishes come and go. */}
        {slots.map((wish, index) => (
          <div
            key={index}
            className={`${styles.slot} ${styles[`slot-${index}`]}`}
            style={{
              ...(positions[index]
                ? {
                    left: `${positions[index]?.x}%`,
                    top: `${positions[index]?.y}%`,
                  }
                : {}),
              zIndex: wish?.id === focusId ? 2 : 1,
            }}
          >
            <AnimatePresence mode="wait">
              {wish && (
                <WishBubble
                  key={wish.id}
                  wish={wish}
                  focused={wish.id === focusId}
                />
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </main>
  )
}
