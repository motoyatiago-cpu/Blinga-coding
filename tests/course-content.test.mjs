import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

import { loadCourseModule } from "./helpers/course-module.mjs";

test("six courses expose 68 complete lessons without moving legacy indexes", async () => {
  const { courseDefinitions, validateCourseContent } = await loadCourseModule();
  assert.doesNotThrow(() => validateCourseContent());
  assert.deepEqual(Object.keys(courseDefinitions), ["Python", "C/C++", "JavaScript", "Java", "TypeScript", "Go"]);
  assert.equal(Object.values(courseDefinitions).reduce((sum, course) => sum + course.lessons.length, 0), 68);

  const expectedPrefixes = {
    Python: "python",
    "C/C++": "cpp",
    JavaScript: "javascript",
    Java: "java",
    TypeScript: "typescript",
    Go: "go",
  };
  for (const [language, course] of Object.entries(courseDefinitions)) {
    const original = !["Go", "TypeScript"].includes(language);
    assert.equal(course.lessons.length, original ? 12 : 10, language);
    assert.equal(
      course.lessons.slice(0, 10).map((lesson) => lesson.id).join(","),
      Array.from({ length: 10 }, (_, index) => `${expectedPrefixes[language]}-${String(index + 1).padStart(2, "0")}`).join(","),
    );
    for (const lesson of course.lessons) {
      assert.equal(lesson.objectives.length, 3);
      assert.equal(lesson.concepts.length, 3);
      assert.equal(lesson.commonErrors.length, 3);
      assert.equal(lesson.exercises.map((exercise) => exercise.level).join(","), "初级,进阶,挑战");
      assert.equal(lesson.judge.expected, lesson.output);
      assert.match(lesson.lastReviewedAt, /^\d{4}-\d{2}-\d{2}$/);
      assert.equal(lesson.contentLicense, "MIT");
    }
  }
});

test("source registry is traceable and pins Exercism revisions", async () => {
  const { contentSources, courseDefinitions } = await loadCourseModule();
  const ids = new Set(contentSources.map((source) => source.id));
  for (const source of contentSources) {
    assert.match(source.sourceUrl, /^https:\/\//);
    assert.match(source.licenseUrl, /^https:\/\//);
    assert.ok(source.license);
    assert.ok(source.modificationSummary);
    if (source.usageType === "coverage_audit") assert.match(source.sourceRevision, /^[0-9a-f]{40}$/);
  }
  for (const course of Object.values(courseDefinitions)) {
    for (const lesson of course.lessons) {
      for (const sourceId of lesson.sourceRefs) assert.ok(ids.has(sourceId), `${lesson.id}: ${sourceId}`);
    }
  }
});

test("legacy progress gains new language defaults without losing old indexes", () => {
  const { normalizeCourseTopics } = loadCourseModule();
  const old = { Python: 9, "C/C++": 4, JavaScript: 6, Java: 2 };
  const result = normalizeCourseTopics(old);
  for (const [language, index] of Object.entries(old)) assert.equal(result[language], index);
  assert.equal(result.TypeScript, 0);
  assert.equal(result.Go, 0);
  assert.deepEqual(Object.keys(old), ["Python", "C/C++", "JavaScript", "Java"]);
  const invalid = normalizeCourseTopics({ Python: 999, Go: -2, TypeScript: NaN, Java: "4" });
  assert.equal(invalid.Python, 11);
  assert.equal(invalid.Go, 0);
  assert.equal(invalid.TypeScript, 0);
  assert.equal(invalid.Java, 0);
});

test("all TypeScript examples pass strict type checking and match their output", async () => {
  const { courseDefinitions } = loadCourseModule();
  const options = { strict: true, noEmit: true, types: [], target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, skipLibCheck: true };
  const host = ts.createCompilerHost(options);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  for (const lesson of courseDefinitions.TypeScript.lessons) {
    const file = `${process.cwd().replaceAll("\\", "/")}/${lesson.id}.ts`;
    host.getSourceFile = (name, version, onError, fresh) => name === file
      ? ts.createSourceFile(name, lesson.code, version, true)
      : originalGetSourceFile(name, version, onError, fresh);
    const program = ts.createProgram([file], options, host);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, `${lesson.id}: ${diagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, "\n")).join("\n")}`);
    const lines = [];
    const js = ts.transpileModule(lesson.code, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
    const result = vm.runInNewContext(js, { console: { log: (...values) => lines.push(values.join(" ")) } }, { timeout: 1000 });
    if (result && typeof result.then === "function") await result;
    assert.equal(lines.join("\n"), lesson.output, lesson.id);
  }
});

test("all JavaScript examples execute with their documented output", async () => {
  const { courseDefinitions } = await loadCourseModule();
  for (const lesson of courseDefinitions.JavaScript.lessons) {
    const lines = [];
    const context = {
      console: {
        log: (...values) => lines.push(values.join(" ")),
        error: (...values) => lines.push(values.join(" ")),
      },
      setTimeout,
      clearTimeout,
      Promise,
      Array,
      Number,
      Error,
      TypeError,
    };
    const result = vm.runInNewContext(lesson.code, context, { filename: `${lesson.id}.js` });
    if (result && typeof result.then === "function") await result;
    assert.equal(lines.join("\n"), lesson.output, lesson.id);
  }
});

test("catalog, workspace, search and judge consume the unified source", async () => {
  const [workspace, catalog, worker, notices] = await Promise.all([
    readFile(new URL("../app/learning-workspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/courses/[language]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../THIRD_PARTY_NOTICES.md", import.meta.url), "utf8"),
  ]);
  assert.match(workspace, /from "\.\.\/data\/course-content"/);
  assert.match(workspace, /\.\.\.course\.objectives/);
  assert.match(workspace, /className="lesson-sources"/);
  assert.match(catalog, /courseDefinitions/);
  assert.match(worker, /lessonJudgeCases/);
  assert.match(notices, /Mozilla Contributors/);
  assert.match(notices, /6105f6d9d3ef66ce3d5c8f529d2882af3d76b706/);
});
