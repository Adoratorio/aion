interface AionQueueObject {
  id : string;
  handler : Function;
  step : number;
};

interface AionOptions {
  autostop : boolean,
};

class Aion {
  private options : AionOptions;
  private lastRAFId : number = 0;
  private frameId : number = 0;
  private lastNow : number = 0;
  private uidCounter : number = 0;
  public stopped : boolean = true;
  public queue : Array<AionQueueObject> = [];

  constructor(options : Partial<AionOptions>) {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame === 'undefined') {
      throw new Error("You are not using this package in browser environment");
    }

    const defaults : AionOptions = { autostop: true };
    this.options = { ...defaults, ...options };
  }

  start() : void {
    if (!this.stopped) return;
    this.stopped = false;
    this.lastNow = performance.now();
    this.lastRAFId = window.requestAnimationFrame(this.frame.bind(this));
  }

  stop(force = false) : void {
    if (force) {
      window.cancelAnimationFrame(this.lastRAFId);
    }
    this.stopped = true;
  }

  frame(now : DOMHighResTimeStamp) : void {
    const delta = now - this.lastNow;
    this.lastNow = now;

    // Process the que for this frame
    this.queue.forEach((fn) => {
      if (fn.step === 1) {
        fn.handler(delta, this.frameId);
      } else if (this.frameId % fn.step === 0) {
        fn.handler(delta, this.frameId);
      }
    });
    this.frameId += 1;
    // Continue the loop if it has not already been interrupted
    if (!this.stopped) {
      this.lastRAFId = window.requestAnimationFrame(this.frame.bind(this));
    }
  }

  add(handler : Function, id? : string, step : number = 1) : string | null {
    if (typeof handler !== 'function') throw new Error("Expected function as handler");
    if (typeof id === 'undefined') id = `h_${++this.uidCounter}`;
    if (this.queue.find((object : AionQueueObject) => object.id === id)) {
      console.warn(`Dupicated entry ${id} in quee use another id. Skipping registration.`);
      return null;
    }
    this.queue.push({
      id,
      handler,
      step,
    });
    return id;
  }

  remove(id : string) : void {
    if (typeof id === 'undefined') throw new Error("Expected id");
    const index = this.queue.findIndex((object : AionQueueObject) => object.id === id);
    if (index < 0) return;
    else this.queue.splice(index, 1);
    if (this.queue.length <= 0 && this.options.autostop) this.stop();
  }

  has(id : string) : boolean {
    return this.queue.findIndex((object : AionQueueObject) => object.id === id) ? true : false;
  }
}

export default Aion;
