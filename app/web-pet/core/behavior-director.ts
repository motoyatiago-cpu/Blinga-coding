import type { PetPose } from "../types/pet-state";

type RandomSource = () => number;

export class BehaviorDirector {
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private actionTimer: ReturnType<typeof setTimeout> | null = null;
  private deck: PetPose[] = [];
  private lastPoseId: PetPose["id"] | null = null;
  private hasStarted = false;

  constructor(
    private readonly actions: readonly PetPose[],
    private readonly firstDelayMs: number,
    private readonly minDelayMs: number,
    private readonly maxDelayMs: number,
    private readonly onAction: (pose: PetPose) => void,
    private readonly onIdle: () => void,
    private readonly random: RandomSource = Math.random,
  ) {}

  start() {
    if (this.idleTimer || this.actionTimer || this.actions.length === 0) return;
    const delay = this.hasStarted ? this.randomDelay() : this.firstDelayMs;
    this.hasStarted = true;
    this.idleTimer = setTimeout(() => this.playNextAction(), delay);
  }

  stop() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.actionTimer) clearTimeout(this.actionTimer);
    this.idleTimer = null;
    this.actionTimer = null;
  }

  private playNextAction() {
    this.idleTimer = null;
    const pose = this.takeNextPose();
    if (!pose) return;

    this.onAction(pose);
    this.lastPoseId = pose.id;
    this.actionTimer = setTimeout(() => {
      this.actionTimer = null;
      this.onIdle();
      this.start();
    }, pose.actionDurationMs);
  }

  private takeNextPose() {
    if (this.deck.length === 0) this.deck = this.buildDeck();
    return this.deck.shift();
  }

  private buildDeck() {
    const nextDeck = this.actions.flatMap((pose) =>
      Array.from({ length: Math.max(1, pose.weight) }, () => pose),
    );

    for (let index = nextDeck.length - 1; index > 0; index -= 1) {
      const target = Math.floor(this.random() * (index + 1));
      [nextDeck[index], nextDeck[target]] = [nextDeck[target], nextDeck[index]];
    }

    if (nextDeck.length > 1 && nextDeck[0].id === this.lastPoseId) {
      const replacement = nextDeck.findIndex(({ id }) => id !== this.lastPoseId);
      [nextDeck[0], nextDeck[replacement]] = [nextDeck[replacement], nextDeck[0]];
    }

    return nextDeck;
  }

  private randomDelay() {
    return Math.round(this.minDelayMs + this.random() * (this.maxDelayMs - this.minDelayMs));
  }
}
