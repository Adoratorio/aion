# Changelog

## 1.0.1

- Guarantee frame cleanup on callback errors; stop explicitly and allow restart.
- Keep one scheduled frame during stop/start and stop empty queues after a frame.
- Avoid collisions between generated and explicitly provided handler IDs.
- Include source files and inline source maps for consumer debugging.
- Typecheck tests, verify packed exports, and document active maintainers separately from contributors.

## 1.0.0

- ESM-only, TypeScript 7 toolchain, `debug` option, unified `[Aion]` errors.
- Handlers removed from inside a frame are detached after the frame; a non-forced `stop()` skips the already scheduled frame.
