import type { CSSProperties } from "react";
import type { PetPose } from "../types/pet-state";

type PetAvatarProps = {
  atlas: string;
  pose: PetPose;
};

export function PetAvatar({ atlas, pose }: PetAvatarProps) {
  const spriteStyle: CSSProperties = {
    backgroundImage: `url(${atlas})`,
    backgroundPosition: `${pose.column * 25}% ${pose.row * (100 / 3)}%`,
  };

  return (
    <span className="web-pet-visual-shell">
      <span className="web-pet-idle-motion">
        <span
          key={pose.id}
          className="web-pet-sprite"
          data-pose={pose.id}
          style={spriteStyle}
          aria-hidden="true"
        />
      </span>
      <span className="web-pet-face-overlay" aria-hidden="true">
        <span className="web-pet-eye web-pet-eye-left"><i /></span>
        <span className="web-pet-eye web-pet-eye-right"><i /></span>
        <span className="web-pet-mouth" />
      </span>
    </span>
  );
}
