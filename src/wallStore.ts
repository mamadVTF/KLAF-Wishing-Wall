import { createStore } from 'zustand'
import type { IWishService, Wish } from './transport'

/** Wall capacity: the most wish bubbles the wall shows at once. */
export const WALL_CAPACITY = 15

/** How long a randomly-chosen wish stays focused, in seconds. */
export const FOCUS_DURATION = 20

/** Seconds of no focus between consecutive focus rotations. */
export const FOCUS_INTERVAL = 5

/** The flavours cycled on the wall, in order. */
export const FLAVORS = ['Perisa', 'Pengalaman', 'Produk'] as const

/** How long each flavour stays on the wall, in seconds. */
export const FLAVOR_DURATION = 1

export interface SpawnPosition {
  /** Horizontal position as a percentage of the wall content area. */
  x: number
  /** Vertical position as a percentage of the wall content area. */
  y: number
}

export const DEFAULT_SPAWN_POSITIONS: SpawnPosition[] = [
  { x: 13, y: 30 },
  { x: 35, y: 28 },
  { x: 60, y: 35 },
  { x: 85, y: 30 },
  { x: 16, y: 65 },
  { x: 20, y: 48 },
  { x: 68, y: 76 },
]

export interface WallStoreState {
  /** Fixed slots, one per wall position; a slot holds a wish or is empty. */
  flavor: string
  slots: (Wish | null)[]
  /** Maximum number of wishes currently shown on the wall. */
  capacity: number
  /** Configured positions used by newly spawned wishes. */
  spawnPositions: SpawnPosition[]
  /** Optional per-wish positions set by the dev panel; null uses the default slot. */
  positions: (SpawnPosition | null)[]
  /** Position to apply to the next wish received by the wall. */
  nextSpawnPosition: SpawnPosition | null
  /** Wish ids in arrival order — the oldest wish is first. */
  arrival: string[]
  /** Id of the wish currently focused (scaled up), or null when none. */
  focusId: string | null
  setNextSpawnPosition: (position: SpawnPosition | null) => void
  setCapacity: (capacity: number) => void
  setSpawnPosition: (index: number, position: SpawnPosition) => void
  setWishPosition: (id: string, position: SpawnPosition) => void
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
    capacity: WALL_CAPACITY,
    spawnPositions: DEFAULT_SPAWN_POSITIONS.map((position) => ({ ...position })),
    positions: Array<SpawnPosition | null>(WALL_CAPACITY).fill(null),
    nextSpawnPosition: null,
    flavor: FLAVORS[0],
    arrival: [],
    focusId: null,

    handleWishAdded: (wish) =>
      set((state) => {
        const slots = [...state.slots]
        const positions = [...state.positions]
        const freeIndex = slots.findIndex((slot) => slot === null)
        if (freeIndex !== -1) {
          slots[freeIndex] = wish
          positions[freeIndex] =
            state.nextSpawnPosition ?? state.spawnPositions[freeIndex] ?? null
          return {
            slots,
            positions,
            arrival: [...state.arrival, wish.id],
            nextSpawnPosition: null,
          }
        }
        // Full: evict the oldest wish and place the new one in its slot.
        const oldestId = state.arrival[0]
        const evictedIndex = slots.findIndex((slot) => slot?.id === oldestId)
        slots[evictedIndex] = wish
        positions[evictedIndex] =
          state.nextSpawnPosition ?? state.spawnPositions[evictedIndex] ?? null
        return {
          slots,
          positions,
          arrival: [...state.arrival.slice(1), wish.id],
          focusId: state.focusId === oldestId ? null : state.focusId,
          nextSpawnPosition: null,
        }
      }),

    setNextSpawnPosition: (position) => set({ nextSpawnPosition: position }),

    setCapacity: (capacity) =>
      set((state) => {
        const nextCapacity = Math.min(
          WALL_CAPACITY,
          Math.max(1, Math.floor(capacity)),
        )
        if (nextCapacity === state.capacity) {
          return state
        }

        const retainedIds = new Set(state.arrival.slice(-nextCapacity))
        const slots: (Wish | null)[] = Array(nextCapacity).fill(null)
        const positions: (SpawnPosition | null)[] = Array(nextCapacity).fill(
          null,
        )

        for (let index = 0; index < state.slots.length; index++) {
          const wish = state.slots[index]
          if (!wish || !retainedIds.has(wish.id)) {
            continue
          }
          const targetIndex = slots.findIndex((slot) => slot === null)
          if (targetIndex === -1) {
            break
          }
          slots[targetIndex] = wish
          positions[targetIndex] = state.positions[index] ?? null
        }

        return {
          capacity: nextCapacity,
          slots,
          positions,
          arrival: state.arrival.filter((id) => retainedIds.has(id)),
          focusId:
            state.focusId && retainedIds.has(state.focusId)
              ? state.focusId
              : null,
        }
      }),

    setSpawnPosition: (index, position) =>
      set((state) => ({
        spawnPositions: state.spawnPositions.map((current, currentIndex) =>
          currentIndex === index ? position : current,
        ),
      })),

    setWishPosition: (id, position) =>
      set((state) => {
        const index = state.slots.findIndex((slot) => slot?.id === id)
        if (index === -1) {
          return state
        }
        const positions = [...state.positions]
        positions[index] = position
        return { positions }
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
        const positions = state.slots.map((slot, index) =>
          slot?.id === id ? null : state.positions[index],
        )
        return {
          slots,
          positions,
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
