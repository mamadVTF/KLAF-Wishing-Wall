import { AnimatePresence } from 'motion/react'
import { useStore } from 'zustand'
import { wallStore } from '../wallStore'
import { WishBubble } from './WishBubble'
import styles from './Wall.module.css'

/** Seconds between the start of each slot's float cycle, so bubbles drift out of phase. */
const FLOAT_STAGGER = 0.45

export function Wall() {
  const slots = useStore(wallStore, (state) => state.slots)

  return (
    <main className={styles.wall}>
      {/* All 12 slots are always rendered so their fixed scatter positions
          (per-index class rules below) never shift as wishes come and go. */}
      {slots.map((wish, index) => (
        <div key={index} className={`${styles.slot} ${styles[`slot-${index}`]}`}>
          <AnimatePresence mode="wait">
            {wish && (
              <WishBubble
                key={wish.id}
                wish={wish}
                floatDelay={index * FLOAT_STAGGER}
              />
            )}
          </AnimatePresence>
        </div>
      ))}
    </main>
  )
}