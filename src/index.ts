import { type AionHandler, type AionOptions, type AionQueueObject } from './types.ts';

class Aion {
  readonly #options: AionOptions;
  #lastRAFId = 0;
  #frameId = 0;
  #lastNow = 0;
  #uidCounter = 0;
  #inFrame = false;
  readonly #queueIds = new Set<string>();
  readonly #pendingRemovals: string[] = [];
  public stopped = true;
  public queue: readonly AionQueueObject[] = [];
  readonly #boundFrame = (now: DOMHighResTimeStamp): void => this.frame(now);

  constructor(options: Partial<AionOptions> = {}) {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame === 'undefined') {
      throw new Error('[Aion] You are not using this package in a browser environment');
    }

    const defaults: AionOptions = { autostop: true, debug: false };
    this.#options = { ...defaults, ...options };
  }

  #debugWarn(message: string): void {
    if (this.#options.debug) {
      console.warn(`[Aion] ${message}`);
    }
  }

  public start(): void {
    if (!this.stopped) {
      return;
    }
    this.stopped = false;
    this.#lastNow = performance.now();
    window.cancelAnimationFrame(this.#lastRAFId);
    if (!this.#inFrame) {
      this.#lastRAFId = window.requestAnimationFrame(this.#boundFrame);
    }
  }

  public stop(force = false): void {
    if (force) {
      window.cancelAnimationFrame(this.#lastRAFId);
    }
    this.stopped = true;
  }

  public frame(now: DOMHighResTimeStamp): void {
    if (this.stopped || this.#inFrame) {
      return;
    }
    // Also supports manually advancing a scheduled engine without a second loop.
    window.cancelAnimationFrame(this.#lastRAFId);
    const delta = now - this.#lastNow;
    this.#lastNow = now;
    this.#inFrame = true;
    try {
      const len = this.queue.length;
      for (let i = 0; i < len; i++) {
        const fn = this.queue[i];
        if (fn && (fn.step === 1 || this.#frameId % fn.step === 0)) {
          fn.handler(delta, this.#frameId);
        }
      }
    } catch (error) {
      // Preserve the original error and leave the engine explicitly restartable.
      this.stop(true);
      throw error;
    } finally {
      this.#inFrame = false;
      this.#flushRemovals();
      this.#frameId += 1;
      if (this.queue.length === 0 && this.#options.autostop) {
        this.stop(true);
      }
      if (!this.stopped) {
        this.#lastRAFId = window.requestAnimationFrame(this.#boundFrame);
      }
    }
  }

  public add(handler: AionHandler, id?: string, step = 1): string | null {
    if (typeof handler !== 'function') {
      throw new Error('[Aion] Expected function as handler');
    }
    if (typeof step !== 'number' || !Number.isFinite(step)) {
      throw new Error('[Aion] Expected finite number as step');
    }
    if (step < 1) {
      throw new Error('[Aion] Step must be greater than 0');
    }
    if (typeof id === 'undefined') {
      do {
        id = `h_${++this.#uidCounter}`;
      } while (this.#queueIds.has(id));
    }
    if (this.#queueIds.has(id)) {
      this.#debugWarn(`Duplicated entry ${id} in queue, use another id. Skipping registration.`);
      return null;
    }

    this.#queueIds.add(id);
    const queue = this.queue as AionQueueObject[];
    queue.push({
      id,
      handler,
      step: Math.floor(step),
    });
    return id;
  }

  public remove(id: string): void {
    if (typeof id === 'undefined') {
      throw new Error('[Aion] Expected id');
    }
    if (!this.#queueIds.has(id)) {
      return;
    }
    // Mark as gone right away so `has()` and re-`add()` behave consistently
    this.#queueIds.delete(id);
    if (this.#inFrame) {
      this.#pendingRemovals.push(id);
      return;
    }
    this.#detach(id);
  }

  public has(id: string): boolean {
    return this.#queueIds.has(id);
  }

  #detach(id: string): void {
    const index = this.queue.findIndex((object) => object.id === id);
    if (index === -1) {
      return;
    }
    const queue = this.queue as AionQueueObject[];
    queue.splice(index, 1);
    if (this.queue.length === 0 && this.#options.autostop) {
      this.stop();
    }
  }

  #flushRemovals(): void {
    if (this.#pendingRemovals.length === 0) {
      return;
    }
    for (const id of this.#pendingRemovals) {
      this.#detach(id);
    }
    this.#pendingRemovals.length = 0;
  }
}

export type { AionHandler, AionOptions, AionQueueObject } from './types.ts';
export default Aion;
