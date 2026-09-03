import type { IWishService, Unsubscribe, WishEventHandlers } from './transport'

/**
 * Websocket transport — documented stub.
 *
 * Will connect to the wall server over a websocket and relay its events
 * into the transport contract. The future wire contract is expected to
 * mirror the event shape:
 *
 *   { type: 'wish-added',   wish: Wish }
 *   { type: 'wish-removed', id: string }
 *
 * Subscribing registers handlers; nothing is emitted until the server
 * exists (building it is out of scope — see the spec).
 */
export class WebSocketWishService implements IWishService {
  subscribe(_handlers: WishEventHandlers): Unsubscribe {
    // No server exists yet, so there is nothing to wire. The wall's
    // handlers will be fed through these events once the socket connects.
    return () => {}
  }
}