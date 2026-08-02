import type { PetPose } from "../types/pet-state";

export class PoseLoop {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private currentIndex = 0;
  private hasAdvanced = false;

  constructor(
    private readonly poses: readonly PetPose[],
    private readonly firstDelayMs: number,
    private readonly onPose: (pose: PetPose, index: number) => void,
  ) {}

  start() {
    if (this.timer || this.poses.length < 2) return;
    const delay = this.hasAdvanced
      ? this.poses[this.currentIndex].durationMs
      : this.firstDelayMs;
    this.schedule(delay);
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private schedule(delay: number) {
    this.timer = setTimeout(() => {
      this.timer = null;
      this.currentIndex = (this.currentIndex + 1) % this.poses.length;
      this.hasAdvanced = true;
      const pose = this.poses[this.currentIndex];
      this.onPose(pose, this.currentIndex);
      this.schedule(pose.durationMs);
    }, delay);
  }
}
