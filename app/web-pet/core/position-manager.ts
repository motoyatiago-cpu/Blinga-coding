import { WEB_PET_CONFIG } from "../config/default-config";
import type { PetPosition } from "../types/pet-state";

export function clampPetPosition(
  position: PetPosition,
  size: number,
  padding = WEB_PET_CONFIG.viewportPadding,
): PetPosition {
  if (typeof window === "undefined") return position;

  const maxX = Math.max(padding, window.innerWidth - size - padding);
  const maxY = Math.max(padding, window.innerHeight - size - padding);

  return {
    x: Math.min(Math.max(position.x, padding), maxX),
    y: Math.min(Math.max(position.y, padding), maxY),
  };
}

export function getDefaultPetPosition(size: number): PetPosition {
  if (typeof window === "undefined") return { x: 0, y: 0 };

  return clampPetPosition({
    x: window.innerWidth - size - WEB_PET_CONFIG.rightDockGap,
    y: window.innerHeight - size - WEB_PET_CONFIG.bottomDockGap,
  }, size);
}

export function loadPetPosition(size: number): PetPosition {
  if (typeof window === "undefined") return { x: 0, y: 0 };

  try {
    const saved = window.localStorage.getItem(WEB_PET_CONFIG.positionStorageKey);
    if (!saved) return getDefaultPetPosition(size);

    const value = JSON.parse(saved) as Partial<PetPosition>;
    if (!Number.isFinite(value.x) || !Number.isFinite(value.y)) {
      return getDefaultPetPosition(size);
    }

    return clampPetPosition({ x: Number(value.x), y: Number(value.y) }, size);
  } catch {
    return getDefaultPetPosition(size);
  }
}

export function savePetPosition(position: PetPosition) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(WEB_PET_CONFIG.positionStorageKey, JSON.stringify(position));
  } catch {
    // Storage can be unavailable in private browsing; dragging still works for this visit.
  }
}
