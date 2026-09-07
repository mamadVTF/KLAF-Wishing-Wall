export interface Wish {
  id: string
  title: string
  name: string
  message: string
}

export interface WishEventHandlers {
  onWishAdded: (wish: Wish) => void
  onWishUpdated: (wish: Wish) => void
  onWishRemoved: (id: string) => void
}

export type Unsubscribe = () => void

/**
 * A transport delivers wishes to the wall as events. The wall consumes
 * events only — it never issues commands to a transport, so every source
 * (keyboard input today, a websocket server later) has one consumer path.
 */
export interface IWishService {
  subscribe(handlers: WishEventHandlers): Unsubscribe
}