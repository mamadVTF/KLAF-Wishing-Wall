# 02: Wish plumbing — transport contract, bounded store, websocket stub

**What to build:** The heart of the wall: an event-driven transport contract (`subscribe` with `onWishAdded(wish)` and `onWishRemoved(id)` handlers), the in-memory wall store that consumes its events, and a documented websocket transport stub implementing the same contract. The store holds at most 12 wishes, evicts the oldest on overflow, places the new wish in the freed slot, and removes wishes by id. Tests drive the store through a fake transport — no wall or keyboard code is needed yet.

**Blocked by:** 01 (test runner and project skeleton)

**Status:** resolved

## Answer

Implemented 2026-09-03: the `IWishService` contract, the bounded zustand wall store (fixed slots, capacity 12, oldest-eviction with slot reuse, removal by id), and the documented `WebSocketWishService` stub. Store behavior is tested end-to-end through a fake transport at the seam — 7 tests covering placement, capacity, eviction order, slot reuse, removal, and unsubscribe.

- [x] The transport contract is defined: subscribing registers `onWishAdded(wish)` and `onWishRemoved(id)` handlers
- [x] The store consumes events from any transport implementing the contract — a fake transport in tests drives it end-to-end
- [x] The store holds at most 12 wishes; a 13th evicts the oldest
- [x] The evicted wish's slot is freed and the new wish takes that same slot
- [x] A removal event removes the targeted wish by id
- [x] The websocket transport exists as a documented stub implementing the same contract, with a note on the future wire contract (events for added/removed wishes)
- [x] The store's tests pass: capacity, eviction, slot reuse, and removal are all covered through the contract seam