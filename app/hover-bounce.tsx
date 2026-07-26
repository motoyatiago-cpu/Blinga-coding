"use client";

import { useEffect } from "react";
import { gsap } from "gsap";

const AUTO_BOUNCE_SELECTOR = [
  "button",
  ".brandmark",
  ".avatar",
  ".course-icon",
  ".entry-marker",
  ".status-dot",
  ".sidebar-tip > span",
  ".chat-head > div > span",
].join(",");

/**
 * 为单个元素绑定统一的悬停弹跳效果。
 * 返回清理函数，方便页面卸载时移除监听并释放动画。
 */
export function bindHoverBounce(element: HTMLElement) {
  const enter = () => {
    if (element.matches(":disabled, [aria-disabled='true']")) return;
    gsap.to(element, {
      duration: 0.8,
      scale: 1.1,
      ease: "elastic.out(1, 0.3)",
      force3D: true,
      overwrite: "auto",
    });
  };

  const leave = () => {
    gsap.to(element, {
      duration: 0.5,
      scale: 1,
      ease: "elastic.out(1, 0.5)",
      force3D: true,
      overwrite: "auto",
    });
  };

  element.addEventListener("mouseenter", enter, { passive: true });
  element.addEventListener("mouseleave", leave, { passive: true });

  return () => {
    element.removeEventListener("mouseenter", enter);
    element.removeEventListener("mouseleave", leave);
    gsap.killTweensOf(element);
    gsap.set(element, { clearProps: "scale,transform" });
  };
}

export default function HoverBounceMotion() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (reducedMotion.matches || !precisePointer.matches) return;

    const cleanups = new Map<HTMLElement, () => void>();
    let animationFrame = 0;

    const registerElements = (root: ParentNode = document) => {
      // 自动给常用交互元素增加语义类；知识图谱区域保持原样。
      gsap.utils.toArray<HTMLElement>(AUTO_BOUNCE_SELECTOR, root).forEach((element) => {
        if (!element.closest("#map") && !element.hasAttribute("data-no-bounce")) {
          element.classList.add("hover-bounce");
        }
      });

      // GSAP utils.toArray 可高效、统一地处理静态与后续插入的元素。
      gsap.utils.toArray<HTMLElement>(".hover-bounce", root).forEach((element) => {
        if (!cleanups.has(element) && !element.closest("#map")) {
          cleanups.set(element, bindHoverBounce(element));
        }
      });
    };

    registerElements();

    // 搜索弹窗、AI 对话等动态内容插入后，仅在下一帧批量扫描新增节点。
    const observer = new MutationObserver((mutations) => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) registerElements(node);
          });
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(animationFrame);
      cleanups.forEach((cleanup) => cleanup());
      cleanups.clear();
    };
  }, []);

  return null;
}
