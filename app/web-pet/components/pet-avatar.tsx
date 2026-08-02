import type { PetVisualFrame } from "../types/pet-state";
import { PetAssetMedia } from "./pet-asset-media";

type PetAvatarProps = {
  current: PetVisualFrame;
  previous: PetVisualFrame | null;
};

function PetFrame({ frame, previous = false }: { frame: PetVisualFrame; previous?: boolean }) {
  return (
    <span className={`web-pet-frame ${previous ? "is-previous" : "is-current"}`}>
      <PetAssetMedia asset={frame.asset} pose={previous ? undefined : frame.poseId} />
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
