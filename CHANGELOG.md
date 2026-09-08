# Changelog

This file records changes from 1.0.0 onward. See [GitHub releases](https://github.com/Adoratorio/aion/releases) for published release notes. Dates are shown where a matching GitHub release exists.

## Unreleased

### Documentation

- Document handler frequency, callback arguments, engine state and manual frame advancement.

- Refine contributor guidance and release notes; consolidate maintainer contacts in the README.

## [1.0.1](https://github.com/Adoratorio/aion/releases/tag/v1.0.1) — 2026-09-08

### Changes

- Guarantee frame cleanup on callback errors; stop explicitly and allow restart.
- Keep one scheduled frame during stop/start and stop empty queues after a frame.
- Avoid collisions between generated and explicitly provided handler IDs.

### Maintenance

- Include source files and inline source maps for consumer debugging.
- Typecheck tests and verify packed exports.

## 1.0.0

### Breaking changes

- Use native ES modules; CommonJS builds are not provided.

### Changes

- Add a `debug` option and consistent `[Aion]` errors.
- Handlers removed from inside a frame are detached after the frame; a non-forced `stop()` skips the already scheduled frame.

### Maintenance

- Update the development toolchain to TypeScript 7.
