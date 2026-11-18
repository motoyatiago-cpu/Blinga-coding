import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../worker/code-runner.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { runSubmission, RunnerError } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const completed = { status: { id: 3, description: "Accepted" }, stdout: "b2sK", exit_code: 0 };

test("queued submissions are submitted once and polled until a terminal result", async (t) => {
  const responses = [{ token: "test-submission" }, { status: { id: 2, description: "Processing" } }, completed];
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url: String(url), init });
    return Response.json(responses.shift());
  });
  const result = await runSubmission("https://runner.test", { "X-Auth-Token": "test-only" }, { source_code: "example" }, new AbortController().signal);
  assert.deepEqual(result, completed);
  assert.equal(calls.length, 3);
  assert.equal(calls.filter(({ init }) => init.method === "POST").length, 1);
  assert.equal(new URL(calls[0].url).searchParams.get("wait"), "false");
  for (const call of calls.slice(1)) {
    assert.equal(call.init.method, "GET");
    assert.equal(new URL(call.url).pathname, "/submissions/test-submission");
    assert.equal(new URL(call.url).searchParams.get("base64_encoded"), "true");
    assert.equal(call.init.headers["X-Auth-Token"], "test-only");
  }
});

test("completed upstream responses require no extra poll", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => Response.json(completed));
  assert.deepEqual(await runSubmission("https://runner.test", {}, {}, new AbortController().signal), completed);
  assert.equal(fetch.mock.callCount(), 1);
});

test("invalid and unqueryable upstream responses fail without treating them as student errors", async (t) => {
  for (const payload of [null, [], {}, { status: { id: 1 } }, { token: "../other" }, { status: { id: 0 } }, { status: { id: 3 }, stdout: {} }]) {
    const fetch = t.mock.method(globalThis, "fetch", async () => Response.json(payload));
    await assert.rejects(runSubmission("https://runner.test", {}, {}, new AbortController().signal), (error) => error instanceof RunnerError && error.httpStatus === 502);
    assert.equal(fetch.mock.callCount(), 1);
    fetch.mock.restore();
  }
});

test("upstream outages and non-JSON responses are reported as service errors", async (t) => {
  for (const response of [new Response("Unavailable", { status: 503 }), new Response("<html>proxy error</html>")]) {
    const fetch = t.mock.method(globalThis, "fetch", async () => response);
    await assert.rejects(runSubmission("https://runner.test", {}, {}, new AbortController().signal), (error) => error instanceof RunnerError && error.httpStatus === 502);
    fetch.mock.restore();
  }
});

test("cancellation interrupts queued polling without submitting the code again", async (t) => {
  const controller = new AbortController();
  let polled;
  const firstPoll = new Promise((resolve) => { polled = resolve; });
  const fetch = t.mock.method(globalThis, "fetch", async (_url, init) => {
    if (init.method === "POST") return Response.json({ token: "queued-task" });
    polled();
    return Response.json({ status: { id: 1 } });
  });
  const pending = runSubmission("https://runner.test", {}, {}, controller.signal);
  await firstPoll;
  await new Promise((resolve) => setImmediate(resolve));
  controller.abort(new DOMException("deadline", "TimeoutError"));
  await assert.rejects(pending, { name: "TimeoutError" });
  assert.equal(fetch.mock.callCount(), 2);
});
