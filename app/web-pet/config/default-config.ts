export const WEB_PET_CONFIG = {
  asset: "/web-pet/robot/idle.webp",
  desktopSize: 120,
  mobileSize: 88,
  mobileBreakpoint: 650,
  viewportPadding: 8,
  rightDockGap: 58,
  bottomDockGap: 18,
  firstIdleActionDelayMs: 900,
  idleDelayMinMs: 5_000,
  idleDelayMaxMs: 15_000,
  idleActionDurationMs: 1_450,
  positionStorageKey: "blinga:web-pet-position:v1",
} as const;
