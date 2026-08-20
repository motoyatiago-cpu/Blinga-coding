"use client";

import { useEffect, useRef, useState } from "react";

const FEELINGS = [
  { icon: "☀", label: "开心", reply: "今天的状态很不错。" },
  { icon: "○", label: "平静", reply: "慢慢来，保持自己的节奏。" },
  { icon: "☾", label: "疲惫", reply: "先休息一下也没关系。" },
  { icon: "?", label: "需要帮助", reply: "可以返回并打开 AI 问答。" },
] as const;

type PetFeelingPanelProps = {
  open: boolean;
  onBack: () => void;
  onClose: () => void;
};

export const PET_FEELING_PANEL_ID = "web-pet-feeling-panel";

export function PetFeelingPanel({ open, onBack, onClose }: PetFeelingPanelProps) {
  const [selected, setSelected] = useState<(typeof FEELINGS)[number] | null>(null);
  const firstChoiceRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      return;
    }

    firstChoiceRef.current?.focus({ preventScroll: true });
  }, [open]);

  return (
    <section
      id={PET_FEELING_PANEL_ID}
      className={`web-pet-feeling-panel ${open ? "is-open" : ""}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby="web-pet-feeling-title"
      aria-hidden={!open}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <header>
        <button type="button" onClick={onBack} tabIndex={open ? 0 : -1} aria-label="返回桌宠菜单">←</button>
        <b id="web-pet-feeling-title">Feeling</b>
        <button type="button" onClick={onClose} tabIndex={open ? 0 : -1} aria-label="关闭情绪面板">×</button>
      </header>
      <p>此刻感觉怎么样？</p>
      <div className="web-pet-feeling-options">
        {FEELINGS.map((feeling, index) => (
          <button
            ref={index === 0 ? firstChoiceRef : undefined}
            key={feeling.label}
            type="button"
            className={selected?.label === feeling.label ? "is-selected" : ""}
            aria-pressed={selected?.label === feeling.label}
            tabIndex={open ? 0 : -1}
            onClick={() => setSelected(feeling)}
          >
            <span aria-hidden="true">{feeling.icon}</span>
            {feeling.label}
          </button>
        ))}
      </div>
      <div className="web-pet-feeling-response" aria-live="polite">
        {selected ? selected.reply : "选择只保留在当前页面。"}
      </div>
    </section>
  );
}
