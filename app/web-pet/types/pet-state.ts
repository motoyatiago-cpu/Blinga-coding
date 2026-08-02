export const PET_POSES = [
  { id: "idle", label: "待机", durationMs: 7_500 },
  { id: "wave", label: "挥手", durationMs: 6_500 },
  { id: "sit", label: "坐下", durationMs: 8_000 },
  { id: "cheer", label: "欢呼", durationMs: 6_000 },
  { id: "curious", label: "疑问", durationMs: 7_500 },
  { id: "coding", label: "编程", durationMs: 10_000 },
  { id: "thinking", label: "思考", durationMs: 9_000 },
  { id: "sleep", label: "睡觉", durationMs: 12_000 },
  { id: "snack", label: "吃点心", durationMs: 7_500 },
  { id: "sparkle", label: "闪亮", durationMs: 6_500 },
  { id: "sad", label: "难过", durationMs: 7_500 },
  { id: "cry", label: "哭泣", durationMs: 6_500 },
  { id: "angry", label: "生气", durationMs: 6_000 },
  { id: "surprised", label: "惊讶", durationMs: 6_000 },
  { id: "turn", label: "转身", durationMs: 7_000 },
  { id: "love", label: "爱心", durationMs: 7_500 },
  { id: "dance", label: "跳舞", durationMs: 6_500 },
  { id: "celebrate", label: "庆祝", durationMs: 6_500 },
  { id: "bored", label: "发呆", durationMs: 9_000 },
  { id: "amazed", label: "星星眼", durationMs: 7_000 },
] as const;

export const PET_HOVER_POSES = PET_POSES.filter(({ id }) =>
  ["idle", "curious", "surprised", "amazed"].includes(id),
);

export type PetPose = (typeof PET_POSES)[number];
export type PetPoseId = PetPose["id"];
export type PetState = "dragging" | PetPoseId;

export type PetPosition = {
  x: number;
  y: number;
};
