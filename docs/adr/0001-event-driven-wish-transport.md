# Wishes reach the wall through an event-driven transport seam

Wishes enter the wall only through a `subscribe({ onWishAdded, onWishRemoved })` seam (`IWishService`). A keyboard-driven transport implements it today; the websocket transport is a documented stub. The store consumes events and never issues commands to a transport. Decided so every transport — local or remote — has a single consumer path, and adding the websocket later touches no wall code.

Considered and rejected: command-driven services where the store calls `addWish`/`removeWish`, which couples the store to transport semantics.