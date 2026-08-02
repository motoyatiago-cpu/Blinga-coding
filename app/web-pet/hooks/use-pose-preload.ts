"use client";

import { useEffect } from "react";
import type { PetPose } from "../types/pet-state";

export function usePosePreload(basePath: string, poses: readonly PetPose[]) {
  useEffect(() => {
    const cachedImages = poses.map(({ id }) => {
      const image = new Image();
      image.decoding = "async";
      image.src = `${basePath}/${id}.webp`;
      return image;
    });

    return () => {
      cachedImages.length = 0;
    };
  }, [basePath, poses]);
}
