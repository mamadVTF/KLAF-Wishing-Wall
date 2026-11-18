import { useEffect, useState } from 'react'
import { motion, usePresence } from 'motion/react'
import type { Wish } from '../transport'
import styles from './WishBubble.module.css'

interface WishBubbleProps {
  wish: Wish
  /** Whether this bubble is the current focus (scaled up). */
  focused?: boolean
}

type WishBoxVariant = 'teal' | 'orange' | 'blue' | 'yellow' | 'red'

/** Sound played when a new bubble pops in. Drop pop.mp3 into public/audio/. */
const POP_SOUND = '/audio/pop.mp3'
const DISSOLVE_DURATION = 0.45
const PIXELATED_STAGE_DELAY = 0.1
const DISPERSE_START_DELAY = 0.62
const EXIT_REMOVE_DELAY_MS = 1600

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

const VARIANTS: WishBoxVariant[] = ['teal', 'orange', 'blue', 'yellow', 'red']

const PIECES_BY_VARIANT: Record<WishBoxVariant, DispersePiece[]> = {
  teal: createDispersePieces(['#249c91', '#f7f20d', '#222'], 0x9e3779b9),
  orange: createDispersePieces(['#ffa31a', '#008fa3', '#222'], 0x243f6a88),
  blue: createDispersePieces(['#72a5d5', '#f7f20d', '#222'], 0x517cc1a3),
  yellow: createDispersePieces(['#f7f20d', '#008fa3', '#222'], 0x7f4a7c15),
  red: createDispersePieces(['#f65a42', '#f7f20d', '#222'], 0x1b873593),
}

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

function DisperseFragments({
  pieces,
  startDelay = 0,
}: {
  pieces: DispersePiece[]
  startDelay?: number
}) {
  return (
    <motion.span
      className={styles.disperseLayer}
      aria-hidden="true"
      initial={{ opacity: startDelay > 0 ? 0 : 1 }}
      animate={{ opacity: 1 }}
      transition={{ delay: startDelay, duration: 0.12, ease: 'linear' }}
    >
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
            delay: startDelay + piece.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </motion.span>
  )
}

function PixelatedFragments({ pieces }: { pieces: DispersePiece[] }) {
  return (
    <motion.span
      className={styles.pixelatedLayer}
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{
        delay: PIXELATED_STAGE_DELAY,
        duration: 0.9,
        times: [0, 0.35, 0.6, 1],
        ease: 'linear',
      }}
    >
      {pieces.map((piece, index) => (
        <span
          key={index}
          className={styles.dispersePiece}
          style={{
            left: piece.left,
            top: piece.top,
            width: piece.width,
            height: piece.height,
            background: piece.color,
          }}
        />
      ))}
    </motion.span>
  )
}

function WishBoxSurface({
  wish,
  variant,
  revealing = false,
}: {
  wish: Wish
  variant: WishBoxVariant
  revealing?: boolean
}) {
  return (
    <div
      className={`${styles.bubble} ${styles[variant]} ${revealing ? styles.revealing : ''}`}
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
    </div>
  )
}

export function WishBubble({ wish, focused = false }: WishBubbleProps) {
  // Random phase offset so each bubble floats on its own schedule.
  const [floatDelay] = useState(() => Math.random() * 5)
  const [variant] = useState<WishBoxVariant>(() =>
    VARIANTS[Math.floor(Math.random() * VARIANTS.length)],
  )
  const [revealComplete, setRevealComplete] = useState(false)
  const [isPresent, safeToRemove] = usePresence()
  const pieces = PIECES_BY_VARIANT[variant]

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

    const timeout = window.setTimeout(safeToRemove, EXIT_REMOVE_DELAY_MS)
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
          <WishBoxSurface wish={wish} variant={variant} revealing={!revealComplete} />
          {!revealComplete && <AssembleFragments pieces={pieces} />}
        </div>
      ) : (
        <>
          <motion.div
            className={styles.dissolvingSurface}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: DISSOLVE_DURATION, ease: 'easeInOut' }}
          >
            <WishBoxSurface wish={wish} variant={variant} />
          </motion.div>
          <PixelatedFragments pieces={pieces} />
          <DisperseFragments pieces={pieces} startDelay={DISPERSE_START_DELAY} />
        </>
      )}
    </motion.div>
  )
}
