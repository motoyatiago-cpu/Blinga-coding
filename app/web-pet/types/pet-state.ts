export const PET_POSES = [
  { id: "idle", label: "待机", column: 0, row: 0, durationMs: 1_900, faceInteractive: true },
  { id: "wave", label: "挥手", column: 1, row: 0, durationMs: 2_100, faceInteractive: true },
  { id: "sit", label: "坐下", column: 2, row: 0, durationMs: 2_000, faceInteractive: true },
  { id: "cheer", label: "欢呼", column: 3, row: 0, durationMs: 1_800, faceInteractive: true },
  { id: "curious", label: "疑问", column: 4, row: 0, durationMs: 2_200, faceInteractive: true },
  { id: "coding", label: "编程", column: 0, row: 1, durationMs: 2_700, faceInteractive: true },
  { id: "thinking", label: "思考", column: 1, row: 1, durationMs: 2_400, faceInteractive: true },
  { id: "sleep", label: "睡觉", column: 2, row: 1, durationMs: 3_200, faceInteractive: false },
  { id: "snack", label: "吃点心", column: 3, row: 1, durationMs: 2_300, faceInteractive: true },
  { id: "sparkle", label: "闪亮", column: 4, row: 1, durationMs: 2_000, faceInteractive: true },
  { id: "sad", label: "难过", column: 0, row: 2, durationMs: 2_200, faceInteractive: true },
  { id: "cry", label: "哭泣", column: 1, row: 2, durationMs: 2_200, faceInteractive: true },
  { id: "angry", label: "生气", column: 2, row: 2, durationMs: 2_000, faceInteractive: true },
  { id: "surprised", label: "惊讶", column: 3, row: 2, durationMs: 1_900, faceInteractive: true },
  { id: "turn", label: "转身", column: 4, row: 2, durationMs: 2_000, faceInteractive: false },
  { id: "love", label: "爱心", column: 0, row: 3, durationMs: 2_300, faceInteractive: true },
  { id: "dance", label: "跳舞", column: 1, row: 3, durationMs: 2_100, faceInteractive: true },
  { id: "celebrate", label: "庆祝", column: 2, row: 3, durationMs: 2_000, faceInteractive: true },
  { id: "bored", label: "发呆", column: 3, row: 3, durationMs: 2_400, faceInteractive: true },
  { id: "amazed", label: "星星眼", column: 4, row: 3, durationMs: 2_200, faceInteractive: true },
] as const;

export type PetPose = (typeof PET_POSES)[number];
export type PetPoseId = PetPose["id"];
export type PetState = "dragging" | PetPoseId;

export type PetPosition = {
  x: number;
  y: number;
};
