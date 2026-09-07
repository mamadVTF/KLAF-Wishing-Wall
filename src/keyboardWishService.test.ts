import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TITLE,
  KeyboardWishService,
  MESSAGE_MAX_LENGTH,
  NAME_MAX_LENGTH,
} from './keyboardWishService'
import type { Wish } from './transport'

function capture() {
  const service = new KeyboardWishService()
  const added: Wish[] = []
  const updated: Wish[] = []
  const removed: string[] = []
  service.subscribe({
    onWishAdded: (wish) => added.push(wish),
    onWishUpdated: (wish) => updated.push(wish),
    onWishRemoved: (id) => removed.push(id),
  })
  return { service, added, updated, removed }
}

describe('KeyboardWishService', () => {
  it('emits an added wish for valid input, with trimmed values', () => {
    const { service, added } = capture()

    const result = service.addWish('', '  Ayu  ', '  Saya Nak Maggi  ')

    expect(result.ok).toBe(true)
    expect(added).toHaveLength(1)
    expect(added[0]).toMatchObject({
      title: DEFAULT_TITLE,
      name: 'Ayu',
      message: 'Saya Nak Maggi',
    })
    expect(added[0].id).toBeTruthy()
  })

  it('keeps a supplied title and falls back to the default when blank', () => {
    const { service, added } = capture()

    service.addWish('  Cooking Show!  ', 'Ayu', 'Mala Pedas')
    service.addWish('   ', 'Bima', 'Kari Spesial')

    expect(added[0].title).toBe('Cooking Show!')
    expect(added[1].title).toBe(DEFAULT_TITLE)
  })

  it('rejects a blank name without emitting', () => {
    const { service, added } = capture()

    const result = service.addWish('', '   ', 'Saya Nak Maggi')

    expect(result.ok).toBe(false)
    expect(added).toHaveLength(0)
  })

  it('rejects a blank message without emitting', () => {
    const { service, added } = capture()

    const result = service.addWish('', 'Ayu', '   ')

    expect(result.ok).toBe(false)
    expect(added).toHaveLength(0)
  })

  it('rejects a name over the length limit', () => {
    const { service, added } = capture()

    const result = service.addWish(
      '',
      'x'.repeat(NAME_MAX_LENGTH + 1),
      'Saya Nak Maggi',
    )

    expect(result.ok).toBe(false)
    expect(added).toHaveLength(0)
  })

  it('accepts a name at the length limit', () => {
    const { service, added } = capture()

    const result = service.addWish(
      '',
      'x'.repeat(NAME_MAX_LENGTH),
      'Saya Nak Maggi',
    )

    expect(result.ok).toBe(true)
    expect(added).toHaveLength(1)
  })

  it('rejects a message over the length limit', () => {
    const { service, added } = capture()

    const result = service.addWish('', 'Ayu', 'x'.repeat(MESSAGE_MAX_LENGTH + 1))

    expect(result.ok).toBe(false)
    expect(added).toHaveLength(0)
  })

  it('accepts a message at the length limit', () => {
    const { service, added } = capture()

    const result = service.addWish('', 'Ayu', 'x'.repeat(MESSAGE_MAX_LENGTH))

    expect(result.ok).toBe(true)
    expect(added).toHaveLength(1)
  })

  it('returns ok without throwing when nothing is subscribed', () => {
    const service = new KeyboardWishService()

    const result = service.addWish('', 'Ayu', 'Saya Nak Maggi')

    expect(result.ok).toBe(true)
  })
})