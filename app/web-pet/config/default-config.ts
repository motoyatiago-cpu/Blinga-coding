export const WEB_PET_CONFIG = {
  poseBasePath: "/web-pet/robot/poses",
  desktopSize: 120,
  mobileSize: 88,
  mobileBreakpoint: 650,
  viewportPadding: 8,
  rightDockGap: 58,
  bottomDockGap: 18,
  firstPoseDelayMs: 7_500,
  hoverPoseDelayMs: 420,
  hoverPoseIntervalMs: 1_100,
  positionStorageKey: "blinga:web-pet-position:v1",
} as const;
