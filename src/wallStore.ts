import { createStore } from 'zustand'
import type { IWishService, Wish } from './transport'

/** Wall capacity: the most wish bubbles the wall shows at once. */
export const WALL_CAPACITY = 12

export interface WallStoreState {
  /** Fixed slots, one per wall position; a slot holds a wish or is empty. */
  slots: (Wish | null)[]
  /** Wish ids in arrival order — the oldest wish is first. */
  arrival: string[]
  /** Subscribe a transport to the wall. Returns an unsubscribe function. */
  connect: (service: IWishService) => () => void
  handleWishAdded: (wish: Wish) => void
  handleWishRemoved: (id: string) => void
}

export const createWallStore = () =>
  createStore<WallStoreState>()((set, get) => ({
    slots: Array<Wish | null>(WALL_CAPACITY).fill(null),
    arrival: [],

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
        return { slots, arrival: [...state.arrival.slice(1), wish.id] }
      }),

    handleWishRemoved: (id) =>
      set((state) => {
        const slots = state.slots.map((slot) => (slot?.id === id ? null : slot))
        return {
          slots,
          arrival: state.arrival.filter((wishId) => wishId !== id),
        }
      }),

    connect: (service) => {
      const unsubscribe = service.subscribe({
        onWishAdded: (wish) => get().handleWishAdded(wish),
        onWishRemoved: (id) => get().handleWishRemoved(id),
      })
      return unsubscribe
    },
  }))

/** The app-wide wall store singleton. */
export const wallStore = createWallStore()