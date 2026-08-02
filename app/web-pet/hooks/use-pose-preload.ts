"use client";

import { useEffect } from "react";

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function usePosePreload(priorityPaths: readonly string[], deferredPaths: readonly string[]) {
  useEffect(() => {
    const cachedImages: HTMLImageElement[] = [];
    const preload = (paths: readonly string[]) => {
      paths.forEach((path) => {
        const image = new Image();
        image.decoding = "async";
        image.src = path;
        cachedImages.push(image);
      });
    };

    preload(priorityPaths);
    const idleWindow = window as IdleWindow;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    const idleHandle = idleWindow.requestIdleCallback?.(
      () => preload(deferredPaths),
      { timeout: 2_000 },
    );

    if (idleHandle === undefined) {
      fallbackTimer = setTimeout(() => preload(deferredPaths), 350);
    }

    return () => {
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      cachedImages.length = 0;
    };
  }, [deferredPaths, priorityPaths]);
}
