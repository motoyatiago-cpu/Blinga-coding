"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { requestExistingAiAssistant } from "../ai-assistant-events";
import { PetActionMenu, PET_MENU_ID } from "./components/pet-action-menu";
import { PetAvatar } from "./components/pet-avatar";
import { PetSpeechBubble } from "./components/pet-speech-bubble";
import {
  getPetExpressionAsset,
  getPetPoseAsset,
} from "./config/asset-registry";
import { WEB_PET_CONFIG } from "./config/default-config";
import { PET_BUBBLE_MESSAGES } from "./config/pet-copy";
import { BehaviorDirector } from "./core/behavior-director";
import { BubbleDirector } from "./core/bubble-director";
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
  asset: getPetPoseAsset("idle"),
};
const PRIORITY_ASSETS = [
  getPetPoseAsset("idle"),
  ...Array.from(new Map(PET_EXPRESSIONS.map(({ id }) => {
    const asset = getPetExpressionAsset(id);
    return [asset.src, asset] as const;
  })).values()),
];
const DEFERRED_ASSETS = PET_ACTION_POSES.map(({ id }) => getPetPoseAsset(id));

export default function WebDesktopPet() {
  const machineRef = useRef<PetStateMachine | null>(null);
  if (!machineRef.current) machineRef.current = new PetStateMachine();

  const machine = machineRef.current;
  usePosePreload(PRIORITY_ASSETS, DEFERRED_ASSETS);
  const size = usePetSize();
  const { dragging, style, dragBindings } = usePetDrag(size);
  const draggingRef = useRef(dragging);
  draggingRef.current = dragging;
  const rootRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<PetState>(machine.state);
  const [pageHidden, setPageHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuOpenRef = useRef(menuOpen);
  menuOpenRef.current = menuOpen;
  const [bubbleMessage, setBubbleMessage] = useState<string | null>(null);
  const { current, previous, transitionTo } = useVisualTransition(
    INITIAL_FRAME,
    WEB_PET_CONFIG.frameTransitionMs,
  );
  const behaviorRef = useRef<BehaviorDirector | null>(null);
  const bubbleRef = useRef<BubbleDirector | null>(null);
  const dragMotionRef = useRef<DragMotionLoop | null>(null);
  const expressionRef = useRef<ExpressionLoop | null>(null);
  const hoveringRef = useRef(false);

  useEffect(() => machine.subscribe((nextState) => setState(nextState)), [machine]);

  const showPose = useCallback((pose: PetPose) => {
    if (document.hidden || draggingRef.current || menuOpenRef.current) return;
    transitionTo({
      key: `pose-${pose.id}`,
      poseId: pose.id,
      asset: getPetPoseAsset(pose.id),
    });
    machine.transition(pose.id);
  }, [machine, transitionTo]);

  const showExpression = useCallback((expression: PetExpression) => {
    if (document.hidden || draggingRef.current || menuOpenRef.current) return;
    transitionTo({
      key: `expression-${expression.id}`,
      poseId: "idle",
      asset: getPetExpressionAsset(expression.id),
    });
    machine.transition("idle");
  }, [machine, transitionTo]);

  const showDragPose = useCallback((pose: PetDragPose) => {
    if (document.hidden || !draggingRef.current || menuOpenRef.current) return;
    transitionTo({
      key: `drag-${pose.id}`,
      poseId: pose.id,
      asset: getPetPoseAsset(pose.id),
    });
    machine.transition("dragging");
  }, [machine, transitionTo]);

  const showMenuPose = useCallback(() => {
    if (document.hidden) return;
    transitionTo({
      key: "menu-cheer",
      poseId: "cheer",
      asset: getPetPoseAsset("cheer"),
    });
    machine.transition("menu");
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
    const bubbles = new BubbleDirector(
      PET_BUBBLE_MESSAGES,
      WEB_PET_CONFIG.bubbleFirstDelayMs,
      WEB_PET_CONFIG.bubbleDelayMinMs,
      WEB_PET_CONFIG.bubbleDelayMaxMs,
      WEB_PET_CONFIG.bubbleVisibleMs,
      setBubbleMessage,
    );
    behaviorRef.current = behavior;
    bubbleRef.current = bubbles;
    dragMotionRef.current = dragMotion;
    expressionRef.current = expressions;

    const stopEverything = () => {
      behavior.stop();
      bubbles.stop();
      dragMotion.stop();
      expressions.stop();
    };

    const syncVisibility = () => {
      const hidden = document.hidden;
      setPageHidden(hidden);
      stopEverything();
      if (hidden) return;

      if (menuOpenRef.current) {
        setBubbleMessage("需要我做什么？");
        showMenuPose();
        return;
      }

      bubbles.start();
      if (draggingRef.current) {
        machine.transition("dragging");
        dragMotion.start();
      } else if (hoveringRef.current) {
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
      stopEverything();
      behaviorRef.current = null;
      bubbleRef.current = null;
      dragMotionRef.current = null;
      expressionRef.current = null;
    };
  }, [machine, showDragPose, showExpression, showMenuPose, showPose]);

  useEffect(() => {
    behaviorRef.current?.stop();
    bubbleRef.current?.stop();
    dragMotionRef.current?.stop();
    expressionRef.current?.stop();
    if (document.hidden) return;

    if (menuOpen) {
      setBubbleMessage("需要我做什么？");
      showMenuPose();
      return;
    }

    setBubbleMessage(null);
    bubbleRef.current?.start();
    if (dragging) {
      machine.transition("dragging");
      dragMotionRef.current?.start();
    } else if (hoveringRef.current) {
      showExpression(PET_EXPRESSIONS[0]);
      expressionRef.current?.start();
    } else {
      showPose(IDLE_POSE);
      behaviorRef.current?.start();
    }
  }, [dragging, machine, menuOpen, showExpression, showMenuPose, showPose]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    dragBindings.onPointerMove(event);
    if (dragging || menuOpenRef.current || event.pointerType !== "mouse" || !hoveringRef.current) return;

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
    if (menuOpenRef.current || event.pointerType !== "mouse" || !window.matchMedia("(hover: hover)").matches) return;
    hoveringRef.current = true;
    behaviorRef.current?.stop();
    showExpression(PET_EXPRESSIONS[0]);
    expressionRef.current?.start();
  }, [showExpression]);

  const onPointerLeave = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    hoveringRef.current = false;
    event.currentTarget.style.setProperty("--look-x", "0px");
    event.currentTarget.style.setProperty("--look-y", "0px");
    event.currentTarget.style.setProperty("--look-rotate", "0deg");
    if (menuOpenRef.current) return;
    expressionRef.current?.stop();
    showPose(IDLE_POSE);
    if (!dragging && !document.hidden) behaviorRef.current?.start();
  }, [dragging, showPose]);

  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);

  const onClick = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (dragBindings.consumeClickSuppression()) {
      event.preventDefault();
      return;
    }
    toggleMenu();
  }, [dragBindings, toggleMenu]);

  const onKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleMenu();
    } else if (event.key === "Escape") {
      setMenuOpen(false);
    }
  }, [toggleMenu]);

  const openAiAssistant = useCallback(() => {
    setMenuOpen(false);
    setBubbleMessage(null);
    if (!requestExistingAiAssistant()) {
      window.location.assign("/?assistant=open");
    }
  }, []);

  return (
    <div
      ref={rootRef}
      className={`web-pet-root ${dragging ? "is-dragging" : ""}`}
      data-state={state}
      data-pose={current.poseId}
      data-menu-open={menuOpen ? "true" : "false"}
      data-paused={pageHidden ? "true" : "false"}
      style={style}
      role="button"
      tabIndex={0}
      aria-label="打开 Blinga coding 桌宠菜单"
      aria-expanded={menuOpen}
      aria-controls={PET_MENU_ID}
      aria-grabbed={dragging}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onPointerEnter={onPointerEnter}
      onPointerDown={dragBindings.onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={dragBindings.onPointerUp}
      onPointerCancel={dragBindings.onPointerCancel}
      onPointerLeave={onPointerLeave}
    >
      <PetSpeechBubble message={bubbleMessage} />
      <PetActionMenu
        open={menuOpen}
        onAskAi={openAiAssistant}
        onClose={() => setMenuOpen(false)}
      />
      <PetAvatar current={current} previous={previous} />
    </div>
  );
}
