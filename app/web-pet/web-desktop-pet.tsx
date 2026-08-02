"use client";

import { useEffect, useRef, useState } from "react";
import { PetAvatar } from "./components/pet-avatar";
import { WEB_PET_CONFIG } from "./config/default-config";
import { IdleScheduler } from "./core/idle-scheduler";
import { PetStateMachine } from "./core/pet-state-machine";
import { usePetDrag } from "./hooks/use-pet-drag";
import { usePetSize } from "./hooks/use-pet-size";
import { PET_IDLE_ACTIONS, type PetState } from "./types/pet-state";
import "./web-pet.css";

export default function WebDesktopPet() {
  const machineRef = useRef<PetStateMachine | null>(null);
  if (!machineRef.current) machineRef.current = new PetStateMachine();

  const machine = machineRef.current;
  const size = usePetSize();
  const { dragging, style, dragBindings } = usePetDrag(size);
  const [state, setState] = useState<PetState>(machine.state);
  const [pageHidden, setPageHidden] = useState(false);
  const schedulerRef = useRef<IdleScheduler | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => machine.subscribe((nextState) => setState(nextState)), [machine]);

  useEffect(() => {
    const scheduler = new IdleScheduler(
      PET_IDLE_ACTIONS,
      {
        initialDelayMs: WEB_PET_CONFIG.firstIdleActionDelayMs,
        minDelayMs: WEB_PET_CONFIG.idleDelayMinMs,
        maxDelayMs: WEB_PET_CONFIG.idleDelayMaxMs,
      },
      (action) => {
        if (document.hidden || machine.state === "dragging") return;
        machine.transition(action);
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(
          () => machine.transition("idle"),
          WEB_PET_CONFIG.idleActionDurationMs,
        );
      },
    );

    schedulerRef.current = scheduler;
    const syncVisibility = () => {
      setPageHidden(document.hidden);
      if (document.hidden) {
        scheduler.stop();
        machine.transition("idle");
      } else if (machine.state !== "dragging") {
        scheduler.start();
      }
    };

    document.addEventListener("visibilitychange", syncVisibility);
    syncVisibility();

    return () => {
      document.removeEventListener("visibilitychange", syncVisibility);
      scheduler.stop();
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      schedulerRef.current = null;
    };
  }, [machine]);

  useEffect(() => {
    if (dragging) {
      schedulerRef.current?.stop();
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      machine.transition("dragging");
      return;
    }

    machine.transition("idle");
    if (!document.hidden) schedulerRef.current?.start();
  }, [dragging, machine]);

  return (
    <div
      className={`web-pet-root ${dragging ? "is-dragging" : ""}`}
      data-state={state}
      data-paused={pageHidden ? "true" : "false"}
      style={style}
      role="img"
      aria-label="Blinga coding 网页桌宠，可拖动"
      aria-grabbed={dragging}
      {...dragBindings}
    >
      <PetAvatar asset={WEB_PET_CONFIG.asset} state={state} />
    </div>
  );
}
