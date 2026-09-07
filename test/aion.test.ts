// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Aion from '../src/index.ts';

// Deterministic rAF: frames run only when `tick()` is called
let scheduled: { id: number; cb: FrameRequestCallback }[] = [];
let rafId = 0;
let now = 0;

function tick(delta = 16): void {
  now += delta;
  const batch = scheduled;
  scheduled = [];
  batch.forEach(({ cb }) => cb(now));
}

beforeEach(() => {
  scheduled = [];
  rafId = 0;
  now = 1000;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafId += 1;
    scheduled.push({ id: rafId, cb });
    return rafId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    scheduled = scheduled.filter((entry) => entry.id !== id);
  });
  window.requestAnimationFrame = globalThis.requestAnimationFrame;
  window.cancelAnimationFrame = globalThis.cancelAnimationFrame;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
});

describe('Aion', () => {
  it('runs handlers every frame with the frame delta', () => {
    const engine = new Aion();
    const handler = vi.fn();
    engine.add(handler, 'a');
    engine.start();

    tick(16);
    tick(20);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenNthCalledWith(1, 16, 0);
    expect(handler).toHaveBeenNthCalledWith(2, 20, 1);
  });

  it('honours the step', () => {
    const engine = new Aion();
    const handler = vi.fn();
    engine.add(handler, 'a', 3);
    engine.start();

    for (let i = 0; i < 7; i++) {
      tick();
    }

    // frames 0, 3, 6
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it('does not skip the next handler when one removes itself mid-frame', () => {
    const engine = new Aion({ autostop: false });
    const calls: string[] = [];
    engine.add(() => {
      calls.push('first');
      engine.remove('first');
    }, 'first');
    engine.add(() => calls.push('second'), 'second');
    engine.start();

    tick();

    expect(calls).toEqual(['first', 'second']);
    expect(engine.has('first')).toBe(false);
    expect(engine.queue.map((entry) => entry.id)).toEqual(['second']);

    tick();
    expect(calls).toEqual(['first', 'second', 'second']);
  });

  it('runs a handler added mid-frame from the next frame on', () => {
    const engine = new Aion({ autostop: false });
    const late = vi.fn();
    engine.add(() => {
      if (!engine.has('late')) {
        engine.add(late, 'late');
      }
    }, 'adder');
    engine.start();

    tick();
    expect(late).not.toHaveBeenCalled();
    tick();
    expect(late).toHaveBeenCalledTimes(1);
  });

  it('skips the already scheduled frame after stop()', () => {
    const engine = new Aion();
    const handler = vi.fn();
    engine.add(handler, 'a');
    engine.start();
    engine.stop();

    tick();

    expect(handler).not.toHaveBeenCalled();
    expect(engine.stopped).toBe(true);
  });

  it('stops automatically once the queue is empty', () => {
    const engine = new Aion();
    engine.add(() => {}, 'a');
    engine.start();
    expect(engine.stopped).toBe(false);

    engine.remove('a');
    expect(engine.stopped).toBe(true);
  });

  it('refuses duplicated ids and validates the input', () => {
    const engine = new Aion();
    expect(engine.add(() => {}, 'a')).toBe('a');
    expect(engine.add(() => {}, 'a')).toBeNull();
    expect(engine.add(() => {})).toMatch(/^h_\d+$/);
    expect(() => engine.add(() => {}, 'b', 0)).toThrow('[Aion] Step must be greater than 0');
    expect(() => engine.add('nope' as unknown as () => void)).toThrow('[Aion] Expected function');
  });

  it('throws outside of a browser environment', () => {
    const original = window.requestAnimationFrame;
    // @ts-expect-error simulate a missing rAF
    window.requestAnimationFrame = undefined;
    expect(() => new Aion()).toThrow('[Aion] You are not using this package in a browser');
    window.requestAnimationFrame = original;
  });
});

describe('Aion lifecycle regressions', () => {
  it('propagates callback errors and can restart after removing the failing callback', () => {
    const engine = new Aion();
    const error = new Error('consumer failed');
    const healthy = vi.fn();
    engine.add(() => {
      throw error;
    }, 'bad');
    engine.add(healthy, 'good');
    engine.start();
    expect(() => tick()).toThrow(error);
    expect(engine.stopped).toBe(true);
    engine.remove('bad');
    expect(engine.queue.map((entry) => entry.id)).toEqual(['good']);
    engine.start();
    tick();
    expect(healthy).toHaveBeenCalledTimes(1);
  });

  it('keeps one scheduled frame after stop/start from a callback', () => {
    const engine = new Aion();
    const handler = vi.fn(() => {
      engine.stop();
      engine.start();
    });
    engine.add(handler);
    engine.start();
    tick();
    expect(scheduled).toHaveLength(1);
    tick();
    expect(handler).toHaveBeenCalledTimes(2);
    expect(scheduled).toHaveLength(1);
  });

  it('stops an empty engine after its first frame, allowing synchronous registration', () => {
    const empty = new Aion();
    empty.start();
    tick();
    expect(empty.stopped).toBe(true);
    expect(scheduled).toHaveLength(0);
    const engine = new Aion();
    engine.start();
    const handler = vi.fn();
    engine.add(handler);
    tick();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not collide with user-supplied generated-looking ids', () => {
    const engine = new Aion();
    engine.add(() => {}, 'h_1');
    expect(engine.add(() => {})).toBe('h_2');
  });
});
