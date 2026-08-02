"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import {
  clampPetPosition,
  loadPetPosition,
  savePetPosition,
} from "../core/position-manager";
import type { PetPosition } from "../types/pet-state";

type DragSession = {
  pointerId: number;
  offsetX: number;
  offsetY: number;
};

export function usePetDrag(size: number) {
  const [position, setPosition] = useState<PetPosition | null>(null);
  const [dragging, setDragging] = useState(false);
  const positionRef = useRef<PetPosition | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);

  const updatePosition = useCallback((nextPosition: PetPosition) => {
    positionRef.current = nextPosition;
    setPosition(nextPosition);
  }, []);

  useEffect(() => {
    updatePosition(loadPetPosition(size));

    const keepInsideViewport = () => {
      const current = positionRef.current ?? loadPetPosition(size);
      const next = clampPetPosition(current, size);
      updatePosition(next);
      savePetPosition(next);
    };

    window.addEventListener("resize", keepInsideViewport, { passive: true });
    return () => window.removeEventListener("resize", keepInsideViewport);
  }, [size, updatePosition]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    dragSessionRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;

    updatePosition(clampPetPosition({
      x: event.clientX - session.offsetX,
      y: event.clientY - session.offsetY,
    }, size));
  }, [size, updatePosition]);

  const finishDrag = useCallback((element: HTMLDivElement, pointerId: number) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== pointerId) return;

    if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId);
    dragSessionRef.current = null;
    setDragging(false);
    if (positionRef.current) savePetPosition(positionRef.current);
  }, []);

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    finishDrag(event.currentTarget, event.pointerId);
  }, [finishDrag]);

  const onPointerCancel = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    finishDrag(event.currentTarget, event.pointerId);
  }, [finishDrag]);

  const style: CSSProperties | undefined = position
    ? { left: position.x, top: position.y, right: "auto", bottom: "auto" }
    : undefined;

  return {
    dragging,
    style,
    dragBindings: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}
