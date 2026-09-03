import { motion } from 'motion/react'
import type { Wish } from '../transport'
import styles from './WishBubble.module.css'

interface WishBubbleProps {
  wish: Wish
  /** Seconds to wait before this bubble's float cycle starts, so bubbles move out of phase. */
  floatDelay: number
}

export function WishBubble({ wish, floatDelay }: WishBubbleProps) {
  return (
    <motion.div
      className={styles.float}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
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
        <span className={styles.name}>{wish.name}</span>
        <div className={styles.bubble}>
          <span className={styles.title}>Saya Nak Maggi</span>
          <span className={styles.message}>{wish.message}</span>
        </div>
      </motion.div>
    </motion.div>
  )
}