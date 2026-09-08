"use client";
import { useEffect, useRef } from "react";
const EXPERIENCES = [
  { label: "烟花祝福", href: "/feeling/fireworks/index.html" },
  { label: "流明场", href: "/feeling/lumen/index.html" },
  { label: "空中绘画", href: "/feeling/air-drawing/index.html" },
  { label: "星星", href: "/feeling/stars/index.html" },
] as const;
type PetFeelingPanelProps = { open: boolean; onBack: () => void; onClose: () => void };
export const PET_FEELING_PANEL_ID = "web-pet-feeling-panel";
export function PetFeelingPanel({ open, onBack, onClose }: PetFeelingPanelProps) {
  const firstChoiceRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => { if (open) firstChoiceRef.current?.focus({ preventScroll: true }); }, [open]);
  return (
    <section id={PET_FEELING_PANEL_ID}
      className={`web-pet-feeling-panel ${open ? "is-open" : ""}`}
      role="dialog" aria-modal="false" aria-labelledby="web-pet-feeling-title"
      aria-hidden={!open} onPointerDown={event => event.stopPropagation()}
      onClick={event => event.stopPropagation()}>
      <header>
        <button type="button" onClick={onBack} tabIndex={open ? 0 : -1} aria-label="返回桌宠菜单">←</button>
        <b id="web-pet-feeling-title">Feeling</b>
        <button type="button" onClick={onClose} tabIndex={open ? 0 : -1} aria-label="关闭 Feeling">×</button>
      </header>
      <div className="web-pet-feeling-options">
        {EXPERIENCES.map((item, index) => (
          <a key={item.href} ref={index === 0 ? firstChoiceRef : undefined}
            href={item.href} target="_blank" rel="noopener noreferrer"
            tabIndex={open ? 0 : -1} aria-label={`${item.label}（新标签页打开）`}>
            {item.label}
          </a>
        ))}
      </div>
    </section>
  );
}
