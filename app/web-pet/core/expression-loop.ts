import type { PetExpression } from "../types/pet-state";

export class ExpressionLoop {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private index = 0;

  constructor(
    private readonly frames: readonly PetExpression[],
    private readonly firstDelayMs: number,
    private readonly onFrame: (frame: PetExpression) => void,
  ) {}

  start() {
    if (this.timer || this.frames.length < 2) return;
    this.schedule(this.firstDelayMs);
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.index = 0;
  }

  private schedule(delayMs: number) {
    this.timer = setTimeout(() => {
      this.timer = null;
      this.index = (this.index + 1) % this.frames.length;
      const frame = this.frames[this.index];
      this.onFrame(frame);
      this.schedule(frame.holdMs);
    }, delayMs);
  }
}
