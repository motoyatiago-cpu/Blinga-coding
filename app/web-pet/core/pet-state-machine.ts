import type { PetState } from "../types/pet-state";

type PetStateListener = (state: PetState, previous: PetState) => void;

export class PetStateMachine {
  private currentState: PetState = "idle";
  private readonly listeners = new Set<PetStateListener>();

  get state() {
    return this.currentState;
  }

  transition(nextState: PetState) {
    if (nextState === this.currentState) return false;

    const previousState = this.currentState;
    this.currentState = nextState;
    this.listeners.forEach((listener) => listener(nextState, previousState));
    return true;
  }

  subscribe(listener: PetStateListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
