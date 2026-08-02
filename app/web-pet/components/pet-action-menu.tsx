type PetActionMenuProps = {
  open: boolean;
  onAskAi: () => void;
  onClose: () => void;
};

export const PET_MENU_ID = "web-pet-action-menu";

export function PetActionMenu({ open, onAskAi, onClose }: PetActionMenuProps) {
  return (
    <div
      id={PET_MENU_ID}
      className={`web-pet-menu ${open ? "is-open" : ""}`}
      role="menu"
      aria-hidden={!open}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        className="web-pet-menu-item is-ai"
        type="button"
        role="menuitem"
        tabIndex={open ? 0 : -1}
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
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      >
        <span aria-hidden="true">◎</span>
        <b>用户论坛</b>
      </a>
    </div>
  );
}
