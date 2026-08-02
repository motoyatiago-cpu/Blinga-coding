import type { PetPose } from "../types/pet-state";

type PetAvatarProps = {
  basePath: string;
  pose: PetPose;
};

export function PetAvatar({ basePath, pose }: PetAvatarProps) {
  return (
    <span className="web-pet-visual-shell">
      <span className="web-pet-idle-motion">
        <img
          key={pose.id}
          className="web-pet-sprite"
          data-pose={pose.id}
          src={`${basePath}/${pose.id}.webp`}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      </span>
    </span>
  );
}
