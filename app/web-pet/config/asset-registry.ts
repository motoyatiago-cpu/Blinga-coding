import type {
  PetAssetDefinition,
  PetExpressionId,
  PetPoseId,
} from "../types/pet-state";

const webp = (src: string): PetAssetDefinition => ({ src, format: "webp" });

export const PET_POSE_ASSETS = {
  idle: webp("/web-pet/robot/poses/idle.webp"),
  wave: webp("/web-pet/robot/poses/wave.webp"),
  sit: webp("/web-pet/robot/poses/sit.webp"),
  cheer: webp("/web-pet/robot/poses/cheer.webp"),
  curious: webp("/web-pet/robot/poses/curious.webp"),
  coding: webp("/web-pet/robot/poses/coding.webp"),
  thinking: webp("/web-pet/robot/poses/thinking.webp"),
  sleep: webp("/web-pet/robot/poses/sleep.webp"),
  snack: webp("/web-pet/robot/poses/snack.webp"),
  sparkle: webp("/web-pet/robot/poses/sparkle.webp"),
  sad: webp("/web-pet/robot/poses/sad.webp"),
  cry: webp("/web-pet/robot/poses/cry.webp"),
  angry: webp("/web-pet/robot/poses/angry.webp"),
  surprised: webp("/web-pet/robot/poses/surprised.webp"),
  turn: webp("/web-pet/robot/poses/turn.webp"),
  love: webp("/web-pet/robot/poses/love.webp"),
  dance: webp("/web-pet/robot/poses/dance.webp"),
  celebrate: webp("/web-pet/robot/poses/celebrate.webp"),
  bored: webp("/web-pet/robot/poses/bored.webp"),
  amazed: webp("/web-pet/robot/poses/amazed.webp"),
} satisfies Record<PetPoseId, PetAssetDefinition>;

export const PET_EXPRESSION_ASSETS = {
  idle: webp("/web-pet/robot/expressions/idle.webp"),
  "half-blink": webp("/web-pet/robot/expressions/half-blink.webp"),
  closed: webp("/web-pet/robot/expressions/closed.webp"),
  curious: webp("/web-pet/robot/expressions/curious.webp"),
  surprised: webp("/web-pet/robot/expressions/surprised.webp"),
  amazed: webp("/web-pet/robot/expressions/amazed.webp"),
} satisfies Record<PetExpressionId, PetAssetDefinition>;

export function getPetPoseAsset(id: PetPoseId) {
  return PET_POSE_ASSETS[id];
}

export function getPetExpressionAsset(id: PetExpressionId) {
  return PET_EXPRESSION_ASSETS[id];
}
