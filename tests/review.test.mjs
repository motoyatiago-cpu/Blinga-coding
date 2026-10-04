import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import worker from "../dist/server/index.js";

function createBinding(db) {
  return {
    prepare(sql) {
      let args = [];
      return {
        bind(...values) { args = values; return this; },
        async first(column) {
          const row = db.prepare(sql).get(...args) || null;
          return column ? row?.[column] : row;
        },
        async all() { return { results: db.prepare(sql).all(...args), success: true }; },
        runSync() {
          const result = db.prepare(sql).run(...args);
          return {
            success: true,
            meta: {
              changes: Number(result.changes),
              last_row_id: Number(result.lastInsertRowid),
            },
          };
        },
        async run() { return this.runSync(); },
      };
    },
    async batch(statements) {
      db.exec("BEGIN");
      try {
        const results = statements.map((statement) => statement.runSync());
        db.exec("COMMIT");
        return results;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

function fixture(t) {
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  for (const file of readdirSync(new URL("../drizzle/", import.meta.url)).filter((name) => name.endsWith(".sql")).sort()) {
    db.exec(readFileSync(new URL(`../drizzle/${file}`, import.meta.url), "utf8"));
  }
  const tokens = {};
  for (const name of ["alice", "bob"]) {
    db.prepare("INSERT INTO users (id, display_name, username) VALUES (?, ?, ?)").run(name, name, name);
    tokens[name] = randomUUID();
    const hash = createHash("sha256").update(tokens[name]).digest("base64url");
    db.prepare("INSERT INTO auth_sessions (id, token_hash, user_id, expires_at) VALUES (?, ?, ?, datetime('now', '+1 day'))")
      .run(randomUUID(), hash, name);
  }
  const binding = createBinding(db);
  async function request(path, method = "GET", user = null, body, origin = "https://review.test") {
    const headers = { Origin: origin, "Content-Type": "application/json" };
    if (user) headers.Cookie = `__Host-blinga_session=${tokens[user] || user}`;
    return worker.fetch(new Request(`https://review.test${path}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }), { DB: binding, CODE_RUNNER_URL: "https://runner.test" }, { waitUntil() {} });
  }
  return { db, request };
}

function mockRunner(t, stdout) {
  t.mock.method(globalThis, "fetch", async (url) => {
    assert.match(String(url), /^https:\/\/runner\.test\/submissions/);
    return Response.json({
      stdout: Buffer.from(stdout).toString("base64"),
      stderr: "",
      compile_output: "",
      message: "",
      status: { id: 3, description: "Accepted" },
      time: "0.01",
      memory: 1024,
      exit_code: 0,
    });
  });
}

test("review migration is additive and preserves existing run history", () => {
  const db = new DatabaseSync(":memory:");
  try {
    const migrations = readdirSync(new URL("../drizzle/", import.meta.url)).filter((name) => name.endsWith(".sql")).sort();
    for (const file of migrations.filter((name) => name < "0013")) {
      db.exec(readFileSync(new URL(`../drizzle/${file}`, import.meta.url), "utf8"));
    }
    db.prepare(`
      INSERT INTO code_run_history (
        user_email, language, topic_index, mode, status_id, status_description, source_code
      ) VALUES ('user:legacy', 'Python', 0, 'judge', 4, 'Wrong Answer', 'print(1)')
    `).run();
    db.exec(readFileSync(new URL("../drizzle/0013_learning_review.sql", import.meta.url), "utf8"));
    assert.equal(db.prepare("SELECT source_code FROM code_run_history WHERE user_email = 'user:legacy'").get().source_code, "print(1)");
    assert.equal(db.prepare("SELECT COUNT(*) count FROM learning_mastery").get().count, 0);
    assert.equal(db.prepare("SELECT COUNT(*) count FROM wrong_answers").get().count, 0);
  } finally {
    db.close();
  }
});

test("review API requires authentication and never exposes another user's records", async (t) => {
  const { db, request } = fixture(t);
  db.prepare(`
    INSERT INTO wrong_answers (user_key, user_id, language, topic_index, error_summary, source_code)
    VALUES ('user:alice', 'alice', 'Python', 1, 'private error', 'private source')
  `).run();
  const id = Number(db.prepare("SELECT id FROM wrong_answers").get().id);
  assert.equal((await request("/api/review")).status, 401);
  assert.equal((await request("/api/review", "GET", "forged")).status, 401);
  assert.equal((await request(`/api/review/${id}`, "GET", "bob")).status, 404);
  assert.equal((await request(`/api/review/${id}`, "PATCH", "bob", { action: "reviewed" })).status, 404);
  const bobList = await (await request("/api/review", "GET", "bob")).json();
  assert.deepEqual(bobList.queue, []);
  assert.doesNotMatch(JSON.stringify(bobList), /private error|private source/);
});

test("run and judge outcomes drive explainable mastery transitions and capped snapshots", async (t) => {
  const { db, request } = fixture(t);
  mockRunner(t, "not the expected output");
  const longCode = "x".repeat(13_000);

  const run = await request("/api/run", "POST", "alice", {
    language: "Python", topicIndex: 2, code: longCode, judge: false,
  });
  assert.equal(run.status, 200);
  assert.equal(db.prepare("SELECT state FROM learning_mastery WHERE user_key = 'user:alice'").get().state, "learning");
  assert.equal(db.prepare("SELECT COUNT(*) count FROM wrong_answers").get().count, 0);

  const failed = await request("/api/run", "POST", "alice", {
    language: "Python", topicIndex: 2, code: longCode, judge: true,
  });
  assert.equal(failed.status, 200);
  const failedBody = await failed.json();
  assert.equal(failedBody.judge.passed, 2);
  const wrong = db.prepare("SELECT * FROM wrong_answers WHERE user_key = 'user:alice'").get();
  assert.equal(wrong.source_code.length, 12_000);
  assert.ok(wrong.error_summary.length <= 1_000);
  assert.ok(wrong.run_id > 0);
  const learning = db.prepare("SELECT * FROM learning_mastery WHERE user_key = 'user:alice'").get();
  assert.equal(learning.state, "learning");
  assert.equal(learning.failed_judges, 1);

  globalThis.fetch.mock.mockImplementation(async () => Response.json({
    stdout: Buffer.from("合格").toString("base64"), stderr: "", compile_output: "", message: "",
    status: { id: 3, description: "Accepted" }, time: "0.01", memory: 1024, exit_code: 0,
  }));
  const passed = await request("/api/run", "POST", "alice", {
    language: "Python", topicIndex: 2, code: "print('合格')", judge: true,
  });
  assert.equal(passed.status, 200);
  const mastered = db.prepare("SELECT * FROM learning_mastery WHERE user_key = 'user:alice'").get();
  assert.equal(mastered.state, "mastered");
  assert.equal(mastered.successful_judges, 1);
  assert.ok(new Date(`${mastered.review_due_at}Z`) > new Date());
  assert.equal(db.prepare("SELECT status FROM wrong_answers WHERE user_key = 'user:alice'").get().status, "reviewed");

  db.prepare("UPDATE learning_mastery SET review_due_at = datetime('now', '-1 minute') WHERE user_key = 'user:alice'").run();
  const list = await (await request("/api/review", "GET", "alice")).json();
  assert.equal(list.mastery[0].state, "review_due");
  assert.equal(list.stats.reviewDue, 1);
  assert.equal(list.stats.pending, 0);
});

test("review mutations enforce origin, validate limits, and support retry handoff", async (t) => {
  const { db, request } = fixture(t);
  db.prepare(`
    INSERT INTO wrong_answers (user_key, user_id, language, topic_index, run_id, error_summary, source_code)
    VALUES ('user:alice', 'alice', 'JavaScript', 4, 99, 'output mismatch', 'console.log(4)')
  `).run();
  const id = Number(db.prepare("SELECT id FROM wrong_answers").get().id);
  assert.equal((await request("/api/review?limit=0", "GET", "alice")).status, 400);
  assert.equal((await request("/api/review?limit=51", "GET", "alice")).status, 400);
  assert.equal((await request("/api/review?cursor=nope", "GET", "alice")).status, 400);
  assert.equal((await request(`/api/review/${id}`, "PATCH", "alice", { action: "retry" }, "https://evil.test")).status, 403);
  assert.equal((await request(`/api/review/${id}`, "PATCH", "alice", { action: "invalid" })).status, 400);

  const retry = await request(`/api/review/${id}`, "PATCH", "alice", { action: "retry" });
  assert.equal(retry.status, 200);
  const retryBody = await retry.json();
  assert.equal(retryBody.item.sourceCode, "console.log(4)");
  assert.equal(retryBody.item.retryCount, 1);
  assert.equal(db.prepare("SELECT retry_count FROM wrong_answers WHERE id = ?").get(id).retry_count, 1);

  const reviewed = await request(`/api/review/${id}`, "PATCH", "alice", { action: "reviewed" });
  assert.equal(reviewed.status, 200);
  assert.equal(db.prepare("SELECT status FROM wrong_answers WHERE id = ?").get(id).status, "reviewed");
  const list = await (await request("/api/review", "GET", "alice")).json();
  assert.deepEqual(list.queue, []);
  assert.equal(list.stats.pending, 0);
});

test("missing review migration is isolated from existing run API", async (t) => {
  const { db, request } = fixture(t);
  db.exec("DROP TABLE wrong_answers; DROP TABLE learning_mastery;");
  mockRunner(t, "合格");
  const run = await request("/api/run", "POST", "alice", {
    language: "Python", topicIndex: 2, code: "print('合格')", judge: true,
  });
  assert.equal(run.status, 200);
  assert.equal((await run.json()).runRecorded, true);
  const review = await request("/api/review", "GET", "alice");
  assert.equal(review.status, 503);
  assert.equal((await review.json()).code, "REVIEW_SCHEMA_NOT_READY");
});
