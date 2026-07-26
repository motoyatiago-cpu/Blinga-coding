"use client";

import { useEffect } from "react";
import Lenis from "lenis";

const NESTED_SCROLL_SELECTOR = [
  ".sidebar",
  ".course-language-nav",
  ".search-dialog",
  ".search-answer",
  ".messages",
  ".code-example pre",
  ".deep-example pre",
  ".code-editor-body textarea",
  ".terminal-pane pre",
  ".stdin-panel textarea",
  ".lesson-notes > textarea",
  ".graph-shell",
].join(",");

export default function SmoothScrollMotion() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const markedElements = new Set<HTMLElement>();
    let lenis: Lenis | null = null;
    let mutationFrame = 0;

    const markNestedScroll = (root: ParentNode = document) => {
      if (root instanceof HTMLElement && root.matches(NESTED_SCROLL_SELECTOR)) {
        root.setAttribute("data-lenis-prevent", "");
        markedElements.add(root);
      }
      root.querySelectorAll<HTMLElement>(NESTED_SCROLL_SELECTOR).forEach((element) => {
        element.setAttribute("data-lenis-prevent", "");
        markedElements.add(element);
      });
    };

    const stopSmoothScroll = () => {
      lenis?.destroy();
      lenis = null;
      document.documentElement.classList.remove("blinga-smooth-scroll");
    };

    const syncMotionPreference = () => {
      stopSmoothScroll();
      if (reducedMotion.matches || !precisePointer.matches) return;

      markNestedScroll();
      lenis = new Lenis({
        autoRaf: true,
        autoToggle: true,
        smoothWheel: true,
        syncTouch: false,
        duration: 1.05,
        wheelMultiplier: 0.9,
        anchors: { offset: -82 },
        stopInertiaOnNavigate: true,
        overscroll: true,
      });
      document.documentElement.classList.add("blinga-smooth-scroll");
    };

    const observer = new MutationObserver((mutations) => {
      window.cancelAnimationFrame(mutationFrame);
      mutationFrame = window.requestAnimationFrame(() => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) markNestedScroll(node);
          });
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    syncMotionPreference();
    reducedMotion.addEventListener("change", syncMotionPreference);
    precisePointer.addEventListener("change", syncMotionPreference);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(mutationFrame);
      reducedMotion.removeEventListener("change", syncMotionPreference);
      precisePointer.removeEventListener("change", syncMotionPreference);
      stopSmoothScroll();
      markedElements.forEach((element) => element.removeAttribute("data-lenis-prevent"));
      markedElements.clear();
    };
  }, []);

  return null;
}
