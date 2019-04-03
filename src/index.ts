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
  private frameHandler : FrameRequestCallback;
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

    this.frameHandler = () => this.frame();
  }

  start() {
    this.stopped = false;
    this.lastNow = performance.now();
    this.lastRAFId = window.requestAnimationFrame(this.frameHandler);
  }

  stop(force = false) {
    if (force) {
      window.cancelAnimationFrame(this.lastRAFId);
    }
    this.stopped = true;
  }

  frame() {
    // Get the distance between this execution and the last
    const now = performance.now();
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
    // Continus the loop if not already stopped
    if (!this.stopped) {
      this.lastRAFId = window.requestAnimationFrame(this.frameHandler);
    }
  }

  add(handler : Function, id? : string, isHeavy : boolean = false) {
    if (typeof handler !== 'function') throw new Error("Expected function as handler");
    if (typeof id === 'undefined') id = `h_${++this.uidCounter}`;
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