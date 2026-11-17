import { AnimatePresence } from 'motion/react'
import { useStore } from 'zustand'
import { wallStore } from '../wallStore'
import { WishBubble } from './WishBubble'
import styles from './Wall.module.css'

export function Wall() {
  const slots = useStore(wallStore, (state) => state.slots)
  const focusId = useStore(wallStore, (state) => state.focusId)

  return (
    <main className={styles.wall}>
      <div className={styles.contentArea}>
        {/* All 12 slots are always rendered so their fixed scatter positions
            (per-index class rules below) never shift as wishes come and go. */}
        {slots.map((wish, index) => (
          <div
            key={index}
            className={`${styles.slot} ${styles[`slot-${index}`]}`}
            style={{ zIndex: wish?.id === focusId ? 2 : 1 }}
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
