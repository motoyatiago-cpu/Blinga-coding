export const PET_POSES = [
  { id: "idle", label: "待机", actionDurationMs: 0, weight: 0 },
  { id: "wave", label: "挥手", actionDurationMs: 2_200, weight: 2 },
  { id: "sit", label: "坐下", actionDurationMs: 3_600, weight: 2 },
  { id: "cheer", label: "欢呼", actionDurationMs: 2_100, weight: 1 },
  { id: "curious", label: "疑问", actionDurationMs: 2_700, weight: 2 },
  { id: "coding", label: "编程", actionDurationMs: 4_400, weight: 2 },
  { id: "thinking", label: "思考", actionDurationMs: 3_500, weight: 2 },
  { id: "sleep", label: "睡觉", actionDurationMs: 6_500, weight: 1 },
  { id: "snack", label: "吃点心", actionDurationMs: 3_200, weight: 2 },
  { id: "sparkle", label: "闪亮", actionDurationMs: 2_200, weight: 1 },
  { id: "sad", label: "难过", actionDurationMs: 2_600, weight: 1 },
  { id: "cry", label: "哭泣", actionDurationMs: 2_400, weight: 1 },
  { id: "angry", label: "生气", actionDurationMs: 2_200, weight: 1 },
  { id: "surprised", label: "惊讶", actionDurationMs: 2_000, weight: 1 },
  { id: "turn", label: "转身", actionDurationMs: 2_200, weight: 1 },
  { id: "love", label: "爱心", actionDurationMs: 2_600, weight: 1 },
  { id: "dance", label: "跳舞", actionDurationMs: 3_000, weight: 1 },
  { id: "celebrate", label: "庆祝", actionDurationMs: 2_400, weight: 1 },
  { id: "bored", label: "发呆", actionDurationMs: 4_200, weight: 2 },
  { id: "amazed", label: "星星眼", actionDurationMs: 2_200, weight: 1 },
] as const;

export const PET_ACTION_POSES = PET_POSES.filter(({ id }) => id !== "idle");

export const PET_EXPRESSIONS = [
  { id: "idle", holdMs: 2_800 },
  { id: "half-blink", holdMs: 260 },
  { id: "closed", holdMs: 220 },
  { id: "idle", holdMs: 4_200 },
  { id: "curious", holdMs: 2_000 },
  { id: "idle", holdMs: 4_600 },
  { id: "surprised", holdMs: 1_500 },
  { id: "idle", holdMs: 4_200 },
  { id: "amazed", holdMs: 1_900 },
] as const;

export const PET_DRAG_POSES = [
  { id: "wave", holdMs: 540 },
  { id: "dance", holdMs: 620 },
  { id: "turn", holdMs: 560 },
] as const;

export type PetPose = (typeof PET_POSES)[number];
export type PetPoseId = PetPose["id"];
export type PetExpression = (typeof PET_EXPRESSIONS)[number];
export type PetDragPose = (typeof PET_DRAG_POSES)[number];
export type PetState = "dragging" | PetPoseId;

export type PetVisualFrame = {
  key: string;
  poseId: PetPoseId;
  asset: string;
};

export type PetPosition = {
  x: number;
  y: number;
};
