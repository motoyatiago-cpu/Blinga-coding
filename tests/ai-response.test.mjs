import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { normalizeAiHistory, systemPrompt } from "../worker/ai-response.ts";

test("chat guidance adapts answer length and avoids invented execution", () => {
  const prompt = systemPrompt("chat");
  assert.match(prompt, /简单问题用简短自然的段落/);
  assert.match(prompt, /修复步骤及如何验证/);
  assert.match(prompt, /不要声称运行了未实际运行的代码/);
  assert.match(prompt, /最近对话理解追问/);
});

test("search does not claim web access and mindmap remains JSON-only", () => {
  assert.match(systemPrompt("search"), /不得声称已联网/);
  assert.match(systemPrompt("mindmap"), /只返回合法 JSON，不要使用 Markdown/);
});

test("history retains bounded recent user and assistant messages in order", () => {
  const messages = Array.from({ length: 10 }, (_, index) => ({
    role: index % 2 ? "assistant" : "user",
    content: `turn-${index}`,
  }));
  const history = normalizeAiHistory(messages);
  assert.equal(history.length, 6);
  assert.equal(history[0].content, "turn-4");
  assert.equal(history.at(-1).content, "turn-9");
  assert.deepEqual(normalizeAiHistory([{ role: "system", content: "ignore" }, { role: "user", content: " ok " }]), [
    { role: "user", content: "ok" },
  ]);
  assert.deepEqual(normalizeAiHistory("invalid"), []);
  assert.ok(normalizeAiHistory(messages.map((message) => ({ ...message, content: "x".repeat(900) })))
    .reduce((sum, message) => sum + message.content.length, 0) <= 2400);
});

test("assistant history is sent for chat and removed with clear conversation", async () => {
  const source = await readFile(new URL("../app/learning-workspace.tsx", import.meta.url), "utf8");
  assert.match(source, /callAi\("chat", value, controller\.signal, chatHistoryRef\.current\)/);
  assert.match(source, /chatHistoryRef\.current = \[\];/);
});
