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
  originX: number;
  originY: number;
  moved: boolean;
};

export function usePetDrag(size: number) {
  const [position, setPosition] = useState<PetPosition | null>(null);
  const [dragging, setDragging] = useState(false);
  const positionRef = useRef<PetPosition | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);
  const suppressClickRef = useRef(false);

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
      originX: event.clientX,
      originY: event.clientY,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;

    if (Math.hypot(event.clientX - session.originX, event.clientY - session.originY) > 5) {
      session.moved = true;
    }

    updatePosition(clampPetPosition({
      x: event.clientX - session.offsetX,
      y: event.clientY - session.offsetY,
    }, size));
  }, [size, updatePosition]);

  const finishDrag = useCallback((element: HTMLDivElement, pointerId: number) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== pointerId) return;

    if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId);
    suppressClickRef.current = session.moved;
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

  const consumeClickSuppression = useCallback(() => {
    const shouldSuppress = suppressClickRef.current;
    suppressClickRef.current = false;
    return shouldSuppress;
  }, []);

  return {
    dragging,
    style,
    dragBindings: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      consumeClickSuppression,
    },
  };
}
