import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../app/entrance/auth-api.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { safeReturnTo, createAuthHandlers } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

test("water resumes with only one animation loop after visibility changes", async (t) => {
  const { startWater } = await import("../app/entrance/water-renderer.js");
  const constants = new Map();
  const gl = new Proxy({}, { get(_target, key) {
    if (key === "getExtension") return () => ({ loseContext() {} });
    if (key === "getShaderParameter" || key === "getProgramParameter") return () => true;
    if (key === "checkFramebufferStatus") return () => gl.FRAMEBUFFER_COMPLETE;
    if (key === "isContextLost") return () => false;
    if (typeof key === "string" && /^[A-Z_0-9]+$/.test(key)) {
      if (!constants.has(key)) constants.set(key, constants.size + 1);
      return constants.get(key);
    }
    return () => ({});
  } });
  const globals = { window: {}, document: { hidden: false }, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1 };
  for (const [key, value] of Object.entries(globals)) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    t.after(() => { if (previous) Object.defineProperty(globalThis, key, previous); else delete globalThis[key]; });
  }
  let nextId = 0;
  let visibility;
  const frames = new Map();
  const scope = {
    listen(target, type, handler) { if (type === "visibilitychange") visibility = handler; },
    frame(handler) { const id = ++nextId; frames.set(id, handler); return id; },
    cancelFrame(id) { frames.delete(id); }, onDispose() {},
  };
  startWater({ getElementById: () => ({ getContext: () => gl, style: {} }) }, scope);
  assert.equal(frames.size, 1);
  for (let index = 0; index < 4; index++) {
    document.hidden = true; visibility(); assert.equal(frames.size, 0);
    document.hidden = false; visibility(); visibility(); assert.equal(frames.size, 1);
  }
});

test("entrance rejects off-site and authentication-loop redirects", () => {
  for (const path of ["//evil.test", "https://evil.test", "/\\evil.test", "/api/auth/logout", "/login", "/", "/\nevil.test"]) {
    assert.equal(safeReturnTo(`?returnTo=${encodeURIComponent(path)}`), "/home");
  }
  assert.equal(safeReturnTo("?returnTo=%2Fforum"), "/forum");
  assert.equal(safeReturnTo(""), "/home");
});

test("login and registration use existing API payloads and require a real session", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    return Response.json(url === "/api/auth/session" ? { providers: {} } : { authenticated: true });
  });
  const prior = globalThis.window;
  globalThis.window = { location: { search: "" } };
  t.after(() => { if (prior === undefined) delete globalThis.window; else globalThis.window = prior; });
  const root = { getElementById: () => null, querySelector: () => null };
  const handlers = createAuthHandlers(root, new AbortController().signal);
  const login = await handlers.login({ identifier: "sample_user", password: "not-a-real-password1", remember: true });
  assert.equal(login.redirectTo, "/home");
  const request = calls.find((call) => call.url.endsWith("/login"));
  assert.deepEqual(JSON.parse(request.options.body), { loginIdentifier: "sample_user", password: "not-a-real-password1", remember: true });
  assert.equal(request.options.credentials, "same-origin");
  const registration = { username: "sample_user", password: "not-a-real-password1", confirmPassword: "not-a-real-password1" };
  assert.equal((await handlers.register(registration)).ok, true);
  assert.deepEqual(JSON.parse(calls.find((call) => call.url.endsWith("/register")).options.body), registration);
  assert.equal((await handlers.social({ provider: "microsoft" })).ok, false);
  t.mock.method(globalThis, "fetch", async () => new Response("<!doctype html>", { status: 502 }));
  const failure = await handlers.login({ identifier: "sample_user", password: "x", remember: false });
  assert.equal(failure.ok, false);
  assert.doesNotMatch(failure.message, /Unexpected|doctype/);
  t.mock.method(globalThis, "fetch", async () => Response.json({ authenticated: false }));
  assert.equal((await handlers.register(registration)).ok, false);
});

test("entrance is isolated, leaves old routes usable, and disposes animation work", async () => {
  const read = (file) => readFile(new URL(`../app/${file}`, import.meta.url), "utf8");
  const [page, template, runtime, water, effects, links, home, controller] = await Promise.all([
    "entrance/entrance-page.tsx", "entrance/entrance-template.tsx", "entrance/runtime.ts", "entrance/water-renderer.js", "site-effects.tsx", "course-links.ts", "home/page.tsx", "entrance/entrance-controller.js",
  ].map(read));
  assert.match(page, /attachShadow/);
  assert.doesNotMatch(page, /<iframe/);
  assert.match(template, /进入网站/);
  assert.doesNotMatch(template, /register-email/);
  assert.doesNotMatch(controller, /registerEmail/);
  assert.doesNotMatch(await read("register/register-client.tsx"), /type="email"|form\.email/);
  assert.match(template, /href="\/home"/);
  assert.match(links, /`\/home\?lang=/);
  assert.match(home, /learning-workspace/);
  assert.match(effects, /entrance \? null/);
  assert.match(runtime, /controller\.abort/);
  assert.match(runtime, /frames\.forEach\(cancelAnimationFrame\)/);
  assert.match(water, /WEBGL_lose_context/);
  assert.match(water, /document\.hidden/);
  assert.doesNotMatch(controller, /window\.WaterGate|Google 登录连接成功|账号创建成功。", redirectTo: ""/);
});
