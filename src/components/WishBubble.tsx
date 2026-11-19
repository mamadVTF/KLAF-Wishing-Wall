import { useEffect, useState } from 'react'
import { motion, useIsPresent, useReducedMotion } from 'motion/react'
import type { Wish } from '../transport'
import styles from './WishBubble.module.css'
import { BubbleBurst, BURST_SECONDS } from './BubbleBurst'

interface WishBubbleProps {
  wish: Wish
  /** Whether this bubble is the current focus (scaled up). */
  focused?: boolean
}

const REVEAL_SOUND = '/audio/sfx-bubble-reveal.mp3'
const POP_SOUND = '/audio/sfx-pop.mp3'
const BUBBLE_ASSETS = ['a', 'b', 'c'].map(variant => `/images/wish-bubble-${variant}.png`)

function WishBubbleSurface({
  wish,
  bubbleAsset,
  bursting,
}: {
  wish: Wish
  bubbleAsset: string
  bursting: boolean
}) {
  return (
    <div className={`${styles.bubble} ${bursting ? styles.burst : ''}`}
      style={{ backgroundImage: bursting ? undefined : `url(${bubbleAsset})` }}>
      {bursting && <BubbleBurst artwork={bubbleAsset} />}
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
  const isPresent = useIsPresent()
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const audio = new Audio(isPresent ? REVEAL_SOUND : POP_SOUND)
    audio.play().catch(() => {
      // The animation can still run if the browser blocks audio.
    })

    // Let the burst sound finish even after the exit animation releases the slot.
    if (!isPresent) return
    return () => {
      audio.pause()
    }
  }, [isPresent])

  return (
    <motion.div
      className={`${styles.float} ${focused ? styles.focused : ''}`}
      initial={{ scale: 0.72, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{
        opacity: reducedMotion ? 0 : [1, 1, 0],
        transition: {
          duration: reducedMotion ? 0.15 : BURST_SECONDS,
          times: reducedMotion ? undefined : [0, 0.9, 1],
          ease: 'easeOut',
        },
      }}
      transition={{
        type: 'spring',
        stiffness: 210,
        damping: 20,
        mass: 0.8,
      }}
    >
      <div className={styles.floatWrap} style={{ animationDelay: `${floatDelay}s`, animationPlayState: isPresent ? 'running' : 'paused' }}>
        <WishBubbleSurface wish={wish} bubbleAsset={bubbleAsset} bursting={!isPresent && !reducedMotion} />
      </div>
    </motion.div>
  )
}
