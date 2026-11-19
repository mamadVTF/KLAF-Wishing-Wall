import { useEffect, useState } from 'react'
import { motion, usePresence } from 'motion/react'
import type { Wish } from '../transport'
import styles from './WishBubble.module.css'

interface WishBubbleProps {
  wish: Wish
  /** Whether this bubble is the current focus (scaled up). */
  focused?: boolean
}

/** Sound played when a new bubble pops in. Drop pop.mp3 into public/audio/. */
const POP_SOUND = '/audio/sfx-pop.mp3'
const DISSOLVE_DURATION = 0.45
const EXIT_REMOVE_DELAY_MS = 500
type BubbleAsset = 'bubbleA' | 'bubbleB' | 'bubbleC'
const BUBBLE_ASSETS: BubbleAsset[] = ['bubbleA', 'bubbleB', 'bubbleC']

function WishBubbleSurface({
  wish,
  bubbleAsset,
}: {
  wish: Wish
  bubbleAsset: BubbleAsset
}) {
  return (
    <div className={`${styles.bubble} ${styles[bubbleAsset]}`}>
      <div className={styles.content}>
        <span className={styles.name}>{wish.name}</span>
        <span className={styles.message}>{wish.message}</span>
      </div>
    </div>
  )
}

export function WishBubble({ wish, focused = false }: WishBubbleProps) {
  // Random phase offset so each bubble floats on its own schedule.
  const [floatDelay] = useState(() => Math.random() * 5)
  const [bubbleAsset] = useState(
    () => BUBBLE_ASSETS[Math.floor(Math.random() * BUBBLE_ASSETS.length)],
  )
  const [isPresent, safeToRemove] = usePresence()

  useEffect(() => {
    if (!isPresent) {
      return
    }

    const audio = new Audio(POP_SOUND)
    audio.preload = 'auto'
    audio.play().catch(() => {
      // Autoplay blocked or the file is missing — the visual add still plays.
    })

    return () => {
      audio.pause()
      audio.currentTime = 0
    }
  }, [isPresent])

  useEffect(() => {
    if (isPresent) {
      return
    }

    const timeout = window.setTimeout(safeToRemove, EXIT_REMOVE_DELAY_MS)
    return () => window.clearTimeout(timeout)
  }, [isPresent, safeToRemove])

  return (
    <motion.div
      className={`${styles.float} ${focused ? styles.focused : ''}`}
      initial={{ scale: 0.72, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 210,
        damping: 20,
        mass: 0.8,
      }}
    >
      {isPresent ? (
        <div className={styles.floatWrap} style={{ animationDelay: `${floatDelay}s` }}>
          <WishBubbleSurface wish={wish} bubbleAsset={bubbleAsset} />
        </div>
      ) : (
        <motion.div
          className={styles.dissolvingSurface}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: DISSOLVE_DURATION, ease: 'easeInOut' }}
        >
          <WishBubbleSurface wish={wish} bubbleAsset={bubbleAsset} />
        </motion.div>
      )}
    </motion.div>
  )
}
