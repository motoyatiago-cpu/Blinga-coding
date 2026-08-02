"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { PetAvatar } from "./components/pet-avatar";
import { WEB_PET_CONFIG } from "./config/default-config";
import { BehaviorDirector } from "./core/behavior-director";
import { DragMotionLoop } from "./core/drag-motion-loop";
import { ExpressionLoop } from "./core/expression-loop";
import { PetStateMachine } from "./core/pet-state-machine";
import { usePetDrag } from "./hooks/use-pet-drag";
import { usePosePreload } from "./hooks/use-pose-preload";
import { usePetSize } from "./hooks/use-pet-size";
import { useVisualTransition } from "./hooks/use-visual-transition";
import {
  PET_ACTION_POSES,
  PET_DRAG_POSES,
  PET_EXPRESSIONS,
  PET_POSES,
  type PetDragPose,
  type PetExpression,
  type PetPose,
  type PetState,
  type PetVisualFrame,
} from "./types/pet-state";
import "./web-pet.css";

const IDLE_POSE = PET_POSES[0];
const INITIAL_FRAME: PetVisualFrame = {
  key: "pose-idle",
  poseId: "idle",
  asset: `${WEB_PET_CONFIG.poseBasePath}/idle.webp`,
};
const PRIORITY_IMAGES = [
  `${WEB_PET_CONFIG.poseBasePath}/idle.webp`,
  ...Array.from(new Set(PET_EXPRESSIONS.map(({ id }) =>
    `${WEB_PET_CONFIG.expressionBasePath}/${id}.webp`,
  ))),
];
const DEFERRED_IMAGES = PET_ACTION_POSES.map(({ id }) =>
  `${WEB_PET_CONFIG.poseBasePath}/${id}.webp`,
);

export default function WebDesktopPet() {
  const machineRef = useRef<PetStateMachine | null>(null);
  if (!machineRef.current) machineRef.current = new PetStateMachine();

  const machine = machineRef.current;
  usePosePreload(PRIORITY_IMAGES, DEFERRED_IMAGES);
  const size = usePetSize();
  const { dragging, style, dragBindings } = usePetDrag(size);
  const draggingRef = useRef(dragging);
  draggingRef.current = dragging;
  const [state, setState] = useState<PetState>(machine.state);
  const [pageHidden, setPageHidden] = useState(false);
  const { current, previous, transitionTo } = useVisualTransition(
    INITIAL_FRAME,
    WEB_PET_CONFIG.frameTransitionMs,
  );
  const behaviorRef = useRef<BehaviorDirector | null>(null);
  const dragMotionRef = useRef<DragMotionLoop | null>(null);
  const expressionRef = useRef<ExpressionLoop | null>(null);
  const hoveringRef = useRef(false);

  useEffect(() => machine.subscribe((nextState) => setState(nextState)), [machine]);

  const showPose = useCallback((pose: PetPose) => {
    if (document.hidden || draggingRef.current) return;
    transitionTo({
      key: `pose-${pose.id}`,
      poseId: pose.id,
      asset: `${WEB_PET_CONFIG.poseBasePath}/${pose.id}.webp`,
    });
    machine.transition(pose.id);
  }, [machine, transitionTo]);

  const showExpression = useCallback((expression: PetExpression) => {
    if (document.hidden || draggingRef.current) return;
    transitionTo({
      key: `expression-${expression.id}`,
      poseId: "idle",
      asset: `${WEB_PET_CONFIG.expressionBasePath}/${expression.id}.webp`,
    });
    machine.transition("idle");
  }, [machine, transitionTo]);

  const showDragPose = useCallback((pose: PetDragPose) => {
    if (document.hidden || !draggingRef.current) return;
    transitionTo({
      key: `drag-${pose.id}`,
      poseId: pose.id,
      asset: `${WEB_PET_CONFIG.poseBasePath}/${pose.id}.webp`,
    });
    machine.transition("dragging");
  }, [machine, transitionTo]);

  useEffect(() => {
    const behavior = new BehaviorDirector(
      PET_ACTION_POSES,
      WEB_PET_CONFIG.firstActionDelayMs,
      WEB_PET_CONFIG.actionDelayMinMs,
      WEB_PET_CONFIG.actionDelayMaxMs,
      showPose,
      () => showPose(IDLE_POSE),
    );
    const expressions = new ExpressionLoop(
      PET_EXPRESSIONS,
      WEB_PET_CONFIG.expressionFirstDelayMs,
      showExpression,
    );
    const dragMotion = new DragMotionLoop(PET_DRAG_POSES, showDragPose);
    behaviorRef.current = behavior;
    dragMotionRef.current = dragMotion;
    expressionRef.current = expressions;

    const syncVisibility = () => {
      const hidden = document.hidden;
      setPageHidden(hidden);
      behavior.stop();
      dragMotion.stop();
      expressions.stop();
      if (hidden) return;

      if (draggingRef.current) {
        machine.transition("dragging");
        dragMotion.start();
        return;
      }

      if (hoveringRef.current) {
        showExpression(PET_EXPRESSIONS[0]);
        expressions.start();
      } else {
        showPose(IDLE_POSE);
        behavior.start();
      }
    };

    document.addEventListener("visibilitychange", syncVisibility);
    syncVisibility();

    return () => {
      document.removeEventListener("visibilitychange", syncVisibility);
      behavior.stop();
      dragMotion.stop();
      expressions.stop();
      behaviorRef.current = null;
      dragMotionRef.current = null;
      expressionRef.current = null;
    };
  }, [machine, showDragPose, showExpression, showPose]);

  useEffect(() => {
    behaviorRef.current?.stop();
    dragMotionRef.current?.stop();
    expressionRef.current?.stop();
    if (dragging) {
      machine.transition("dragging");
      dragMotionRef.current?.start();
      return;
    }
    if (document.hidden) return;

    if (hoveringRef.current) {
      showExpression(PET_EXPRESSIONS[0]);
      expressionRef.current?.start();
    } else {
      showPose(IDLE_POSE);
      behaviorRef.current?.start();
    }
  }, [dragging, machine, showExpression, showPose]);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    dragBindings.onPointerMove(event);
    if (dragging || event.pointerType !== "mouse" || !hoveringRef.current) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const normalizedX = Math.max(-1, Math.min(1,
      (event.clientX - bounds.left - bounds.width / 2) / (bounds.width / 2),
    ));
    const normalizedY = Math.max(-1, Math.min(1,
      (event.clientY - bounds.top - bounds.height / 2) / (bounds.height / 2),
    ));
    event.currentTarget.style.setProperty("--look-x", `${normalizedX * 3}px`);
    event.currentTarget.style.setProperty("--look-y", `${normalizedY * 2}px`);
    event.currentTarget.style.setProperty("--look-rotate", `${normalizedX * 2.2}deg`);
  }, [dragBindings, dragging]);

  const onPointerEnter = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !window.matchMedia("(hover: hover)").matches) return;
    hoveringRef.current = true;
    behaviorRef.current?.stop();
    showExpression(PET_EXPRESSIONS[0]);
    expressionRef.current?.start();
  }, [showExpression]);

  const onPointerLeave = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!hoveringRef.current) return;
    hoveringRef.current = false;
    event.currentTarget.style.setProperty("--look-x", "0px");
    event.currentTarget.style.setProperty("--look-y", "0px");
    event.currentTarget.style.setProperty("--look-rotate", "0deg");
    expressionRef.current?.stop();
    showPose(IDLE_POSE);
    if (!dragging && !document.hidden) behaviorRef.current?.start();
  }, [dragging, showPose]);

  return (
    <div
      className={`web-pet-root ${dragging ? "is-dragging" : ""}`}
      data-state={state}
      data-pose={current.poseId}
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
      <PetAvatar current={current} previous={previous} />
    </div>
  );
}
