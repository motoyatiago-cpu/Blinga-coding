import type { PetState } from "../types/pet-state";

type PetAvatarProps = {
  asset: string;
  state: PetState;
};

export function PetAvatar({ asset, state }: PetAvatarProps) {
  return (
    <span className="web-pet-visual-shell">
      <img
        className="web-pet-avatar"
        data-state={state}
        src={asset}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    </span>
  );
}
