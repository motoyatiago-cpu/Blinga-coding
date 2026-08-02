import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";

test("mounts a modular draggable web desktop pet across the site", async () => {
  const [layout, component, avatar, poses, dragHook, preloadHook, positionManager, poseLoop, stateMachine, css, poseFiles] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/web-desktop-pet.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/components/pet-avatar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/types/pet-state.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/hooks/use-pet-drag.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/hooks/use-pose-preload.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/core/position-manager.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/core/pose-loop.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/core/pet-state-machine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/web-pet.css", import.meta.url), "utf8"),
    readdir(new URL("../public/web-pet/robot/poses/", import.meta.url)),
  ]);

  assert.match(layout, /<WebDesktopPet \/>/);
  assert.match(component, /new PoseLoop/);
  assert.match(component, /visibilitychange/);
  assert.match(component, /data-paused=\{pageHidden/);
  assert.match(component, /aria-grabbed=\{dragging\}/);
  assert.match(component, /--look-x/);
  assert.match(component, /onPointerEnter/);
  assert.match(component, /PET_HOVER_POSES/);
  assert.match(component, /hoverLoopRef/);
  assert.match(avatar, /<img/);
  assert.match(avatar, /\$\{pose\.id\}\.webp/);
  assert.doesNotMatch(avatar, /face-overlay/);
  assert.equal((poses.match(/id: "/g) ?? []).length, 20);
  assert.match(dragHook, /setPointerCapture/);
  assert.match(dragHook, /releasePointerCapture/);
  assert.match(preloadHook, /new Image\(\)/);
  assert.match(positionManager, /window\.localStorage\.setItem/);
  assert.match(positionManager, /window\.innerWidth - size/);
  assert.match(poseLoop, /setTimeout/);
  assert.match(poseLoop, /currentIndex = \(this\.currentIndex \+ 1\) % this\.poses\.length/);
  assert.doesNotMatch(poseLoop, /requestAnimationFrame/);
  assert.match(stateMachine, /class PetStateMachine/);
  assert.match(css, /position:fixed/);
  assert.match(css, /z-index:260/);
  assert.match(css, /width:120px/);
  assert.match(css, /width:88px/);
  assert.match(css, /cursor:grabbing/);
  assert.match(css, /object-fit:contain/);
  assert.match(css, /--look-x/);
  assert.match(css, /\.web-pet-root:hover \.web-pet-sprite/);
  assert.doesNotMatch(css, /web-pet-face-overlay/);
  assert.doesNotMatch(css, /web-pet-face-blink/);
  assert.match(css, /animation-play-state:paused/);
  assert.equal(poseFiles.filter((file) => file.endsWith(".webp")).length, 20);
  const isolatedPose = await stat(new URL("../public/web-pet/robot/poses/cry.webp", import.meta.url));
  assert.ok(isolatedPose.size > 20_000);
});
