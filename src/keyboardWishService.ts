import type {
  IWishService,
  Unsubscribe,
  Wish,
  WishEventHandlers,
} from './transport'

export const NAME_MAX_LENGTH = 30
export const MESSAGE_MAX_LENGTH = 140

export interface WishInput {
  name: string
  message: string
}

export type AddWishResult =
  | { ok: true; wish: Wish }
  | { ok: false; error: string }

/**
 * Validation for a wish input, shared by every transport so all sources
 * behave identically. Both name and message are required after trimming;
 * name is limited to 30 characters, message to 140.
 */
export function validateWish(input: WishInput): AddWishResult {
  const name = input.name.trim()
  const message = input.message.trim()

  if (name === '') {
    return { ok: false, error: 'Name is required' }
  }
  if (name.length > NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Name must be ${NAME_MAX_LENGTH} characters or fewer`,
    }
  }
  if (message === '') {
    return { ok: false, error: 'Message is required' }
  }
  if (message.length > MESSAGE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Message must be ${MESSAGE_MAX_LENGTH} characters or fewer`,
    }
  }
  return {
    ok: true,
    wish: { id: crypto.randomUUID(), name, message },
  }
}

const NAMES = [
  'Ayu',
  'Bima',
  'Citra',
  'Dewi',
  'Eka',
  'Fajar',
  'Gita',
  'Hendra',
  'Intan',
  'Joko',
]

const MESSAGES = [
  'Mala Pedas',
  'Maggi Goreng Mantap',
  'Kari Spesial',
  'Ayam Geprek Maggi',
  'Rasa Baru Seru',
]

/** A random name + message pair for the dev/demo generator. */
export function randomWishInput(): WishInput {
  const pick = <T,>(items: T[]): T =>
    items[Math.floor(Math.random() * items.length)]
  return { name: pick(NAMES), message: pick(MESSAGES) }
}

/**
 * Keyboard transport: local input (the dev panel) feeds wishes into the
 * transport contract. Invalid input is rejected and never emits an event.
 */
export class KeyboardWishService implements IWishService {
  private handlers: WishEventHandlers | null = null

  subscribe(handlers: WishEventHandlers): Unsubscribe {
    this.handlers = handlers
    return () => {
      this.handlers = null
    }
  }

  addWish(name: string, message: string): AddWishResult {
    const result = validateWish({ name, message })
    if (result.ok) {
      this.handlers?.onWishAdded(result.wish)
    }
    return result
  }
}