import { describe, expect, it } from 'vitest'
import type { IWishService, Unsubscribe, Wish, WishEventHandlers } from './transport'
import { createWallStore, WALL_CAPACITY } from './wallStore'

class FakeTransport implements IWishService {
  private handlers: WishEventHandlers | null = null

  subscribe(handlers: WishEventHandlers): Unsubscribe {
    this.handlers = handlers
    return () => {
      this.handlers = null
    }
  }

  add(wish: Wish) {
    this.handlers?.onWishAdded(wish)
  }

  update(wish: Wish) {
    this.handlers?.onWishUpdated(wish)
  }

  remove(id: string) {
    this.handlers?.onWishRemoved(id)
  }
}

const makeWish = (
  id: string,
  name = 'Nama',
  message = 'Saya Nak Maggi',
  title = 'Saya Nak Maggi',
): Wish => ({
  id,
  title,
  name,
  message: `${message} ${id}`,
})

function setup() {
  const store = createWallStore()
  const transport = new FakeTransport()
  store.getState().connect(transport)
  return { store, transport }
}

function filledSlots(store: ReturnType<typeof createWallStore>) {
  return store.getState().slots.filter((slot): slot is Wish => slot !== null)
}

describe('wall store', () => {
  it('places an added wish in the first free slot', () => {
    const { store, transport } = setup()

    transport.add(makeWish('w0'))

    expect(store.getState().slots[0]).toEqual(makeWish('w0'))
  })

  it('applies a selected spawn position to the next wish only', () => {
    const { store, transport } = setup()

    store.getState().setNextSpawnPosition({ x: 25, y: 60 })
    transport.add(makeWish('w0'))
    transport.add(makeWish('w1'))

    expect(store.getState().positions[0]).toEqual({ x: 25, y: 60 })
    expect(store.getState().positions[1]).toBeNull()
    expect(store.getState().nextSpawnPosition).toBeNull()
  })

  it('fills the wall up to capacity, one wish per slot', () => {
    const { store, transport } = setup()

    for (let i = 0; i < WALL_CAPACITY; i++) {
      transport.add(makeWish(`w${i}`))
    }

    const slots = store.getState().slots
    expect(slots).toHaveLength(WALL_CAPACITY)
    expect(filledSlots(store)).toHaveLength(WALL_CAPACITY)
    expect(slots.map((slot) => slot?.id)).toEqual(
      Array.from({ length: WALL_CAPACITY }, (_, i) => `w${i}`),
    )
  })

  it('evicts the oldest wish when full and places the new wish in its slot', () => {
    const { store, transport } = setup()
    for (let i = 0; i < WALL_CAPACITY; i++) {
      transport.add(makeWish(`w${i}`))
    }

    transport.add(makeWish('w-new'))

    const slots = store.getState().slots
    expect(filledSlots(store)).toHaveLength(WALL_CAPACITY)
    expect(slots[0]).toEqual(makeWish('w-new'))
    expect(slots.some((slot) => slot?.id === 'w0')).toBe(false)
    expect(slots[1]?.id).toBe('w1')
    expect(slots[11]?.id).toBe('w11')
  })

  it('evicts in arrival order as wishes keep coming', () => {
    const { store, transport } = setup()
    for (let i = 0; i < WALL_CAPACITY; i++) {
      transport.add(makeWish(`w${i}`))
    }

    transport.add(makeWish('w-new-1'))
    transport.add(makeWish('w-new-2'))

    const slots = store.getState().slots
    expect(slots[0]?.id).toBe('w-new-1')
    expect(slots[1]?.id).toBe('w-new-2')
    expect(slots.some((slot) => slot?.id === 'w0' || slot?.id === 'w1')).toBe(false)
  })

  it('updates a wish in place without moving it or changing arrival order', () => {
    const { store, transport } = setup()
    transport.add(makeWish('w0'))
    transport.add(makeWish('w1'))

    transport.update(makeWish('w0', 'Nama Baru', 'Pesan Baru'))

    const slots = store.getState().slots
    expect(slots[0]).toEqual(makeWish('w0', 'Nama Baru', 'Pesan Baru'))
    expect(slots[1]?.id).toBe('w1')
    expect(store.getState().arrival).toEqual(['w0', 'w1'])
  })

  it('ignores an update for a wish not on the wall', () => {
    const { store, transport } = setup()
    transport.add(makeWish('w0'))

    transport.update(makeWish('missing'))

    expect(store.getState().slots[0]?.id).toBe('w0')
  })

  it('removes the targeted wish by id, freeing its slot', () => {
    const { store, transport } = setup()
    transport.add(makeWish('w0'))
    transport.add(makeWish('w1'))
    transport.add(makeWish('w2'))

    transport.remove('w1')

    const slots = store.getState().slots
    expect(slots[0]?.id).toBe('w0')
    expect(slots[1]).toBeNull()
    expect(slots[2]?.id).toBe('w2')
  })

  it('places a later wish in the slot freed by a removal', () => {
    const { store, transport } = setup()
    transport.add(makeWish('w0'))
    transport.add(makeWish('w1'))
    transport.add(makeWish('w2'))
    transport.remove('w1')

    transport.add(makeWish('w3'))

    expect(store.getState().slots[1]?.id).toBe('w3')
  })

  it('stops receiving events after the transport is unsubscribed', () => {
    const store = createWallStore()
    const transport = new FakeTransport()
    const unsubscribe = store.getState().connect(transport)

    unsubscribe()
    transport.add(makeWish('w0'))

    expect(store.getState().slots.every((slot) => slot === null)).toBe(true)
  })
})
