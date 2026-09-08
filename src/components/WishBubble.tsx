import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import type { Wish } from '../transport'
import styles from './WishBubble.module.css'

interface WishBubbleProps {
  wish: Wish
  /** Whether this bubble is the current focus (scaled up). */
  focused?: boolean
}

/** Sound played when a new bubble pops in. Drop pop.mp3 into public/audio/. */
const POP_SOUND = '/audio/pop.mp3'

export function WishBubble({ wish, focused = false }: WishBubbleProps) {
  // Random phase offset so each bubble floats on its own schedule.
  const [floatDelay] = useState(() => Math.random() * 5)

  useEffect(() => {
    const audio = new Audio(POP_SOUND)
    audio.play().catch(() => {
      // Autoplay blocked or the file is missing — the visual add still plays.
    })
  }, [])

  return (
    <motion.div
      className={`${styles.float} ${focused ? styles.focused : ''}`}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: focused ? 1.2 : 1, opacity: 1 }}
      exit={{ scale: 0.4, opacity: 0, rotate: 8 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <motion.div
        className={styles.floatWrap}
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: floatDelay,
        }}
      >
        <div className={styles.bubble}>
          <img className={styles.profileIcon} src="/images/profile-icon.png" alt="" />
          <div className={styles.content}>
            <span className={styles.name}>{wish.name}</span>
            <span className={styles.title}>{wish.title}</span>
            <span className={styles.message}>{wish.message}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
