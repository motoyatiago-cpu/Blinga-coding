"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { PetAvatar } from "./components/pet-avatar";
import { WEB_PET_CONFIG } from "./config/default-config";
import { PetStateMachine } from "./core/pet-state-machine";
import { PoseLoop } from "./core/pose-loop";
import { usePetDrag } from "./hooks/use-pet-drag";
import { usePetSize } from "./hooks/use-pet-size";
import { PET_POSES, type PetState } from "./types/pet-state";
import "./web-pet.css";

export default function WebDesktopPet() {
  const machineRef = useRef<PetStateMachine | null>(null);
  if (!machineRef.current) machineRef.current = new PetStateMachine();

  const machine = machineRef.current;
  const size = usePetSize();
  const { dragging, style, dragBindings } = usePetDrag(size);
  const [state, setState] = useState<PetState>(machine.state);
  const [poseIndex, setPoseIndex] = useState(0);
  const [pageHidden, setPageHidden] = useState(false);
  const poseLoopRef = useRef<PoseLoop | null>(null);
  const hoveringRef = useRef(false);
  const currentPose = PET_POSES[poseIndex];

  useEffect(() => machine.subscribe((nextState) => setState(nextState)), [machine]);

  useEffect(() => {
    const poseLoop = new PoseLoop(
      PET_POSES,
      WEB_PET_CONFIG.firstPoseDelayMs,
      (pose, index) => {
        if (document.hidden || machine.state === "dragging") return;
        setPoseIndex(index);
        machine.transition(pose.id);
      },
    );

    poseLoopRef.current = poseLoop;
    const syncVisibility = () => {
      setPageHidden(document.hidden);
      if (document.hidden) {
        poseLoop.stop();
      } else if (machine.state !== "dragging" && !hoveringRef.current) {
        poseLoop.start();
      }
    };

    document.addEventListener("visibilitychange", syncVisibility);
    syncVisibility();

    return () => {
      document.removeEventListener("visibilitychange", syncVisibility);
      poseLoop.stop();
      poseLoopRef.current = null;
    };
  }, [machine]);

  useEffect(() => {
    if (dragging) {
      poseLoopRef.current?.stop();
      machine.transition("dragging");
      return;
    }

    machine.transition(currentPose.id);
    if (!document.hidden && !hoveringRef.current) poseLoopRef.current?.start();
  }, [currentPose.id, dragging, machine]);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    dragBindings.onPointerMove(event);
    if (dragging) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const normalizedX = Math.max(-1, Math.min(1, (event.clientX - bounds.left - bounds.width / 2) / (bounds.width / 2)));
    const normalizedY = Math.max(-1, Math.min(1, (event.clientY - bounds.top - bounds.height / 2) / (bounds.height / 2)));
    event.currentTarget.style.setProperty("--face-x", `${normalizedX * 3}px`);
    event.currentTarget.style.setProperty("--face-y", `${normalizedY * 2}px`);
  }, [dragBindings, dragging]);

  const onPointerEnter = useCallback(() => {
    hoveringRef.current = true;
    poseLoopRef.current?.stop();
    if (!currentPose.faceInteractive) {
      setPoseIndex(0);
      machine.transition("idle");
    }
  }, [currentPose.faceInteractive, machine]);

  const onPointerLeave = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    hoveringRef.current = false;
    event.currentTarget.style.setProperty("--face-x", "0px");
    event.currentTarget.style.setProperty("--face-y", "0px");
    if (!dragging && !document.hidden) poseLoopRef.current?.start();
  }, [dragging]);

  return (
    <div
      className={`web-pet-root ${dragging ? "is-dragging" : ""}`}
      data-state={state}
      data-pose={currentPose.id}
      data-face-active={currentPose.faceInteractive ? "true" : "false"}
      data-paused={pageHidden ? "true" : "false"}
      style={style}
      role="img"
      aria-label="Blinga coding 网页桌宠，可拖动"
      aria-grabbed={dragging}
      onPointerEnter={onPointerEnter}
      onPointerDown={dragBindings.onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={dragBindings.onPointerUp}
      onPointerCancel={dragBindings.onPointerCancel}
      onPointerLeave={onPointerLeave}
    >
      <PetAvatar atlas={WEB_PET_CONFIG.poseAtlas} pose={currentPose} />
    </div>
  );
}
