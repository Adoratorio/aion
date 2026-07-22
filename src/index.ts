import { type AionHandler, type AionOptions, type AionQueueObject } from './types.ts';

class Aion {
  readonly #options: AionOptions;
  #lastRAFId = 0;
  #frameId = 0;
  #lastNow = 0;
  #uidCounter = 0;
  readonly #queueIds = new Set<string>();
  public stopped = true;
  public queue: readonly AionQueueObject[] = [];
  readonly #boundFrame = (now: DOMHighResTimeStamp): void => this.frame(now);

  constructor(options: Partial<AionOptions> = {}) {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame === 'undefined') {
      throw new Error('You are not using this package in browser environment');
    }

    const defaults: AionOptions = { autostop: true };
    this.#options = { ...defaults, ...options };
  }

  public start(): void {
    if (!this.stopped) {
      return;
    }
    this.stopped = false;
    this.#lastNow = performance.now();
    window.cancelAnimationFrame(this.#lastRAFId);
    this.#lastRAFId = window.requestAnimationFrame(this.#boundFrame);
  }

  public stop(force = false): void {
    if (force) {
      window.cancelAnimationFrame(this.#lastRAFId);
    }
    this.stopped = true;
  }

  public frame(now: DOMHighResTimeStamp): void {
    const delta = now - this.#lastNow;
    this.#lastNow = now;

    // Cache length and use for loop for better performance
    const len = this.queue.length;
    for (let i = 0; i < len; i++) {
      const fn = this.queue[i];
      if (fn && (fn.step === 1 || this.#frameId % fn.step === 0)) {
        fn.handler(delta, this.#frameId);
      }
    }

    this.#frameId += 1;
    if (!this.stopped) {
      this.#lastRAFId = window.requestAnimationFrame(this.#boundFrame);
    }
  }

  public add(handler: AionHandler, id?: string, step = 1): string | null {
    if (typeof handler !== 'function') {
      throw new Error('Expected function as handler');
    }
    if (typeof step !== 'number' || !Number.isFinite(step)) {
      throw new Error('Expected finite number as step');
    }
    if (step < 1) {
      throw new Error('Step must be greater than 0');
    }
    if (typeof id === 'undefined') {
      id = `h_${++this.#uidCounter}`;
    }
    if (this.#queueIds.has(id)) {
      console.warn(`Duplicated entry ${id} in queue use another id. Skipping registration.`);
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
      throw new Error('Expected id');
    }
    const index = this.queue.findIndex((object) => object.id === id);
    if (index !== -1) {
      const queue = this.queue as AionQueueObject[];
      queue.splice(index, 1);
      this.#queueIds.delete(id);
      if (this.queue.length === 0 && this.#options.autostop) {
        this.stop();
      }
    }
  }

  public has(id: string): boolean {
    return this.#queueIds.has(id);
  }
}

export type { AionHandler, AionOptions, AionQueueObject } from './types.ts';
export default Aion;
