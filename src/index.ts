interface QueueObject {
  id : string;
  handler : Function;
  isHeavy : boolean;
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
  public queue : Array<QueueObject> = [];

  constructor(options : Partial<AionOptions>) {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame === 'undefined') {
      throw new Error("You are not using this package in browser environment");
    }

    const defaults : AionOptions = { autostop: true };
    this.options = { ...defaults, ...options };
  }

  start() {
    if (!this.stopped) return;
    this.stopped = false;
    this.lastNow = performance.now();
    this.lastRAFId = window.requestAnimationFrame(this.frame.bind(this));
  }

  stop(force = false) {
    if (force) {
      window.cancelAnimationFrame(this.lastRAFId);
    }
    this.stopped = true;
  }

  frame(now : DOMHighResTimeStamp) {
    const delta = now - this.lastNow;
    this.lastNow = now;

    // Process the que for this frame
    this.queue.forEach((fn) => {
      if (!fn.isHeavy) {
        fn.handler(delta, this.frameId);
      } else if (this.frameId % 2 === 0) {
        fn.handler(delta, this.frameId);
      }
    });
    this.frameId += 1;
    // Continue the loop if it has not already been interrupted
    if (!this.stopped) {
      this.lastRAFId = window.requestAnimationFrame(this.frame.bind(this));
    }
  }

  add(handler : Function, id? : string, isHeavy : boolean = false) {
    if (typeof handler !== 'function') throw new Error("Expected function as handler");
    if (typeof id === 'undefined') id = `h_${++this.uidCounter}`;
    if (this.queue.find((object : QueueObject) => object.id === id)) {
      throw new Error(`Dupicated entry ${id} in quee use another id`);
    }
    this.queue.push({
      id,
      handler,
      isHeavy,
    });
    return id;
  }

  remove(id : string) {
    if (typeof id === 'undefined') throw new Error("Expected id");
    const index = this.queue.findIndex((object : QueueObject) => object.id === id);
    if (index < 0) return;
    else this.queue.splice(index, 1);
    if (this.queue.length <= 0 && this.options.autostop) this.stop();
  }
}

export default Aion;
