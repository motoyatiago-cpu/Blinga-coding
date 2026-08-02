"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { PetAvatar } from "./components/pet-avatar";
import { WEB_PET_CONFIG } from "./config/default-config";
import { PetStateMachine } from "./core/pet-state-machine";
import { PoseLoop } from "./core/pose-loop";
import { usePetDrag } from "./hooks/use-pet-drag";
import { usePosePreload } from "./hooks/use-pose-preload";
import { usePetSize } from "./hooks/use-pet-size";
import { PET_HOVER_POSES, PET_POSES, type PetPose, type PetState } from "./types/pet-state";
import "./web-pet.css";

export default function WebDesktopPet() {
  const machineRef = useRef<PetStateMachine | null>(null);
  if (!machineRef.current) machineRef.current = new PetStateMachine();

  const machine = machineRef.current;
  usePosePreload(WEB_PET_CONFIG.poseBasePath, PET_POSES);
  const size = usePetSize();
  const { dragging, style, dragBindings } = usePetDrag(size);
  const [state, setState] = useState<PetState>(machine.state);
  const [poseIndex, setPoseIndex] = useState(0);
  const [pageHidden, setPageHidden] = useState(false);
  const poseLoopRef = useRef<PoseLoop | null>(null);
  const hoverLoopRef = useRef<PoseLoop | null>(null);
  const hoveringRef = useRef(false);
  const currentPose = PET_POSES[poseIndex];

  useEffect(() => machine.subscribe((nextState) => setState(nextState)), [machine]);

  useEffect(() => {
    const showPose = (pose: PetPose) => {
      const index = PET_POSES.findIndex(({ id }) => id === pose.id);
      if (index < 0 || document.hidden || machine.state === "dragging") return;
      setPoseIndex(index);
      machine.transition(pose.id);
    };

    const poseLoop = new PoseLoop(
      PET_POSES,
      WEB_PET_CONFIG.firstPoseDelayMs,
      (pose) => showPose(pose),
    );
    const hoverLoop = new PoseLoop(
      PET_HOVER_POSES,
      WEB_PET_CONFIG.hoverPoseDelayMs,
      (pose) => showPose(pose),
      WEB_PET_CONFIG.hoverPoseIntervalMs,
    );

    poseLoopRef.current = poseLoop;
    hoverLoopRef.current = hoverLoop;
    const syncVisibility = () => {
      setPageHidden(document.hidden);
      if (document.hidden) {
        poseLoop.stop();
        hoverLoop.stop();
      } else if (machine.state !== "dragging" && hoveringRef.current) {
        hoverLoop.start();
      } else if (machine.state !== "dragging") {
        poseLoop.start();
      }
    };

    document.addEventListener("visibilitychange", syncVisibility);
    syncVisibility();

    return () => {
      document.removeEventListener("visibilitychange", syncVisibility);
      poseLoop.stop();
      hoverLoop.stop();
      poseLoopRef.current = null;
      hoverLoopRef.current = null;
    };
  }, [machine]);

  useEffect(() => {
    if (dragging) {
      poseLoopRef.current?.stop();
      hoverLoopRef.current?.stop();
      machine.transition("dragging");
      return;
    }

    machine.transition(currentPose.id);
    if (document.hidden) return;
    if (hoveringRef.current) hoverLoopRef.current?.start();
    else poseLoopRef.current?.start();
  }, [currentPose.id, dragging, machine]);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    dragBindings.onPointerMove(event);
    if (dragging) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const normalizedX = Math.max(-1, Math.min(1, (event.clientX - bounds.left - bounds.width / 2) / (bounds.width / 2)));
    const normalizedY = Math.max(-1, Math.min(1, (event.clientY - bounds.top - bounds.height / 2) / (bounds.height / 2)));
    event.currentTarget.style.setProperty("--look-x", `${normalizedX * 3}px`);
    event.currentTarget.style.setProperty("--look-y", `${normalizedY * 2}px`);
    event.currentTarget.style.setProperty("--look-rotate", `${normalizedX * 2.2}deg`);
  }, [dragBindings, dragging]);

  const onPointerEnter = useCallback(() => {
    hoveringRef.current = true;
    poseLoopRef.current?.stop();
    setPoseIndex(0);
    machine.transition("idle");
    hoverLoopRef.current?.start();
  }, [machine]);

  const onPointerLeave = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    hoveringRef.current = false;
    event.currentTarget.style.setProperty("--look-x", "0px");
    event.currentTarget.style.setProperty("--look-y", "0px");
    event.currentTarget.style.setProperty("--look-rotate", "0deg");
    hoverLoopRef.current?.stop();

    const normalPose = poseLoopRef.current?.pose;
    if (normalPose) {
      const normalIndex = PET_POSES.findIndex(({ id }) => id === normalPose.id);
      setPoseIndex(normalIndex);
      machine.transition(normalPose.id);
    }
    if (!dragging && !document.hidden) poseLoopRef.current?.start();
  }, [dragging, machine]);

  return (
    <div
      className={`web-pet-root ${dragging ? "is-dragging" : ""}`}
      data-state={state}
      data-pose={currentPose.id}
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
      <PetAvatar basePath={WEB_PET_CONFIG.poseBasePath} pose={currentPose} />
    </div>
  );
}
