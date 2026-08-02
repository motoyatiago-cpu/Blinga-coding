"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PetVisualFrame } from "../types/pet-state";

type VisualLayers = {
  current: PetVisualFrame;
  previous: PetVisualFrame | null;
};

export function useVisualTransition(initialFrame: PetVisualFrame, durationMs: number) {
  const currentRef = useRef(initialFrame);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [layers, setLayers] = useState<VisualLayers>({
    current: initialFrame,
    previous: null,
  });

  const transitionTo = useCallback((nextFrame: PetVisualFrame) => {
    if (currentRef.current.key === nextFrame.key) return;
    const previous = currentRef.current;
    currentRef.current = nextFrame;

    if (timerRef.current) clearTimeout(timerRef.current);
    setLayers({ current: nextFrame, previous });
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setLayers((current) => ({ ...current, previous: null }));
    }, durationMs);
  }, [durationMs]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { ...layers, transitionTo };
}
