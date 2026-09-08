import { AnimatePresence } from 'motion/react'
import { useStore } from 'zustand'
import { wallStore } from '../wallStore'
import { WishBubble } from './WishBubble'
import styles from './Wall.module.css'

const FLAVOR_COLORS: Record<string, string> = {
  Perisa: '#F07632',
  Pengalaman: '#70CC66',
  Produk: '#EA2F64',
}

export function Wall() {
  const slots = useStore(wallStore, (state) => state.slots)
  const focusId = useStore(wallStore, (state) => state.focusId)
  const flavor = useStore(wallStore, (state) => state.flavor)

  return (
    <main className={styles.wall}>
      {/* All 12 slots are always rendered so their fixed scatter positions
          (per-index class rules below) never shift as wishes come and go. */}
      {slots.map((wish, index) => (
        <div
          key={index}
          className={`${styles.slot} ${styles[`slot-${index}`]}`}
          style={{ zIndex: wish?.id === focusId ? 2 : 1 }}
        >
          <AnimatePresence mode="wait">
            {wish && (
              <WishBubble
                key={wish.id}
                wish={wish}
                focused={wish.id === focusId}
              />
            )}
          </AnimatePresence>
        </div>
      ))}
      <h2 className={styles.title}><span className={styles.highlight} style={{ color: FLAVOR_COLORS[flavor], textShadow: '6px 0 0 #fff, -6px 0 0 #fff, 0 6px 0 #fff, 0 -6px 0 #fff, 6px 6px 0 #fff, -6px 6px 0 #fff, 6px -6px 0 #fff, -6px -6px 0 #fff' }}>{flavor}</span><span className={styles.default}>MAGGI® Impian Saya</span></h2>
    </main>
  )
}