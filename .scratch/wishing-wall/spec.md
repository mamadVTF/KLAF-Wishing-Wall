Status: resolved

# Wishing Wall — Spec

## Problem Statement

We're running a promotional event and want a wall display that collects and shows visitor wishes. Visitors scan a QR code on the wall and submit their wish (a name and a message) through an external form. The wall should show the most recent wishes as floating bubbles, keep a lively look, and keep accepting new wishes indefinitely by evicting the oldest when full. Right now there is no code — this spec defines the whole feature.

## Solution

A full-screen wall (React + TypeScript, styled with CSS modules, animated with motion) showing up to 12 wish bubbles scattered in fixed positions, each floating subtly up and down. A QR code rendered on the wall points at an external submission URL from `config.json`. Wishes enter the wall only through transports behind a single `IWishService` contract: a keyboard-driven transport (with a dev panel and a random-wish generator) works today; a websocket transport is a documented stub for later. When a new wish arrives and the wall is full, the oldest is evicted and the new wish takes the freed slot. Wall state is in-memory only.

## User Stories

1. As a visitor, I want to scan the QR code on the wall, so that I can open the wish submission form on my phone.
2. As a visitor, I want to enter my name and message in the external form, so that my wish can reach the wall.
3. As a visitor, I want my wish to appear on the wall after submitting, so that I can see my contribution live.
4. As a visitor, I want each wish to show both the name and the message, so that I can read who wished what.
5. As a host, I want the wall to show many wishes at once (up to 12), so that the display looks alive.
6. As a host, I want the wall to keep accepting new wishes once full, so that the display always shows the freshest wishes.
7. As a host, I want each wish bubble to float subtly up and down, so that the display feels lively without being distracting.
8. As a host, I want bubbles scattered across the wall in fixed positions, so that the layout matches the campaign design.
9. As a host, I want the wall to render a QR code from a URL stored in `config.json`, so that I can repoint it at the campaign's submission form without code changes.
10. As a developer, I want to add wishes locally through a keyboard-driven service, so that I can demo and test the wall without a server.
11. As a developer, I want a random-wish generator, so that I can observe eviction without hand-typing 13 wishes.
12. As a developer, I want the wall to reject invalid wishes (name and message required after trim; name ≤ 30 chars, message ≤ 140), so that bad data never reaches the display.
13. As a developer, I want the keyboard service to enforce the same validation a websocket service would, so that transports behave consistently.
14. As a developer, I want a websocket transport stub, so that the phone-to-wall flow can be plugged in later without touching wall code.
15. As a developer, I want the wall and store to depend only on the `IWishService` contract, so that transports are swappable.
16. As a developer, I want the store to evict the oldest wish and place the new one in the freed slot, so that bubble positions stay stable.
17. As a developer, I want wall state to be in-memory only, so that behavior is predictable (a reload clears the wall).
18. As a developer, I want a dev panel with name and message fields and an Add button, so that I can submit specific wishes during development.

## Implementation Decisions

- **Transport seam** (ADR-0001): `IWishService` is event-driven — `subscribe({ onWishAdded(wish), onWishRemoved(id) })`. The store consumes events and never issues commands to a transport. `KeyboardWishService` implements it today; `WebSocketWishService` is a documented stub.
- **Bounded wall** (ADR-0002): wall capacity is a fixed 12; state is in-memory (zustand); bubbles occupy fixed scatter slots that never change; on overflow the oldest wish is evicted and the new wish takes its slot. Only the float animation moves a bubble.
- **QR target** (ADR-0003): the QR code renders a URL read from `config.json` pointing at an external submission form. There is no in-app submit route.
- **Wish shape**: each wish carries an `id`, a `name`, and a `message`. The id distinguishes wishes so eviction and removal can target a specific wish.
- **Validation**: both name and message required after trim; name ≤ 30 chars; message ≤ 140 chars. Validation lives in the transport so every source behaves identically.
- **Stack**: React, motion (subtle up/down float), CSS modules, TypeScript, zustand.
- **Dev tooling**: a dev panel (name + message + Add) and a random-wish generator, both feeding the keyboard transport.

## Testing Decisions

- **Single seam** (confirmed): the `IWishService` contract. No component-level or reducer-level tests.
- **What makes a good test**: only external behavior — given a sequence of events through the transport contract, the store ends in the correct state; given invalid input to the keyboard service's input path, no event is emitted and the store is unchanged.
- **Modules tested**:
  - Wall store — driven by a fake transport emitting `onWishAdded`/`onWishRemoved`: wishes land, the 12-bubble cap holds, the oldest is evicted, the new wish takes the freed slot.
  - Keyboard service — validation rejects missing/over-length name or message; valid input emits the expected event.
- **Prior art**: none — this repo has no tests yet; these will be the project's first.

## Out of Scope

- Websocket server implementation (stub only; the real server is future work).
- In-app submission form (`/submit` route).
- Persistence across reloads (localStorage or backend).
- Any backend, database, or data storage.
- Component/render tests (deliberate — single-seam decision).
- Design/ownership of the external submission form and its accessibility.
- Deployment and hosting of the wall app.

## Further Notes

- The wall is a live installation: wishes reach it only through transports, never directly from the QR flow.
- Use the glossary vocabulary from `CONTEXT.md`: *wish*, *wish bubble*, *wall*, *wall capacity*, *slot*, *eviction*, *transport*, *QR code*.