# 03: Keyboard transport and dev panel

**What to build:** A keyboard-driven transport implementing the contract, feeding wishes into the store, plus the local input surface: a dev panel with name and message fields and an Add button, and a random-wish generator. Wishes flow input → transport → store → wall, appearing as basic bubbles (full presentation styling comes in ticket 04). Validation lives in the transport: both name and message required after trim, name ≤ 30 characters, message ≤ 140 characters — invalid wishes are rejected without emitting an event, mirroring what a websocket transport will do.

**Blocked by:** 02 (contract and store)

**Status:** resolved

## Answer

Implemented 2026-09-03: `KeyboardWishService` with shared `validateWish` (required after trim; name ≤ 30, message ≤ 140) that rejects invalid input without emitting, a random-wish generator, and a floating dev panel (name/message form with inline errors, Random wish, Fill wall). The store singleton is connected in the app and the Wall renders wishes as bubbles — eviction is visible live past 12.

- [x] Typing a name and message and pressing Add makes the wish appear as a bubble on the wall
- [x] The random-wish generator adds wishes; generating past 12 shows eviction live (oldest bubble replaced)
- [x] Invalid wishes are rejected and never emit an event: empty-after-trim name or message, name over 30 characters, message over 140 characters
- [x] Validation is enforced inside the transport, so any future transport behaves identically
- [x] The keyboard transport's validation is covered by tests through its input path