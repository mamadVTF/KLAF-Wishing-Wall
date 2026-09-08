import { useEffect, useId, useState } from 'react'
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
  // Unique per bubble (12 render at once); stripped of `:` so the URL fragment resolves.
  const arcId = useId().replace(/:/g, '')

  // Random phase offset so each bubble snaps on its own schedule.
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
        animate={{ scale: focused ? 1.5 : 1, opacity: 1 }}
        exit={{ scale: 0.4, opacity: 0, rotate: 8 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
      <motion.div
        className={styles.drift}
        animate={{ x: [0, 10, 0, -10, 0], rotate: [0, 6, 0, -6, 0] }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
          delay: floatDelay,
        }}
      >
        <div className={styles.bubble}>
          <svg className={styles.title} viewBox="0 0 235 60" aria-hidden="true">
            <defs>
              <path id={arcId} d="M 20 44 C 70 8, 165 8, 215 44" fill="none" />
            </defs>
            <text className={styles.titleText}>
              <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
                {wish.title}
              </textPath>
            </text>
          </svg>
          <span className={styles.message}>{wish.message}</span>
          <span className={styles.name}>- {wish.name}</span>
        </div>
      </motion.div>
    </motion.div>
  )
}