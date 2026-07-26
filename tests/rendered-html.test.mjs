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
  assert.match(html, /全站课程与 AI 搜索/);
  assert.match(html, /AI 深度搜索/);
  assert.match(html, /清空/);
  assert.match(html, /发送问题/);
  assert.match(html, /code-line-numbers/);
  assert.match(html, /Tab 缩进/);
  assert.match(html, /专注模式/);
  assert.match(html, /⇧ 导入/);
  assert.match(html, /⇩ 下载/);
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

test("indexes every independent lesson for instant course search", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /const courseSearchIndex: CourseSearchItem\[\]/);
  assert.match(page, /function findCourseMatches\(query: string\)/);
  assert.match(page, /terms\.every\(\(term\) => item\.searchText\.includes\(term\)\)/);
  assert.match(page, /navigateToCourse\(item\.language, item\.topicIndex, true\)/);
  assert.match(page, /即时课程匹配/);
});

test("makes AI requests cancellable and time-bounded", async () => {
  const [page, worker] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /function stopAiAnswer\(\)/);
  assert.match(page, /chatAbortRef\.current\?\.abort\(\)/);
  assert.match(page, /container\.scrollTo\(\{ top: container\.scrollHeight, behavior: "smooth" \}\)/);
  assert.match(page, /aria-label=\{aiBusy \? "停止 AI 回答" : "发送问题"\}/);
  assert.match(worker, /const AI_UPSTREAM_TIMEOUT_MS = 45_000/);
  assert.match(worker, /signal: controller\.signal/);
  assert.match(worker, /AI 服务响应超时，请稍后重试/);
});

test("keeps editor line numbers, cursor position, and indentation synchronized", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /const lineNumbers = useMemo/);
  assert.match(page, /function syncEditorScroll/);
  assert.match(page, /lineNumbersRef\.current\.scrollTop = event\.currentTarget\.scrollTop/);
  assert.match(page, /function handleEditorKeyDown/);
  assert.match(page, /event\.key !== "Tab"/);
  assert.match(page, /Ln \{cursorPosition\.line\}, Col \{cursorPosition\.column\}/);
});

test("provides a reversible sandbox focus mode", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /const \[focusMode, setFocusMode\] = useState\(false\)/);
  assert.match(page, /document\.body\.style\.overflow = "hidden"/);
  assert.match(page, /event\.key === "Escape"/);
  assert.match(page, /aria-pressed=\{focusMode\}/);
  assert.match(css, /\.sandbox-focus-mode\{position:fixed!important/);
  assert.match(css, /\.sandbox-focus-mode \.run-history\{display:none\}/);
});

test("imports and downloads source files without an upload endpoint", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /const sourceFileExtensions: Record<Lang, string\[\]>/);
  assert.match(page, /async function importSourceFile/);
  assert.match(page, /await file\.text\(\)/);
  assert.match(page, /importedCode\.includes\("\\u0000"\)/);
  assert.match(page, /function downloadSourceFile\(\)/);
  assert.match(page, /new Blob\(\[code\], \{ type: "text\/plain;charset=utf-8" \}\)/);
  assert.doesNotMatch(page, /fetch\([^)]*importSourceFile/);
});

test("protects source reset with confirmation and a timed undo", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /useState<"idle" \| "confirm" \| "undo">\("idle"\)/);
  assert.match(page, /resetSnapshotRef/);
  assert.match(page, /再次点击“确认重置”将恢复课程初始代码/);
  assert.match(page, /已重置，可在 10 秒内撤销/);
  assert.match(page, /resetAction === "confirm"/);
  assert.match(page, /resetAction === "undo"/);
  assert.match(css, /\.editor-file-actions button\.reset-confirm/);
  assert.match(css, /\.editor-file-actions button\.reset-undo/);
});

test("adds a reusable and reduced-motion-safe GSAP hover layer", async () => {
  const [motion, layout, css, packageJson] = await Promise.all([
    readFile(new URL("../app/hover-bounce.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(motion, /export function bindHoverBounce/);
  assert.match(motion, /gsap\.utils\.toArray<HTMLElement>\("\.hover-bounce"/);
  assert.match(motion, /duration: 0\.8/);
  assert.match(motion, /scale: 1\.1/);
  assert.match(motion, /ease: "elastic\.out\(1, 0\.3\)"/);
  assert.match(motion, /duration: 0\.5/);
  assert.match(motion, /ease: "elastic\.out\(1, 0\.5\)"/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
  assert.match(motion, /new MutationObserver/);
  assert.match(layout, /<HoverBounceMotion \/>/);
  assert.match(css, /\.hover-bounce\{/);
  assert.match(packageJson, /"gsap":/);
});
