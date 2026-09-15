import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../app/profile/profile-particles.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { startProfileParticles } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

function setup(t) {
  const frames = new Map(), listeners = new Map();
  let id = 0, disconnected = false, drawn = 0;
  const events = (prefix) => ({
    addEventListener(name, fn) { listeners.set(`${prefix}:${name}`, fn); },
    removeEventListener(name) { listeners.delete(`${prefix}:${name}`); },
  });
  const globals = {
    window: { devicePixelRatio: 2, ...events("window") },
    document: { hidden: false, documentElement: { dataset: { theme: "dark" } }, ...events("document") },
    requestAnimationFrame(fn) { frames.set(++id, fn); return id; },
    cancelAnimationFrame(key) { frames.delete(key); },
    MutationObserver: class { observe() {} disconnect() { disconnected = true; } },
  };
  for (const [key, value] of Object.entries(globals)) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    t.after(() => previous ? Object.defineProperty(globalThis, key, previous) : delete globalThis[key]);
  }
  const ctx = new Proxy({}, { get(_target, key) {
    if (key === "arc") return (...args) => { assert.ok(args.every(Number.isFinite)); drawn++; };
    return () => {};
  }, set() { return true; } });
  const canvas = { clientWidth: 1200, clientHeight: 800, parentElement: { dataset: {} },
    getContext: () => ctx, getBoundingClientRect: () => ({ left: 0, top: 0 }), ...events("canvas") };
  return { canvas, frames, listeners, doc: globals.document,
    disconnected: () => disconnected, drawn: () => drawn };
}

test("particle loop pauses in hidden tabs, resumes once, and fully disposes", (t) => {
  const m = setup(t);
  const stop = startProfileParticles(m.canvas, false);
  assert.equal(m.frames.size, 1);
  const [id, fn] = m.frames.entries().next().value;
  m.frames.delete(id); fn(16);
  assert.ok(m.drawn() > 0);
  assert.equal(m.frames.size, 1);
  m.doc.hidden = true;
  m.listeners.get("document:visibilitychange")();
  assert.equal(m.frames.size, 0);
  assert.equal(m.canvas.parentElement.dataset.paused, "true");
  m.doc.hidden = false;
  m.listeners.get("document:visibilitychange")();
  m.listeners.get("document:visibilitychange")();
  assert.equal(m.frames.size, 1);
  stop();
  assert.equal(m.frames.size, 0);
  assert.equal(m.listeners.size, 0);
  assert.equal(m.disconnected(), true);
});

test("reduced motion paints a still scene without an animation loop", (t) => {
  const m = setup(t);
  const stop = startProfileParticles(m.canvas, true);
  assert.ok(m.drawn() > 0);
  assert.equal(m.frames.size, 0);
  stop();
  assert.equal(m.listeners.size, 0);
});

test("entry crossfades only after readiness and unmounts its overlay", async () => {
  const entry = await readFile(new URL("../app/profile/profile-entry.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/profile/profile-entry.css", import.meta.url), "utf8");
  assert.match(entry, /if \(!ready \|\| phase !== "loading"\) return/);
  assert.match(entry, /phase !== "done" && <div/);
  assert.match(entry, /inert=\{phase !== "done"\}/);
  assert.match(entry, /clearTimeout\(timer\)/);
  assert.match(css, /transition:opacity 600ms ease/);
  assert.match(css, /html\[data-theme="light"\]/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
