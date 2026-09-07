# Aion

A lightweight `requestAnimationFrame` (rAF) engine with a shared frame queue.

## Installation

```bash
npm install @adoratorio/aion
```

## Usage

This package is ESM-only. Import it as a module:

```typescript
import Aion from '@adoratorio/aion';

const engine = new Aion();
engine.start();
```

## Configuration

Aion accepts an `options` object with the following properties:

| Parameter | Type | Default | Description |
| :-------- | :--: | :-----: | :---------- |
| `autostop` | `boolean` | `true` | Automatically stops the engine when the frame queue is empty, preventing idle processing. |
| `debug` | `boolean` | `false` | Enable namespaced `console.warn` diagnostics for recoverable issues (contract violations always throw). |

## Methods

### Queue Management

Aion acts as a centralized engine where you can add or remove multiple callbacks that will all run synced on the same requestAnimationFrame loop.

```typescript
// Add a handler to the frame queue
// You can provide a custom ID, otherwise one is generated.
// Returns the ID (or null if the ID is a duplicate).
const myId = engine.add((delta, frameId) => {
  console.log(`Time since last frame: ${delta}ms`);
}, 'my-custom-id');

// Remove a handler from the queue by its ID.
// Removing from inside a handler is safe: the entry is detached once the
// current frame has finished, so no other handler is skipped.
engine.remove('my-custom-id');

// Check whether a handler ID is currently registered
const exists = engine.has('my-custom-id');
```

### Engine Control

```typescript
// Start the rAF loop manually
engine.start();

// Stop the rAF loop. The already scheduled frame is skipped; pass `true`
// to also cancel it right away.
engine.stop();
engine.stop(true);
```

## Browser Support & SSR

Aion is designed for browser environments and relies on `window.requestAnimationFrame` and `performance.now()`. Instantiating it outside of a browser environment without proper polyfills will throw an error.

## TypeScript Support

Aion is entirely written in TypeScript and exports specific types like `AionOptions`, `AionQueueObject`, and `AionHandler`.

## Maintenance and compatibility

See [MAINTAINERS.md](MAINTAINERS.md), [CONTRIBUTING.md](CONTRIBUTING.md) and
[CHANGELOG.md](CHANGELOG.md). Historical contributor credits are retained.
The CI runtime is Node 24; DOM instances are client-only. Imports are SSR-safe.
The runtime expects native ES2023 support; TypeScript does not provide browser
polyfills. DOM functionality uses requestAnimationFrame, Pointer/Touch Events
and observers where applicable. Test the target browser matrix before release.

A callback exception is propagated unchanged and stops the engine. Pending
removals are cleaned up; remove or repair the failing callback, then call
`start()` explicitly. Other callbacks are not run after the exception in that
frame. With autostop enabled, an empty queue stops at the end of the frame;
`start(); add(handler)` in the same synchronous turn remains supported.
