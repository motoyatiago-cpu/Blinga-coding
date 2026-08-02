import type { PetIdleAction } from "../types/pet-state";

type IdleSchedulerOptions = {
  minDelayMs: number;
  maxDelayMs: number;
};

export class IdleScheduler {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastAction: PetIdleAction | null = null;

  constructor(
    private readonly actions: readonly PetIdleAction[],
    private readonly options: IdleSchedulerOptions,
    private readonly onAction: (action: PetIdleAction) => void,
  ) {}

  start() {
    if (this.timer || this.actions.length === 0) return;
    this.scheduleNext();
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private scheduleNext() {
    const delayRange = Math.max(0, this.options.maxDelayMs - this.options.minDelayMs);
    const delay = this.options.minDelayMs + Math.round(Math.random() * delayRange);

    this.timer = setTimeout(() => {
      this.timer = null;
      const candidates = this.actions.filter((action) => action !== this.lastAction);
      const pool = candidates.length ? candidates : this.actions;
      const action = pool[Math.floor(Math.random() * pool.length)];

      this.lastAction = action;
      this.onAction(action);
      this.scheduleNext();
    }, delay);
  }
}
