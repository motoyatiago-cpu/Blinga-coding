import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";

test("runs the web pet through low-frequency actions and native expressions", async () => {
  const [
    layout,
    component,
    avatar,
    poses,
    config,
    dragHook,
    preloadHook,
    transitionHook,
    positionManager,
    behaviorDirector,
    dragMotionLoop,
    expressionLoop,
    stateMachine,
    css,
    expressionBuilder,
    poseFiles,
    expressionFiles,
  ] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/web-desktop-pet.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/components/pet-avatar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/types/pet-state.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/config/default-config.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/hooks/use-pet-drag.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/hooks/use-pose-preload.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/hooks/use-visual-transition.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/core/position-manager.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/core/behavior-director.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/core/drag-motion-loop.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/core/expression-loop.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/core/pet-state-machine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/web-pet.css", import.meta.url), "utf8"),
    readFile(new URL("../scripts/build-web-pet-expressions.py", import.meta.url), "utf8"),
    readdir(new URL("../public/web-pet/robot/poses/", import.meta.url)),
    readdir(new URL("../public/web-pet/robot/expressions/", import.meta.url)),
  ]);

  assert.match(layout, /<WebDesktopPet \/>/);
  assert.match(component, /new BehaviorDirector/);
  assert.match(component, /new DragMotionLoop/);
  assert.match(component, /new ExpressionLoop/);
  assert.match(component, /visibilitychange/);
  assert.match(component, /data-paused=\{pageHidden/);
  assert.match(component, /aria-grabbed=\{dragging\}/);
  assert.match(component, /--look-x/);
  assert.match(component, /event\.pointerType !== "mouse"/);
  assert.match(component, /matchMedia\("\(hover: hover\)"\)/);
  assert.doesNotMatch(component, /new PoseLoop/);

  assert.match(avatar, /is-previous/);
  assert.match(avatar, /is-current/);
  assert.match(avatar, /src=\{frame\.asset\}/);
  assert.doesNotMatch(avatar, /face-overlay/);
  assert.equal((poses.match(/actionDurationMs:/g) ?? []).length, 20);
  assert.match(poses, /PET_ACTION_POSES/);
  assert.match(poses, /PET_DRAG_POSES/);
  assert.match(poses, /half-blink/);

  assert.match(config, /firstActionDelayMs: 20_000/);
  assert.match(config, /actionDelayMinMs: 20_000/);
  assert.match(config, /actionDelayMaxMs: 20_000/);
  assert.match(config, /expressionFirstDelayMs: 1_800/);
  assert.match(config, /frameTransitionMs: 160/);
  assert.match(poses, /\{ id: "idle", holdMs: 4_600 \}/);
  assert.match(poses, /\{ id: "curious", holdMs: 2_000 \}/);
  assert.match(poses, /\{ id: "surprised", holdMs: 1_500 \}/);
  assert.match(poses, /\{ id: "amazed", holdMs: 1_900 \}/);
  assert.match(dragHook, /setPointerCapture/);
  assert.match(dragHook, /releasePointerCapture/);
  assert.match(preloadHook, /requestIdleCallback/);
  assert.match(preloadHook, /new Image\(\)/);
  assert.match(transitionHook, /previous: PetVisualFrame \| null/);
  assert.match(transitionHook, /setTimeout/);
  assert.match(positionManager, /window\.localStorage\.setItem/);
  assert.match(positionManager, /window\.innerWidth - size/);

  assert.match(behaviorDirector, /setTimeout/);
  assert.match(behaviorDirector, /flatMap/);
  assert.match(behaviorDirector, /nextDeck\[0\]\.id === this\.lastPoseId/);
  assert.doesNotMatch(behaviorDirector, /requestAnimationFrame/);
  assert.match(dragMotionLoop, /setTimeout/);
  assert.match(dragMotionLoop, /this\.onFrame\(frame\)/);
  assert.doesNotMatch(dragMotionLoop, /requestAnimationFrame/);
  assert.match(expressionLoop, /setTimeout/);
  assert.doesNotMatch(expressionLoop, /requestAnimationFrame/);
  assert.match(stateMachine, /class PetStateMachine/);

  assert.match(css, /position:fixed/);
  assert.match(css, /z-index:260/);
  assert.match(css, /width:120px/);
  assert.match(css, /width:88px/);
  assert.match(css, /cursor:grabbing/);
  assert.match(css, /object-fit:contain/);
  assert.match(css, /web-pet-frame-in \.16s/);
  assert.match(css, /web-pet-frame-out \.16s/);
  assert.match(css, /\.web-pet-frame\.is-previous \.web-pet-sprite/);
  assert.match(css, /\.web-pet-root:not\(\.is-dragging\):hover/);
  assert.doesNotMatch(css, /web-pet-face-overlay/);
  assert.doesNotMatch(css, /web-pet-face-blink/);
  assert.match(css, /animation-play-state:paused/);

  assert.match(expressionBuilder, /SOURCE_SCREENS/);
  assert.match(expressionBuilder, /Image\.composite/);
  assert.doesNotMatch(expressionBuilder, /ImageDraw/);
  assert.equal(poseFiles.filter((file) => file.endsWith(".webp")).length, 20);
  assert.equal(expressionFiles.filter((file) => file.endsWith(".webp")).length, 6);
  const isolatedPose = await stat(new URL("../public/web-pet/robot/poses/cry.webp", import.meta.url));
  const nativeExpression = await stat(new URL("../public/web-pet/robot/expressions/amazed.webp", import.meta.url));
  assert.ok(isolatedPose.size > 20_000);
  assert.ok(nativeExpression.size > 30_000);
});
