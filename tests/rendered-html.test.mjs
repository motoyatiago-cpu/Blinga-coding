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
  assert.match(html, /UTF-8 · Ln/);
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

test("keeps the AI assistant in an accessible right-edge dock", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /className=\{`chat-dock \$\{chatOpen \? "open" : ""\}`\}/);
  assert.match(page, /aria-expanded=\{chatOpen\}/);
  assert.match(page, /aria-controls="ai-programming-assistant"/);
  assert.match(page, /id="ai-programming-assistant"/);
  assert.match(css, /\.chat-dock\{\s*position:fixed;\s*right:0!important;\s*left:auto!important/);
  assert.match(css, /transform:translate3d\(calc\(100% - 42px\),0,0\)/);
  assert.match(css, /\.chat-dock:hover,\s*\.chat-dock:focus-within,\s*\.chat-dock\.open/);
  assert.match(css, /@media\(hover:none\),\(pointer:coarse\)/);
  assert.doesNotMatch(css, /button\.hover-bounce\{\s*position:relative/);
});

test("adds macOS graphite code surfaces and isolated Lenis scrolling", async () => {
  const [smoothScroll, layout, css, packageJson, page] = await Promise.all([
    readFile(new URL("../app/smooth-scroll.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(smoothScroll, /new Lenis\(\{/);
  assert.match(smoothScroll, /autoRaf: true/);
  assert.match(smoothScroll, /duration: 1\.05/);
  assert.match(smoothScroll, /anchors: \{ offset: -82 \}/);
  assert.match(smoothScroll, /data-lenis-prevent/);
  assert.match(smoothScroll, /prefers-reduced-motion: reduce/);
  assert.match(smoothScroll, /\.graph-shell/);
  assert.doesNotMatch(smoothScroll, /allowNestedScroll/);
  assert.match(layout, /<SmoothScrollMotion \/>/);
  assert.match(layout, /lenis\/dist\/lenis\.css/);
  assert.match(packageJson, /"lenis":/);
  assert.match(css, /--mac-graphite:#0d1118/);
  assert.match(css, /--xcode-titlebar-top:#30323a/);
  assert.match(css, /\.pane-head::before,\s*\.run-history-head::before,\s*\.mac-code-head::before/);
  assert.match(css, /box-shadow:18px 0 var\(--xcode-yellow\),36px 0 var\(--xcode-green\)/);
  assert.match(css, /\.terminal-pane>pre\{/);
  assert.match(css, /\.stdin-panel textarea\{/);
  assert.match(css, /\.code-line-numbers\{/);
  assert.match(page, /className="mac-code-head" aria-hidden="true"/);
  assert.match(css, /"SFMono-Regular","SF Mono",Menlo,Monaco,Consolas/);
});

test("removes decorative and redundant UI prompts while preserving status feedback", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(page, /拖拽节点，直接编辑内容，并用颜色标记核心考点/);
  assert.doesNotMatch(page, /输入变化即时诊断，运行状态与终端结果动态同步/);
  assert.doesNotMatch(page, /仅保存状态与性能数据，不保存代码、输入和输出/);
  assert.doesNotMatch(page, /即时匹配全部课程，需要时再使用 AI 深度解释/);
  assert.doesNotMatch(page, /AI 学习建议/);
  assert.doesNotMatch(page, /图谱核心交互保持不变，导出由独立文档层完成/);
  assert.doesNotMatch(page, /Tab 缩进 · Ctrl↵ 运行/);
  assert.doesNotMatch(page, /⌘ K/);
  assert.match(page, /\{draftStatus\}/);
  assert.match(page, /statusDescription/);
  assert.match(page, /aria-live="polite"/);
});

test("applies the Blinga coding V2 product design system without replacing feature modules", async () => {
  const [css, page, motion, smoothScroll] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/hover-bounce.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/smooth-scroll.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(css, /Blinga coding V2/);
  assert.match(css, /--accent:#7182ff/);
  assert.match(css, /--radius-lg:24px/);
  assert.match(css, /@view-transition\{\s*navigation:auto/);
  assert.match(css, /\.chat\{\s*right:18px/);
  assert.match(css, /\.graph-shell\{/);
  assert.match(css, /\.sandbox\{/);
  assert.match(page, /<StableKnowledgeGraph lesson=\{lesson\} code=\{lesson\.code\}/);
  assert.match(page, /<StableSandbox lang=\{lang\}/);
  assert.match(page, /\/api\/ai/);
  assert.match(motion, /gsap\.utils\.toArray/);
  assert.match(smoothScroll, /new Lenis/);
});
