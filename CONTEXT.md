# Wishing Wall

A promotional wall display: visitors submit wishes (a name and a message), and the wall shows the most recent ones as floating bubbles, bounded by a fixed capacity.

## Language

**Wish**:
A single visitor submission, consisting of a name and a message.
_Avoid_: Submission, entry

**Wish bubble**:
The visual rendering of a wish on the wall.
_Avoid_: Speech bubble, callout, thought bubble

**Wall**:
The full-screen display that shows up to wall capacity wish bubbles.
_Avoid_: Display, board, canvas

**Wall capacity**:
The maximum number of wish bubbles the wall shows at once. Fixed at 12.
_Avoid_: Limit, max bubbles

**Slot**:
A fixed position on the wall that a wish bubble occupies. The wall has exactly as many slots as its capacity.
_Avoid_: Position, spot, cell

**Eviction**:
Removal of the oldest wish when a new wish arrives and the wall is at capacity. The new wish takes the freed slot.
_Avoid_: Deletion, overflow, pruning

**Transport**:
The source that delivers wishes to the wall — currently a local keyboard-driven one for development and testing; a websocket-based one is planned. The wall treats all transports identically.
_Avoid_: Service, provider, data source

**QR code**:
The code rendered on the wall that points visitors to an external submission form. It is a signpost only; the app itself has no submission flow.