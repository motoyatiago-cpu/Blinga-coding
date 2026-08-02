"use client";

import { useEffect } from "react";
import type { PetAssetDefinition } from "../types/pet-state";

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function usePosePreload(
  priorityAssets: readonly PetAssetDefinition[],
  deferredAssets: readonly PetAssetDefinition[],
) {
  useEffect(() => {
    const cachedImages: HTMLImageElement[] = [];
    const abortController = new AbortController();
    const preload = (assets: readonly PetAssetDefinition[]) => {
      assets.forEach((asset) => {
        if (asset.format === "lottie") {
          void fetch(asset.src, {
            cache: "force-cache",
            signal: abortController.signal,
          }).catch(() => undefined);
          return;
        }

        const image = new Image();
        image.decoding = "async";
        image.src = asset.src;
        cachedImages.push(image);
      });
    };

    preload(priorityAssets);
    const idleWindow = window as IdleWindow;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    const idleHandle = idleWindow.requestIdleCallback?.(
      () => preload(deferredAssets),
      { timeout: 2_000 },
    );

    if (idleHandle === undefined) {
      fallbackTimer = setTimeout(() => preload(deferredAssets), 350);
    }

    return () => {
      abortController.abort();
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      cachedImages.length = 0;
    };
  }, [deferredAssets, priorityAssets]);
}
