# 01: App shell with config-driven QR code

**What to build:** A runnable wall app: the project scaffolded with the agreed stack, a configuration file holding the external submission URL, and a wall screen that renders the QR code for that URL against the campaign background. The wall is otherwise empty for now — wishes come in later tickets.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The dev server starts and the wall screen renders with the campaign background
- [ ] The QR code renders on the wall, encoding the URL read from the configuration file
- [ ] Changing the URL in the configuration file changes the QR code without code edits
- [ ] The stack is in place and building: React, TypeScript, motion, CSS modules, zustand, and the test runner
- [ ] The project typechecks and builds cleanly