import { createStore } from 'zustand'
import type { IWishService, Wish } from './transport'

/** Wall capacity: the most wish bubbles the wall shows at once. */
export const WALL_CAPACITY = 13

/** How long a randomly-chosen wish stays focused, in seconds. */
export const FOCUS_DURATION = 20

/** Seconds of no focus between consecutive focus rotations. */
export const FOCUS_INTERVAL = 5

/** The flavours cycled on the wall, in order. */
export const FLAVORS = ['Perisa', 'Pengalaman', 'Produk'] as const

/** How long each flavour stays on the wall, in seconds. */
export const FLAVOR_DURATION = 1

export interface WallStoreState {
  /** Fixed slots, one per wall position; a slot holds a wish or is empty. */
  flavor: string
  slots: (Wish | null)[]
  /** Wish ids in arrival order — the oldest wish is first. */
  arrival: string[]
  /** Id of the wish currently focused (scaled up), or null when none. */
  focusId: string | null
  /** Subscribe a transport to the wall. Returns an unsubscribe function. */
  connect: (service: IWishService) => () => void
  handleWishAdded: (wish: Wish) => void
  handleWishUpdated: (wish: Wish) => void
  handleWishRemoved: (id: string) => void
  /** Start the focus rotation: randomly focus a wish, hold, pause, repeat. */
  startFocusRotation: () => void
  /** Start the flavour rotation: cycle Perisa, Pengalaman, Produk, repeat. */
  startFlavorRotation: () => void
}

export const createWallStore = () => {
  let rotationStarted = false
  let flavorRotationStarted = false

  const store = createStore<WallStoreState>()((set, get) => ({
    slots: Array<Wish | null>(WALL_CAPACITY).fill(null),
    flavor: FLAVORS[0],
    arrival: [],
    focusId: null,

    handleWishAdded: (wish) =>
      set((state) => {
        const slots = [...state.slots]
        const freeIndex = slots.findIndex((slot) => slot === null)
        if (freeIndex !== -1) {
          slots[freeIndex] = wish
          return { slots, arrival: [...state.arrival, wish.id] }
        }
        // Full: evict the oldest wish and place the new one in its slot.
        const oldestId = state.arrival[0]
        const evictedIndex = slots.findIndex((slot) => slot?.id === oldestId)
        slots[evictedIndex] = wish
        return {
          slots,
          arrival: [...state.arrival.slice(1), wish.id],
          focusId: state.focusId === oldestId ? null : state.focusId,
        }
      }),

    handleWishUpdated: (wish) =>
      set((state) => {
        const index = state.slots.findIndex((slot) => slot?.id === wish.id)
        if (index === -1) {
          return state
        }
        const slots = [...state.slots]
        slots[index] = wish
        return { slots }
      }),

    handleWishRemoved: (id) =>
      set((state) => {
        const slots = state.slots.map((slot) => (slot?.id === id ? null : slot))
        return {
          slots,
          arrival: state.arrival.filter((wishId) => wishId !== id),
          focusId: state.focusId === id ? null : state.focusId,
        }
      }),

    connect: (service) => {
      const unsubscribe = service.subscribe({
        onWishAdded: (wish) => get().handleWishAdded(wish),
        onWishUpdated: (wish) => get().handleWishUpdated(wish),
        onWishRemoved: (id) => get().handleWishRemoved(id),
      })
      return unsubscribe
    },

    startFocusRotation: () => {
      if (rotationStarted) {
        return
      }
      rotationStarted = true

      const rotate = () => {
        const visible = get().slots.filter((slot): slot is Wish => slot !== null)
        if (visible.length > 0) {
          const pick = visible[Math.floor(Math.random() * visible.length)]
          set({ focusId: pick.id })
        }
        // Hold the focus, then pause before picking the next one.
        setTimeout(() => {
          set({ focusId: null })
          setTimeout(rotate, FOCUS_INTERVAL * 1000)
        }, FOCUS_DURATION * 1000)
      }
      rotate()
    },

    startFlavorRotation: () => {
      if (flavorRotationStarted) {
        return
      }
      flavorRotationStarted = true

      const indexOf = (flavor: string) => FLAVORS.indexOf(flavor as (typeof FLAVORS)[number])
      const rotate = () => {
        const currentIndex = indexOf(get().flavor)
        const nextIndex = (currentIndex === -1 ? 0 : currentIndex + 1) % FLAVORS.length
        set({ flavor: FLAVORS[nextIndex] })
        setTimeout(rotate, FLAVOR_DURATION * 1000)
      }
      setTimeout(rotate, FLAVOR_DURATION * 1000)
    },
  }))

  return store
}

/** The app-wide wall store singleton. */
export const wallStore = createWallStore()
