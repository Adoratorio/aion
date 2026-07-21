export type AionHandler = (delta: number, frameId: number) => void;

export interface AionQueueObject {
  readonly id: string;
  readonly handler: AionHandler;
  readonly step: number;
}

export interface AionOptions {
  readonly autostop: boolean;
  readonly debug: boolean;
}
