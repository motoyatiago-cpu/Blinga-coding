"use client";

import { useEffect, useState } from "react";
import { PetFeelingPanel, PET_FEELING_PANEL_ID } from "./pet-feeling-panel";

type PetActionMenuProps = {
  open: boolean;
  onAskAi: () => void;
  onClose: () => void;
};

export const PET_MENU_ID = "web-pet-action-menu";

export function PetActionMenu({ open, onAskAi, onClose }: PetActionMenuProps) {
  const [feelingOpen, setFeelingOpen] = useState(false);
  const menuVisible = open && !feelingOpen;

  useEffect(() => {
    if (!open) setFeelingOpen(false);
  }, [open]);

  return (
    <>
      <div
        id={PET_MENU_ID}
        className={`web-pet-menu ${open ? "is-open" : ""} ${feelingOpen ? "has-feeling" : ""}`}
        role="menu"
        aria-hidden={!open}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
      <button
        className="web-pet-menu-item is-ai"
        type="button"
        role="menuitem"
        tabIndex={menuVisible ? 0 : -1}
        onClick={onAskAi}
      >
        <span aria-hidden="true">✦</span>
        <b>AI 问答</b>
      </button>
      <a
        className="web-pet-menu-item is-forum"
        href="/forum"
        target="_blank"
        rel="noopener noreferrer"
        role="menuitem"
        tabIndex={menuVisible ? 0 : -1}
        onClick={onClose}
      >
        <span aria-hidden="true">◎</span>
        <b>用户论坛</b>
      </a>
      <button
        className="web-pet-menu-item is-feeling"
        type="button"
        role="menuitem"
        tabIndex={menuVisible ? 0 : -1}
        aria-controls={PET_FEELING_PANEL_ID}
        aria-expanded={feelingOpen}
        onClick={() => setFeelingOpen(true)}
      >
        <span aria-hidden="true">♡</span>
        <b>Feeling</b>
      </button>
      </div>
      <PetFeelingPanel
        open={open && feelingOpen}
        onBack={() => setFeelingOpen(false)}
        onClose={onClose}
      />
    </>
  );
}
