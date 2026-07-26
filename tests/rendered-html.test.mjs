import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Blinga coding learning workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Blinga coding · AI 编程学习平台<\/title>/i);
  assert.match(html, /学习中心/);
  assert.match(html, /Python 循环结构/);
  assert.match(html, /动态知识图谱/);
  assert.match(html, /在线实训沙盒/);
  assert.match(html, /我的学习笔记/);
  assert.match(html, /停止输入 500ms 后自动保存/);
  assert.doesNotMatch(html, /Codex is working|Your site is taking shape/);
});

test("keeps the notes endpoint and persistent schema wired together", async () => {
  const [page, worker, schema, hosting] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /fetch\(`\/api\/notes\?\$\{params\}`/);
  assert.match(page, /setTimeout\(async \(\) => \{/);
  assert.match(page, /\}, 500\)/);
  assert.match(worker, /url\.pathname === "\/api\/notes"/);
  assert.match(worker, /ON CONFLICT\(user_email, language, topic_index\) DO UPDATE/);
  assert.match(schema, /sqliteTable\("learning_notes"/);
  assert.match(hosting, /"d1": "DB"/);
});
