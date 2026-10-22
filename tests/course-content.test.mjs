import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

async function loadCourseModule() {
  const source = await readFile(new URL("../data/course-content/index.ts", import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const moduleRecord = { exports: {} };
  vm.runInNewContext(output, {
    module: moduleRecord,
    exports: moduleRecord.exports,
    Object,
    Set,
    Error,
  });
  return moduleRecord.exports;
}

test("four courses expose ten complete lessons without moving legacy indexes", async () => {
  const { courseDefinitions, validateCourseContent } = await loadCourseModule();
  assert.doesNotThrow(() => validateCourseContent());
  assert.deepEqual(Object.keys(courseDefinitions), ["Python", "C/C++", "JavaScript", "Java"]);

  const expectedPrefixes = {
    Python: "python",
    "C/C++": "cpp",
    JavaScript: "javascript",
    Java: "java",
  };
  for (const [language, course] of Object.entries(courseDefinitions)) {
    assert.equal(course.lessons.length, 10, language);
    assert.equal(
      course.lessons.slice(0, 7).map((lesson) => lesson.id).join(","),
      Array.from({ length: 7 }, (_, index) => `${expectedPrefixes[language]}-${String(index + 1).padStart(2, "0")}`).join(","),
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
