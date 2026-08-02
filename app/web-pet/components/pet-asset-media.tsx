"use client";

import { useEffect, useRef } from "react";
import type { PetAssetDefinition, PetPoseId } from "../types/pet-state";

type PetAssetMediaProps = {
  asset: PetAssetDefinition;
  pose?: PetPoseId;
};

function LottieMedia({ asset, pose }: PetAssetMediaProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let active = true;
    let animation: { destroy: () => void } | null = null;

    void import("lottie-web/build/player/lottie_light").then(({ default: lottie }) => {
      if (!active || !containerRef.current) return;
      animation = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: asset.loop ?? true,
        autoplay: true,
        path: asset.src,
        rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
      });
    });

    return () => {
      active = false;
      animation?.destroy();
    };
  }, [asset.loop, asset.src]);

  return (
    <span
      ref={containerRef}
      className="web-pet-sprite web-pet-lottie"
      data-pose={pose}
      aria-hidden="true"
    />
  );
}

export function PetAssetMedia({ asset, pose }: PetAssetMediaProps) {
  if (asset.format === "lottie") return <LottieMedia asset={asset} pose={pose} />;

  return (
    <img
      className="web-pet-sprite"
      data-pose={pose}
      src={asset.src}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
