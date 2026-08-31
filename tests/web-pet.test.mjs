import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";

test("runs the complete modular web pet assistant", async () => {
  const [
    layout,
    page,
    forumPage,
    component,
    avatar,
    assetMedia,
    actionMenu,
    feelingPanel,
    poses,
    config,
    copy,
    assetRegistry,
    aiBridge,
    dragHook,
    preloadHook,
    transitionHook,
    positionManager,
    behaviorDirector,
    bubbleDirector,
    dragMotionLoop,
    expressionLoop,
    stateMachine,
    css,
    expressionBuilder,
    packageJson,
    poseFiles,
    expressionFiles,
  ] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/forum/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/web-desktop-pet.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/components/pet-avatar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/components/pet-asset-media.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/components/pet-action-menu.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/components/pet-feeling-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/types/pet-state.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/config/default-config.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/config/pet-copy.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/config/asset-registry.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/ai-assistant-events.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/hooks/use-pet-drag.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/hooks/use-pose-preload.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/hooks/use-visual-transition.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/core/position-manager.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/core/behavior-director.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/core/bubble-director.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/core/drag-motion-loop.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/core/expression-loop.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/core/pet-state-machine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/web-pet.css", import.meta.url), "utf8"),
    readFile(new URL("../scripts/build-web-pet-expressions.py", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readdir(new URL("../public/web-pet/robot/poses/", import.meta.url)),
    readdir(new URL("../public/web-pet/robot/expressions/", import.meta.url)),
  ]);

  assert.match(layout, /<WebDesktopPet \/>/);
  assert.match(component, /new BehaviorDirector/);
  assert.match(component, /new BubbleDirector/);
  assert.match(component, /new DragMotionLoop/);
  assert.match(component, /new ExpressionLoop/);
  assert.match(component, /visibilitychange/);
  assert.match(component, /data-paused=\{pageHidden/);
  assert.match(component, /aria-grabbed=\{dragging\}/);
  assert.match(component, /aria-controls=\{PET_MENU_ID\}/);
  assert.match(component, /data-overlay-horizontal=\{overlayPlacement\.horizontal\}/);
  assert.match(component, /data-overlay-vertical=\{overlayPlacement\.vertical\}/);
  assert.match(component, /bounds\.left < 380/);
  assert.match(component, /bounds\.top < 260/);
  assert.doesNotMatch(component, /setBubbleMessage\("需要我做什么？"\)/);
  assert.match(component, /role="button"/);
  assert.match(component, /requestExistingAiAssistant/);
  assert.match(component, /window\.location\.assign\("\/\?assistant=open"\)/);
  assert.match(component, /event\.pointerType !== "mouse"/);
  assert.match(component, /matchMedia\("\(hover: hover\)"\)/);

  assert.match(actionMenu, /AI 问答/);
  assert.match(actionMenu, /用户论坛/);
  assert.match(actionMenu, /Feeling/);
  assert.match(actionMenu, /PET_FEELING_PANEL_ID/);
  assert.match(feelingPanel, /此刻感觉怎么样/);
  assert.match(feelingPanel, /开心/);
  assert.match(feelingPanel, /平静/);
  assert.match(feelingPanel, /疲惫/);
  assert.match(feelingPanel, /需要帮助/);
  assert.match(feelingPanel, /aria-live="polite"/);
  assert.match(actionMenu, /href="\/forum"/);
  assert.match(actionMenu, /target="_blank"/);
  assert.match(actionMenu, /rel="noopener noreferrer"/);
  assert.match(aiBridge, /new CustomEvent/);
  assert.match(aiBridge, /cancelable: true/);
  assert.match(page, /addEventListener\(OPEN_AI_ASSISTANT_EVENT/);
  assert.match(page, /setChatOpen\(true\)/);
  assert.match(forumPage, /用户论坛/);

  assert.match(avatar, /<PetAssetMedia/);
  assert.match(assetMedia, /asset\.format === "lottie"/);
  assert.match(assetMedia, /import\("lottie-web\/build\/player\/lottie_light"\)/);
  assert.match(assetMedia, /lottie\.loadAnimation/);
  assert.match(packageJson, /"lottie-web"/);
  assert.match(poses, /"png" \| "webp" \| "gif" \| "svg" \| "lottie"/);
  assert.equal((poses.match(/actionDurationMs:/g) ?? []).length, 20);
  assert.match(poses, /PET_ACTION_POSES/);
  assert.match(poses, /PET_DRAG_POSES/);
  assert.match(poses, /"menu"/);
  assert.match(assetRegistry, /satisfies Record<PetPoseId, PetAssetDefinition>/);
  assert.match(assetRegistry, /satisfies Record<PetExpressionId, PetAssetDefinition>/);

  assert.match(config, /firstActionDelayMs: 20_000/);
  assert.match(config, /actionDelayMinMs: 20_000/);
  assert.match(config, /actionDelayMaxMs: 20_000/);
  assert.match(config, /bubbleDelayMinMs: 30_000/);
  assert.match(config, /bubbleDelayMaxMs: 60_000/);
  assert.ok((copy.match(/"/g) ?? []).length >= 12);
  assert.match(dragHook, /setPointerCapture/);
  assert.match(dragHook, /releasePointerCapture/);
  assert.match(dragHook, /consumeClickSuppression/);
  assert.match(preloadHook, /requestIdleCallback/);
  assert.match(preloadHook, /asset\.format === "lottie"/);
  assert.match(preloadHook, /fetch\(asset\.src/);
  assert.match(transitionHook, /previous: PetVisualFrame \| null/);
  assert.match(positionManager, /window\.localStorage\.setItem/);
  assert.match(positionManager, /window\.innerWidth - size/);

  assert.match(behaviorDirector, /setTimeout/);
  assert.match(behaviorDirector, /flatMap/);
  assert.doesNotMatch(behaviorDirector, /requestAnimationFrame/);
  assert.match(bubbleDirector, /setTimeout/);
  assert.match(bubbleDirector, /message !== this\.lastMessage/);
  assert.doesNotMatch(bubbleDirector, /requestAnimationFrame/);
  assert.match(dragMotionLoop, /setTimeout/);
  assert.doesNotMatch(dragMotionLoop, /requestAnimationFrame/);
  assert.match(expressionLoop, /setTimeout/);
  assert.doesNotMatch(expressionLoop, /requestAnimationFrame/);
  assert.match(stateMachine, /class PetStateMachine/);

  assert.match(css, /position:fixed/);
  assert.match(css, /z-index:260/);
  assert.match(css, /width:120px/);
  assert.match(css, /width:88px/);
  assert.match(css, /cursor:grabbing/);
  assert.match(css, /\.web-pet-menu\.is-open/);
  assert.match(css, /@keyframes web-pet-menu-pop/);
  assert.match(css, /animation:web-pet-menu-pop \.42s/);
  assert.match(css, /\.web-pet-menu-item\.is-feeling/);
  assert.match(css, /\.web-pet-feeling-panel\.is-open/);
  assert.match(css, /\.web-pet-menu-item\.is-ai\{[\s\S]*?right:142px;[\s\S]*?bottom:38px;/);
  assert.match(css, /\.web-pet-menu-item\.is-forum\{[\s\S]*?right:130px;[\s\S]*?bottom:98px;/);
  assert.match(css, /\.web-pet-menu-item\.is-feeling\{[\s\S]*?right:32px;[\s\S]*?bottom:150px;/);
  assert.match(css, /\.web-pet-root\[data-menu-open="true"\] \.web-pet-bubble/);
  assert.match(css, /data-overlay-horizontal="right"/);
  assert.match(css, /data-overlay-vertical="down"/);
  assert.match(css, /\.web-pet-bubble\.is-visible/);
  assert.match(css, /\.web-pet-root:not\(\.is-dragging\):hover/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /html\[data-theme="light"\] \.web-pet-root/);
  assert.match(css, /--web-pet-surface:#ffffff/);
  assert.match(css, /\.web-pet-menu-item\{[\s\S]*?background:var\(--web-pet-surface\)/);
  assert.match(css, /\.web-pet-feeling-panel\{[\s\S]*?background:var\(--web-pet-surface-strong\)/);
  assert.match(css, /\.web-pet-feeling-options button\{[\s\S]*?color:var\(--web-pet-muted\)/);
  assert.doesNotMatch(css, /web-pet-face-overlay/);

  assert.match(expressionBuilder, /SOURCE_SCREENS/);
  assert.doesNotMatch(expressionBuilder, /ImageDraw/);
  assert.equal(poseFiles.filter((file) => file.endsWith(".webp")).length, 20);
  assert.equal(expressionFiles.filter((file) => file.endsWith(".webp")).length, 6);
  const isolatedPose = await stat(new URL("../public/web-pet/robot/poses/cry.webp", import.meta.url));
  const nativeExpression = await stat(new URL("../public/web-pet/robot/expressions/amazed.webp", import.meta.url));
  assert.ok(isolatedPose.size > 20_000);
  assert.ok(nativeExpression.size > 30_000);
});
