import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { repairForum } from '../scripts/repair-forum-local.mjs';

const migrations = ['0010_equal_orphan.sql', '0011_boring_toad.sql'].map(name => readFileSync(new URL(`../drizzle/${name}`, import.meta.url), 'utf8'));
const oldTable = `CREATE TABLE forum_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, author_key TEXT NOT NULL, author_name TEXT NOT NULL, category TEXT NOT NULL, content TEXT NOT NULL, resolved INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`;

test('repairs the actual empty legacy schema, preserves its table, and is repeatable', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(oldTable);
    const result = repairForum(db, migrations);
    assert.match(result.archived, /^forum_posts_legacy_/);
    assert.equal(db.prepare(`SELECT count(*) AS n FROM ${result.archived}`).get().n, 0);
    db.prepare('INSERT INTO forum_posts (id,user_id,request_id,content) VALUES (?,?,?,?)').run('post-1','user-1','request-1','test content');
    assert.equal(repairForum(db, migrations).posts, 1);
    assert.equal(db.prepare('SELECT category,resolved FROM forum_posts').get().category, 'help');
    assert.throws(() => db.prepare('INSERT INTO forum_posts (id,user_id,request_id,content) VALUES (?,?,?,?)').run('post-2','user-1','request-1','duplicate'), /UNIQUE/);
  } finally { db.close(); }
});

test('does not guess ownership or discard nonempty legacy posts', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(oldTable);
    db.exec("INSERT INTO forum_posts (author_key,author_name,category,content) VALUES ('unknown','old author','help','keep me')");
    assert.throws(() => repairForum(db, migrations), /author_key/);
    assert.equal(db.prepare('SELECT content FROM forum_posts').get().content, 'keep me');
  } finally { db.close(); }
});

test('upgrades the pre-category schema without modifying existing posts', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(migrations[0].replaceAll('--> statement-breakpoint', ''));
    db.exec("INSERT INTO forum_posts (id,user_id,request_id,content) VALUES ('one','user','request','keep me')");
    repairForum(db, migrations);
    assert.equal(db.prepare('SELECT content FROM forum_posts').get().content, 'keep me');
  } finally { db.close(); }
});

test('schema errors return JSON and can recover after migration on the same binding', async (t) => {
  let source = readFileSync(new URL('../worker/forum.ts', import.meta.url), 'utf8');
  source = source.replace(/import\s*\{[\s\S]*?\}\s*from "\.\/auth";/, 'const ensureAuthSchema = async () => {}; const getSessionUser = async () => null;');
  source = source.replace('import { handleReplies } from "./forum-replies";', 'const handleReplies = async () => null;');
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const api = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  t.mock.method(console, 'error', () => {});
  db.exec(oldTable);
  const binding = { prepare(sql) { return { async all() { return { results: db.prepare(sql).all() }; } }; } };
  const response = await api.handleForumRequest(new Request('https://test.invalid/api/forum/posts'), { DB: binding });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.code, 'FORUM_SCHEMA_NOT_READY');
  assert.doesNotMatch(JSON.stringify(body), /SQLITE|user_id|D1_ERROR/);
  repairForum(db, migrations);
  db.exec(readFileSync(new URL('../drizzle/0012_absurd_bromley.sql', import.meta.url), 'utf8'));
  await api.ensureForumSchema(binding);
  await api.ensureForumSchema(binding);
});
