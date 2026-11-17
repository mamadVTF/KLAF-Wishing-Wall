import { useEffect, useState } from 'react'
import { motion, usePresence } from 'motion/react'
import type { Wish } from '../transport'
import styles from './WishBubble.module.css'

interface WishBubbleProps {
  wish: Wish
  /** Whether this bubble is the current focus (scaled up). */
  focused?: boolean
}

type WishBoxVariant = 'gray' | 'orange'

/** Sound played when a new bubble pops in. Drop pop.mp3 into public/audio/. */
const POP_SOUND = '/audio/pop.mp3'

interface DispersePiece {
  left: string
  top: string
  width: string
  height: string
  color: string
  x: number
  y: number
  rotate: number
  delay: number
}

function createDispersePieces(
  colors: string[],
  initialSeed: number,
): DispersePiece[] {
  const pieces: DispersePiece[] = []
  let seed = initialSeed
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 0xffffffff
  }

  for (let row = 0; row < 7; row += 1) {
    for (let column = 0; column < 16; column += 1) {
      pieces.push({
        left: `${column * (100 / 16)}%`,
        top: `${row * (100 / 7)}%`,
        width: 'calc(6.25% + 1px)',
        height: 'calc(14.285714% + 1px)',
        color: colors[Math.floor(random() * colors.length)],
        x: (random() - 0.5) * 520,
        y: -80 + random() * 360,
        rotate: (random() - 0.5) * 180,
        delay: random() * 0.18,
      })
    }
  }
  return pieces
}

const GRAY_PIECES = createDispersePieces(
  ['#d9d9d9', '#ff7058', '#f3f3f3', '#222'],
  0x9e3779b9,
)
const ORANGE_PIECES = createDispersePieces(
  ['#ff7058', '#ff9d88', '#fff3ef', '#f3f3f3', '#222'],
  0x243f6a88,
)

function AssembleFragments({ pieces }: { pieces: DispersePiece[] }) {
  return (
    <span className={styles.assembleLayer} aria-hidden="true">
      {pieces.map((piece, index) => (
        <motion.span
          key={index}
          className={styles.dispersePiece}
          style={{
            left: piece.left,
            top: piece.top,
            width: piece.width,
            height: piece.height,
            background: piece.color,
          }}
          initial={{
            x: piece.x,
            y: piece.y,
            rotate: piece.rotate,
            scale: 0.35,
            opacity: 0,
          }}
          animate={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
          transition={{
            duration: 0.72,
            delay: piece.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  )
}

function DisperseFragments({ pieces }: { pieces: DispersePiece[] }) {
  return (
    <span className={styles.disperseLayer} aria-hidden="true">
      {pieces.map((piece, index) => (
        <motion.span
          key={index}
          className={styles.dispersePiece}
          style={{
            left: piece.left,
            top: piece.top,
            width: piece.width,
            height: piece.height,
            background: piece.color,
          }}
          initial={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
          animate={{
            x: piece.x,
            y: piece.y,
            rotate: piece.rotate,
            scale: 0.35,
            opacity: 0,
          }}
          transition={{
            duration: 0.72,
            delay: piece.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </span>
  )
}

export function WishBubble({ wish, focused = false }: WishBubbleProps) {
  // Random phase offset so each bubble floats on its own schedule.
  const [floatDelay] = useState(() => Math.random() * 5)
  const [variant] = useState<WishBoxVariant>(() =>
    Math.random() < 0.5 ? 'gray' : 'orange',
  )
  const [revealComplete, setRevealComplete] = useState(false)
  const [isPresent, safeToRemove] = usePresence()
  const pieces = variant === 'orange' ? ORANGE_PIECES : GRAY_PIECES

  useEffect(() => {
    const audio = new Audio(POP_SOUND)
    audio.play().catch(() => {
      // Autoplay blocked or the file is missing — the visual add still plays.
    })
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => setRevealComplete(true), 1000)
    return () => window.clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (isPresent) {
      return
    }

    const timeout = window.setTimeout(safeToRemove, 1000)
    return () => window.clearTimeout(timeout)
  }, [isPresent, safeToRemove])

  return (
    <motion.div
      className={`${styles.float} ${focused ? styles.focused : ''}`}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ duration: 0.9, ease: 'linear' }}
    >
      {isPresent ? (
        <div className={styles.floatWrap} style={{ animationDelay: `${floatDelay}s` }}>
          <div
            className={`${styles.bubble} ${styles[variant]} ${!revealComplete ? styles.revealing : ''}`}
          >
            <div className={styles.content}>
              <span className={styles.name}>{wish.name}</span>
              <span className={styles.message}>{wish.message}</span>
            </div>
            <span className={styles.cornerMark} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            {!revealComplete && <AssembleFragments pieces={pieces} />}
          </div>
        </div>
      ) : (
        <DisperseFragments pieces={pieces} />
      )}
    </motion.div>
  )
}
