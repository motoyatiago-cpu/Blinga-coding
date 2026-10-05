import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function source(path) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

async function importTypescript(path) {
  const input = await source(path);
  const { outputText } = ts.transpileModule(input, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}

test("defines two concise project blueprints and one runnable example for every course language", async () => {
  const data = await importTypescript("../data/project-blueprints.ts");
  assert.deepEqual(data.PROJECT_LANGUAGE_SLUGS, ["python", "c-cpp", "javascript", "java"]);
  assert.equal(data.PROJECT_BLUEPRINTS.length, 8);

  for (const language of data.PROJECT_LANGUAGE_SLUGS) {
    const projects = data.getProjectsForLanguage(language);
    assert.equal(projects.length, 2);
    assert.equal(projects.filter((project) => project.runnable).length, 1);
    for (const project of projects) {
      assert.equal(project.milestones.length, 3);
      assert.ok(project.successCriteria.length >= 3);
      assert.ok(project.starterCode.length > 20);
      assert.ok(project.milestones.every((milestone) => milestone.topicIndex >= 0 && milestone.topicIndex <= 6));
      assert.equal(new Set(project.milestones.map((milestone) => milestone.id)).size, project.milestones.length);
    }
  }
});

test("catalog and detail routes are server-first with a focused interactive workflow", async () => {
  const [catalog, detail, workflow, course, css] = await Promise.all([
    source("../app/projects/page.tsx"),
    source("../app/projects/[language]/[project]/page.tsx"),
    source("../app/projects/project-workflow.tsx"),
    source("../app/courses/[language]/page.tsx"),
    source("../app/projects/projects.css"),
  ]);

  assert.doesNotMatch(catalog, /"use client"/);
  assert.doesNotMatch(detail, /"use client"/);
  assert.match(detail, /notFound\(\)/);
  assert.match(workflow, /^"use client"/);
  assert.match(workflow, /fetch\("\/api\/auth\/session"/);
  assert.match(workflow, /\/api\/projects\/progress\?language=/);
  assert.match(workflow, /fetch\("\/api\/run"/);
  assert.match(workflow, /auth === "guest"/);
  assert.match(workflow, /disabled=\{auth !== "authenticated"/);
  assert.match(workflow, /aria-live="polite"/);
  assert.match(course, /href=\{`\/projects#\$\{slug\}`\}>项目实战/);
  assert.match(css, /min-height:44px/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /@media \(max-width:560px\)/);
  assert.match(css, /:focus-visible/);
});

test("project progress API is authenticated, owner-scoped, bounded, and CSRF protected", async () => {
  const [worker, migration, schema, profile] = await Promise.all([
    source("../worker/projects.ts"),
    source("../drizzle/0015_project_learning.sql"),
    source("../db/schema.ts"),
    source("../worker/profile.ts"),
  ]);

  assert.match(worker, /resolvePrincipal\(request, env\)/);
  assert.match(worker, /if \(!principal\).*401/);
  assert.match(worker, /sameOrigin\(request\)/);
  assert.match(worker, /MAX_REQUEST_BYTES = 2_048/);
  assert.match(worker, /MAX_WRITES_PER_MINUTE = 20/);
  assert.match(worker, /owner_key = \? AND language = \? AND project_slug = \?/);
  assert.match(worker, /VALID_STATUSES\.has\(status\)/);
  assert.match(worker, /"Cache-Control": "no-store"/);
  assert.match(worker, /"Retry-After": "60"/);
  assert.doesNotMatch(worker, /body\.(?:userId|ownerKey)/);

  assert.match(migration, /CREATE TABLE `project_progress`/);
  assert.match(migration, /PRIMARY KEY\(`owner_key`, `language`, `project_slug`\)/);
  assert.match(migration, /project_progress_owner_updated_idx/);
  assert.match(migration, /PRAGMA optimize/);
  assert.match(schema, /export const projectProgress/);
  assert.match(profile, /\["projectProgress", "project_progress", "owner_key"\]/);
  assert.match(profile, /table === "project_progress"\s*\? "owner_key"/);
});
