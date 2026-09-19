"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";

type PanelLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PointerSession = {
  kind: "drag" | "resize";
  pointerId: number;
  startX: number;
  startY: number;
  layout: PanelLayout;
};

const STORAGE_KEY = "blinga-ai-panel-layout-v2";
const VIEWPORT_GAP = 12;
const DEFAULT_WIDTH = 570;
const DEFAULT_HEIGHT = 760;
const MIN_WIDTH = 340;
const MIN_HEIGHT = 440;
const KEYBOARD_STEP = 18;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function clampLayout(layout: PanelLayout): PanelLayout {
  const maxWidth = Math.max(220, window.innerWidth - VIEWPORT_GAP * 2);
  const maxHeight = Math.max(280, window.innerHeight - VIEWPORT_GAP * 2);
  const minimumWidth = Math.min(MIN_WIDTH, maxWidth);
  const minimumHeight = Math.min(MIN_HEIGHT, maxHeight);
  const width = clamp(layout.width, minimumWidth, maxWidth);
  const height = clamp(layout.height, minimumHeight, maxHeight);

  return {
    width,
    height,
    x: clamp(layout.x, VIEWPORT_GAP, Math.max(VIEWPORT_GAP, window.innerWidth - width - VIEWPORT_GAP)),
    y: clamp(layout.y, VIEWPORT_GAP, Math.max(VIEWPORT_GAP, window.innerHeight - height - VIEWPORT_GAP)),
  };
}

function getDefaultLayout(): PanelLayout {
  const width = Math.min(DEFAULT_WIDTH, Math.max(220, window.innerWidth - VIEWPORT_GAP * 2));
  const height = Math.min(DEFAULT_HEIGHT, Math.max(280, window.innerHeight - VIEWPORT_GAP * 2));

  return clampLayout({
    width,
    height,
    x: window.innerWidth - width - 18,
    y: Math.max(VIEWPORT_GAP, (window.innerHeight - height) / 2),
  });
}

function readStoredLayout(): PanelLayout | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return null;
    const layout = JSON.parse(value) as Partial<PanelLayout>;
    if (![layout.x, layout.y, layout.width, layout.height].every(Number.isFinite)) return null;
    return clampLayout(layout as PanelLayout);
  } catch {
    return null;
  }
}

function saveLayout(layout: PanelLayout) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // 设备禁用本地存储时，当前页面内的拖拽和缩放仍然有效。
  }
}

export function useDraggableAiPanel(open: boolean) {
  const panelRef = useRef<HTMLElement>(null);
  const layoutRef = useRef<PanelLayout | null>(null);
  const pointerSessionRef = useRef<PointerSession | null>(null);
  const [interaction, setInteraction] = useState<"dragging" | "resizing" | null>(null);

  const applyLayout = useCallback((candidate: PanelLayout, persist = false) => {
    const layout = clampLayout(candidate);
    layoutRef.current = layout;
    const panel = panelRef.current;
    if (panel) {
      panel.style.left = `${layout.x}px`;
      panel.style.top = `${layout.y}px`;
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      panel.style.width = `${layout.width}px`;
      panel.style.height = `${layout.height}px`;
    }
    if (persist) saveLayout(layout);
    return layout;
  }, []);

  useEffect(() => {
    applyLayout(readStoredLayout() ?? getDefaultLayout());

    const keepVisible = () => {
      applyLayout(layoutRef.current ?? getDefaultLayout(), true);
    };
    window.addEventListener("resize", keepVisible, { passive: true });
    return () => window.removeEventListener("resize", keepVisible);
  }, [applyLayout]);

  useEffect(() => {
    if (open && layoutRef.current) applyLayout(layoutRef.current);
  }, [applyLayout, open]);

  const beginPointerSession = useCallback((
    event: ReactPointerEvent<HTMLElement>,
    kind: PointerSession["kind"],
  ) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (kind === "drag" && (event.target as Element).closest(".chat-head-actions")) return;

    const panel = panelRef.current;
    if (!panel) return;
    const bounds = panel.getBoundingClientRect();
    const layout = clampLayout({
      x: bounds.left,
      y: bounds.top,
      width: bounds.width,
      height: bounds.height,
    });
    pointerSessionRef.current = {
      kind,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      layout,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    setInteraction(kind === "drag" ? "dragging" : "resizing");
  }, []);

  const movePointerSession = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const session = pointerSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - session.startX;
    const deltaY = event.clientY - session.startY;

    if (session.kind === "drag") {
      applyLayout({
        ...session.layout,
        x: session.layout.x + deltaX,
        y: session.layout.y + deltaY,
      });
      return;
    }

    const maxWidth = Math.max(MIN_WIDTH, window.innerWidth - session.layout.x - VIEWPORT_GAP);
    const maxHeight = Math.max(MIN_HEIGHT, window.innerHeight - session.layout.y - VIEWPORT_GAP);
    applyLayout({
      ...session.layout,
      width: clamp(session.layout.width + deltaX, MIN_WIDTH, maxWidth),
      height: clamp(session.layout.height + deltaY, MIN_HEIGHT, maxHeight),
    });
  }, [applyLayout]);

  const endPointerSession = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const session = pointerSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    pointerSessionRef.current = null;
    setInteraction(null);
    if (layoutRef.current) saveLayout(layoutRef.current);
  }, []);

  const nudgeLayout = useCallback((delta: Partial<PanelLayout>) => {
    const current = layoutRef.current ?? getDefaultLayout();
    applyLayout({
      x: current.x + (delta.x ?? 0),
      y: current.y + (delta.y ?? 0),
      width: current.width + (delta.width ?? 0),
      height: current.height + (delta.height ?? 0),
    }, true);
  }, [applyLayout]);

  const onDragKeyDown = useCallback((event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    const movement: Record<string, Partial<PanelLayout>> = {
      ArrowLeft: { x: -KEYBOARD_STEP },
      ArrowRight: { x: KEYBOARD_STEP },
      ArrowUp: { y: -KEYBOARD_STEP },
      ArrowDown: { y: KEYBOARD_STEP },
    };
    const delta = movement[event.key];
    if (!delta) return;
    event.preventDefault();
    nudgeLayout(delta);
  }, [nudgeLayout]);

  const onResizeKeyDown = useCallback((event: ReactKeyboardEvent<HTMLElement>) => {
    const resizing: Record<string, Partial<PanelLayout>> = {
      ArrowLeft: { width: -KEYBOARD_STEP },
      ArrowRight: { width: KEYBOARD_STEP },
      ArrowUp: { height: -KEYBOARD_STEP },
      ArrowDown: { height: KEYBOARD_STEP },
    };
    const delta = resizing[event.key];
    if (!delta) return;
    event.preventDefault();
    event.stopPropagation();
    nudgeLayout(delta);
  }, [nudgeLayout]);

  const resetLayout = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 无法访问本地存储时也可以恢复当前窗口布局。
    }
    applyLayout(getDefaultLayout());
  }, [applyLayout]);

  return {
    panelRef,
    interaction,
    resetLayout,
    dragHandleProps: {
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => beginPointerSession(event, "drag"),
      onPointerMove: movePointerSession,
      onPointerUp: endPointerSession,
      onPointerCancel: endPointerSession,
      onKeyDown: onDragKeyDown,
    },
    resizeHandleProps: {
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => beginPointerSession(event, "resize"),
      onPointerMove: movePointerSession,
      onPointerUp: endPointerSession,
      onPointerCancel: endPointerSession,
      onKeyDown: onResizeKeyDown,
    },
  };
}
