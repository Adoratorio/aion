interface AionQueueObject {
  readonly id: string;
  readonly handler: (delta: number, frameId: number) => void;
  readonly step: number;
}

interface AionOptions {
  readonly autostop: boolean;
}

class Aion {
  private readonly options: AionOptions;
  private lastRAFId: number = 0;
  private frameId: number = 0;
  private lastNow: number = 0;
  private uidCounter: number = 0;
  private readonly queueIds: Set<string> = new Set();
  public stopped: boolean = true;
  public queue: readonly AionQueueObject[] = [];

  constructor(options: Partial<AionOptions>) {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame === 'undefined') {
      throw new Error("You are not using this package in browser environment");
    }

    const defaults: AionOptions = { autostop: true };
    this.options = { ...defaults, ...options };
  }

  start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    this.lastNow = performance.now();
    this.lastRAFId = window.requestAnimationFrame((now) => this.frame(now));
  }

  stop(force = false): void {
    if (force) {
      window.cancelAnimationFrame(this.lastRAFId);
    }
    this.stopped = true;
  }

  frame(now: DOMHighResTimeStamp): void {
    const delta = now - this.lastNow;
    this.lastNow = now;

    // Cache length and use for loop for better performance
    const len = this.queue.length;
    for (let i = 0; i < len; i++) {
      const fn = this.queue[i];
      if (!fn || typeof fn.handler !== 'function') continue;
      if (fn.step === 1 || this.frameId % fn.step === 0) {
        fn.handler(delta, this.frameId);
      }
    }
    
    this.frameId += 1;
    if (!this.stopped) {
      this.lastRAFId = window.requestAnimationFrame((now) => this.frame(now));
    }
  }

  add(handler: (delta: number, frameId: number) => void, id?: string, step: number = 1): string | null {
    if (typeof handler !== 'function') throw new Error("Expected function as handler");
    if (typeof step !== 'number') throw new Error("Expected number as step");
    if (step < 1) throw new Error("Step must be greater than 0");
    if (typeof id === 'undefined') id = `h_${++this.uidCounter}`;
    if (this.queueIds.has(id)) {
      console.warn(`Duplicated entry ${id} in queue use another id. Skipping registration.`);
      return null;
    }
    
    this.queueIds.add(id);
    const queue = this.queue as AionQueueObject[];
    queue.push({
      id,
      handler,
      step: Math.floor(step),
    });
    return id;
  }

  remove(id: string): void {
    if (typeof id === 'undefined') throw new Error("Expected id");
    const index = this.queue.findIndex(object => object.id === id);
    if (index >= 0) {
      const queue = this.queue as AionQueueObject[];
      queue.splice(index, 1);
      this.queueIds.delete(id);
      if (this.queue.length === 0 && this.options.autostop) this.stop();
    }
  }

  has(id: string): boolean {
    return this.queueIds.has(id);
  }
}

export default Aion;
