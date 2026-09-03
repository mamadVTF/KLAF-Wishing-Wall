# 04: Bubble presentation — fixed slots, styling, float animation

**What to build:** Making the wall look like the campaign design: 12 fixed scatter positions that never change, speech-bubble styling via CSS modules (a name tag and the message per bubble), and a subtle up-and-down float on every bubble via motion. Bubble positions are tied to slots, so an evicted bubble's replacement appears in the same spot and bubbles never shift around.

**Blocked by:** 03 (wishes already flowing to the wall)

**Status:** resolved

## Answer

Implemented 2026-09-03: the wall now matches the campaign design with four components — `Wall` (yellow textured backdrop + 12 fixed scatter slots), `WishBubble` (the `wish-bubble.png` speech-bubble shape with a red handwritten name tag above and the white handwritten message inside, floating subtly via motion), `QrCode` (handwritten tagline + curved red arrow pointing at the QR card), and `Logo` (the `logo.png` yellow sticker card with the Maggi wordmark, flanked by handwritten "Nak" / "Apa?"). Bubbles occupy 12 absolute-positioned slots keyed to slot index, so eviction swaps a bubble in place and positions never shift. Verified headlessly at 1920x1080: all 12 slots render with no collisions against the logo, tagline, arrow, QR card, or dev panel, and the float animation moves continuously with no console errors.

- [x] Bubbles occupy 12 fixed scatter slots matching the design and never shift position when wishes come and go
- [x] Each bubble shows a name tag and the message, styled with CSS modules per the campaign design
- [x] Every bubble floats subtly up and down using motion
- [x] When a wish is evicted, its replacement appears in the same slot
- [x] The full flow is demoable: add wishes, watch them float, overflow the wall, and see eviction keep the 12-bubble layout intact