# Aion

A shared animation frame engine for browser interfaces.

## Installation

```bash
npm install @adoratorio/aion
```

## Usage

This package is ESM-only. Import it as a module:

```typescript
import Aion from '@adoratorio/aion';

const engine = new Aion();
engine.add((delta, frameId) => {
  console.log(delta, frameId);
});
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

### Handler frequency and engine state

`add(handler, id?, step = 1)` accepts an optional third argument. `step: 1` runs on every frame; `step: 2` runs when the engine's frame counter is divisible by two. The value must be finite and at least 1; fractions are rounded down. `delta` is elapsed milliseconds since the previous engine frame, even when a handler skips frames. `frameId` is the engine's zero-based frame counter.

```typescript
engine.add((delta, frameId) => {
  console.log('Every second engine frame', delta, frameId);
}, 'occasional-update', 2);
```

`add()` returns the assigned ID, or `null` for a duplicate ID. It does not start the engine. `remove(id)` and `start()`/`stop(force = false)` return `void`; `has(id)` returns a boolean. Calling `start()` on a running engine has no effect.

`stopped` initially equals `true`. `queue` exposes the registered `{ id, handler, step }` entries as a readonly array; use the engine methods to manage it. The public `frame(now)` method advances a running engine using a timestamp on the `performance.now()` clock and schedules the next frame. It does nothing while stopped or already inside a frame; normal consumers should let `start()` drive it.

## Browser Support & SSR

Aion is designed for browser environments and relies on `window.requestAnimationFrame` and `performance.now()`. Instantiating it outside of a browser environment without proper polyfills will throw an error.

## TypeScript Support

Aion is entirely written in TypeScript and exports specific types like `AionOptions`, `AionQueueObject`, and `AionHandler`.

## Compatibility

Imports are safe during server-side rendering. Create instances on the client after mounting. The package targets ES2023 and does not include polyfills.

## Callback errors and scheduling

A callback exception is propagated unchanged and stops the engine. Pending
removals are cleaned up; remove or repair the failing callback, then call
`start()` explicitly. Other callbacks are not run after the exception in that
frame. With autostop enabled, an empty queue stops at the end of the frame;
`start(); add(handler)` in the same synchronous turn remains supported.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, checks and pull requests.
Version history is documented in the [changelog](CHANGELOG.md) and [GitHub releases](https://github.com/Adoratorio/aion/releases).

## Maintainers

Maintained by [Adoratorio](https://github.com/Adoratorio).

- [Andrea Gottardi](https://github.com/AndreaGottardi)
- [Daniele Borra](https://github.com/borradaniele)
- [Andrea Biason](https://github.com/biazo5)

Contributor credits are preserved in [package.json](package.json) and the Git history.

## License

[MIT](LICENSE).
