import { AnimatePresence } from 'motion/react'
import { useStore } from 'zustand'
import { wallStore } from '../wallStore'
import { Logo } from './Logo'
import { QrCode } from './QrCode'
import { WishBubble } from './WishBubble'
import styles from './Wall.module.css'

interface WallProps {
  qrUrl: string
}

/** Seconds between the start of each slot's float cycle, so bubbles drift out of phase. */
const FLOAT_STAGGER = 0.45

export function Wall({ qrUrl }: WallProps) {
  const slots = useStore(wallStore, (state) => state.slots)

  return (
    <main className={styles.wall}>
      <Logo />
      <QrCode qrUrl={qrUrl} />
      {/* All 12 slots are always rendered so their fixed scatter positions
          (nth-child rules below) never shift as wishes come and go. */}
      {slots.map((wish, index) => (
        <div key={index} className={styles.slot}>
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