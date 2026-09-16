"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { startProfileParticles } from "./profile-particles";
import "./profile-entry.css";

export default function ProfileEntry({ ready, reduceMotion = false, children }: {
  ready: boolean; reduceMotion?: boolean; children?: ReactNode;
}) {
  const [phase, setPhase] = useState<"loading" | "revealing" | "done">("loading");
  const [systemReduced, setSystemReduced] = useState(false);
  const started = useRef(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduced = reduceMotion || systemReduced;
  const finished = phase === "done";
  useEffect(() => {
    started.current = performance.now();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setSystemReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (finished || !canvas.current) return;
    // Read the media query before the first frame, not after a state update.
    return startProfileParticles(canvas.current,
      reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, [finished, reduced]);
  useEffect(() => {
    if (!ready || phase !== "loading") return;
    const timer = window.setTimeout(() => setPhase("revealing"),
      reduced ? 0 : Math.max(0, 300 - (performance.now() - started.current)));
    return () => window.clearTimeout(timer);
  }, [ready, phase, reduced]);
  useEffect(() => {
    if (phase !== "revealing") return;
    // Also works when transitionend is suppressed (background tab/reduced motion).
    const timer = window.setTimeout(() => setPhase("done"), reduced ? 160 : 300);
    return () => window.clearTimeout(timer);
  }, [phase, reduced]);
  return <div className="profile-entry" data-phase={phase} data-reduced={reduced} aria-busy={!ready}>
    <div className="profile-entry-content" inert={phase !== "done"} aria-hidden={phase !== "done" ? true : undefined}>
      {children}
    </div>
    {phase !== "done" && <div className="profile-entry-overlay" role="status" aria-label="正在加载个人主页"
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && event.propertyName === "opacity" && phase === "revealing") setPhase("done");
      }}>
      <canvas ref={canvas} aria-hidden="true" />
      <div className="profile-entry-center" aria-hidden="true"><div className="profile-entry-spinner" /></div>
    </div>}
  </div>;
}
