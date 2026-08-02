import type { PetVisualFrame } from "../types/pet-state";

type PetAvatarProps = {
  current: PetVisualFrame;
  previous: PetVisualFrame | null;
};

function PetFrame({ frame, previous = false }: { frame: PetVisualFrame; previous?: boolean }) {
  return (
    <span className={`web-pet-frame ${previous ? "is-previous" : "is-current"}`}>
      <img
        className="web-pet-sprite"
        data-pose={previous ? undefined : frame.poseId}
        src={frame.asset}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    </span>
  );
}

export function PetAvatar({ current, previous }: PetAvatarProps) {
  return (
    <span className="web-pet-visual-shell">
      <span className="web-pet-idle-motion">
        <span className="web-pet-stage">
          {previous ? <PetFrame key={`previous-${previous.key}`} frame={previous} previous /> : null}
          <PetFrame key={`current-${current.key}`} frame={current} />
        </span>
      </span>
    </span>
  );
}
