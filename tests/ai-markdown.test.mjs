import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const renderAnswer = (text) => renderToStaticMarkup(
  React.createElement(Markdown, { remarkPlugins: [remarkGfm], skipHtml: true }, text),
);

test("AI answers render Markdown structure and code without raw markers", () => {
  const html = renderAnswer("## 下一步\n\n- **main** 是入口\n- `cout` 是输出\n\n```cpp\nint main() { return 0; }\n```");
  assert.match(html, /<h2>下一步<\/h2>/);
  assert.match(html, /<strong>main<\/strong>/);
  assert.match(html, /<code>cout<\/code>/);
  assert.match(html, /<pre><code class="language-cpp">/);
  assert.doesNotMatch(html, /```|\*\*main\*\*/);
});

test("AI Markdown does not inject HTML or unsafe links", () => {
  const html = renderAnswer('<script>alert(1)</script>\n\n[open](javascript:alert(1))');
  assert.doesNotMatch(html, /<script|href="javascript:/i);
});

test("chat and search use Markdown only for AI output", async () => {
  const source = await readFile(new URL("../app/learning-workspace.tsx", import.meta.url), "utf8");
  assert.match(source, /<AiMarkdown text=\{searchResult\.answer\}/);
  assert.match(source, /message\.role === "ai" \? <AiMarkdown text=\{message\.text\} \/> : message\.text/);
});
