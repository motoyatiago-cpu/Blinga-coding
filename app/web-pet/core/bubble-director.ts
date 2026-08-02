type BubbleListener = (message: string | null) => void;
type RandomSource = () => number;

export class BubbleDirector {
  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private lastMessage = "";
  private hasStarted = false;

  constructor(
    private readonly messages: readonly string[],
    private readonly firstDelayMs: number,
    private readonly minDelayMs: number,
    private readonly maxDelayMs: number,
    private readonly visibleMs: number,
    private readonly onMessage: BubbleListener,
    private readonly random: RandomSource = Math.random,
  ) {}

  start() {
    if (this.showTimer || this.hideTimer || this.messages.length === 0) return;
    const delay = this.hasStarted ? this.randomDelay() : this.firstDelayMs;
    this.hasStarted = true;
    this.showTimer = setTimeout(() => this.show(), delay);
  }

  stop() {
    if (this.showTimer) clearTimeout(this.showTimer);
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.showTimer = null;
    this.hideTimer = null;
    this.onMessage(null);
  }

  private show() {
    this.showTimer = null;
    const candidates = this.messages.filter((message) => message !== this.lastMessage);
    const pool = candidates.length > 0 ? candidates : this.messages;
    const message = pool[Math.floor(this.random() * pool.length)];
    this.lastMessage = message;
    this.onMessage(message);
    this.hideTimer = setTimeout(() => {
      this.hideTimer = null;
      this.onMessage(null);
      this.start();
    }, this.visibleMs);
  }

  private randomDelay() {
    return Math.round(this.minDelayMs + this.random() * (this.maxDelayMs - this.minDelayMs));
  }
}
