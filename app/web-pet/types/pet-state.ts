export const PET_IDLE_ACTIONS = ["sway", "float", "jump", "look"] as const;

export type PetIdleAction = (typeof PET_IDLE_ACTIONS)[number];
export type PetState = "idle" | "dragging" | PetIdleAction;

export type PetPosition = {
  x: number;
  y: number;
};
