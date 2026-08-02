import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

test("mounts a modular draggable web desktop pet across the site", async () => {
  const [layout, component, dragHook, positionManager, scheduler, stateMachine, css, asset] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/web-desktop-pet.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/hooks/use-pet-drag.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/core/position-manager.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/core/idle-scheduler.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/core/pet-state-machine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/web-pet/web-pet.css", import.meta.url), "utf8"),
    stat(new URL("../public/web-pet/robot/idle.webp", import.meta.url)),
  ]);

  assert.match(layout, /<WebDesktopPet \/>/);
  assert.match(component, /new IdleScheduler/);
  assert.match(component, /visibilitychange/);
  assert.match(component, /aria-grabbed=\{dragging\}/);
  assert.match(dragHook, /setPointerCapture/);
  assert.match(dragHook, /releasePointerCapture/);
  assert.match(positionManager, /window\.localStorage\.setItem/);
  assert.match(positionManager, /window\.innerWidth - size/);
  assert.match(scheduler, /setTimeout/);
  assert.doesNotMatch(scheduler, /requestAnimationFrame/);
  assert.match(scheduler, /action !== this\.lastAction/);
  assert.match(stateMachine, /class PetStateMachine/);
  assert.match(css, /position:fixed/);
  assert.match(css, /z-index:260/);
  assert.match(css, /width:120px/);
  assert.match(css, /width:88px/);
  assert.match(css, /cursor:grabbing/);
  assert.ok(asset.size > 10_000);
});
