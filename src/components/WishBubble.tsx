import { useEffect } from 'react'
import { motion } from 'motion/react'
import type { Wish } from '../transport'
import styles from './WishBubble.module.css'

interface WishBubbleProps {
  wish: Wish
  /** Seconds to wait before this bubble's float cycle starts, so bubbles move out of phase. */
  floatDelay: number
}

/** Sound played when a new bubble pops in. Drop pop.mp3 into public/audio/. */
const POP_SOUND = '/audio/pop.mp3'

export function WishBubble({ wish, floatDelay }: WishBubbleProps) {
  useEffect(() => {
    const audio = new Audio(POP_SOUND)
    audio.play().catch(() => {
      // Autoplay blocked or the file is missing — the visual add still plays.
    })
  }, [])

  return (
      <motion.div
        className={styles.float}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.4, opacity: 0, rotate: 8 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
      <motion.div
        className={styles.drift}
        animate={{ y: [0, -12, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: floatDelay,
        }}
      >
        <div className={styles.bubble}>
          <span className={styles.title}>{wish.title}</span>
          <span className={styles.message}>{wish.message}</span>
          <span className={styles.name}>@ {wish.name}</span>
        </div>
      </motion.div>
    </motion.div>
  )
}