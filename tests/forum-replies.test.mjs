import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import worker from '../dist/server/index.js';

// Exercise the production Worker and real cookie-based session lookup against SQLite.
function fixture(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  for (const file of readdirSync(new URL('../drizzle/', import.meta.url)).filter(f => f.endsWith('.sql')).sort()) {
    db.exec(readFileSync(new URL(`../drizzle/${file}`, import.meta.url), 'utf8'));
  }
  const binding = {
    prepare(sql) {
      let args = [];
      return {
        bind(...values) { args = values; return this; },
        async first(column) { const row = db.prepare(sql).get(...args) || null; return column ? row?.[column] : row; },
        async all() { return { results: db.prepare(sql).all(...args), success: true }; },
        runSync() { const result = db.prepare(sql).run(...args); return { success: true, meta: { changes: Number(result.changes) } }; },
        async run() { return this.runSync(); },
      };
    },
    async batch(statements) {
      db.exec('BEGIN');
      try { const results = statements.map(stmt => stmt.runSync()); db.exec('COMMIT'); return results; }
      catch (e) { db.exec('ROLLBACK'); throw e; }
    },
  };
  const tokens = {};
  for (const name of ['alice', 'bob']) {
    db.prepare('INSERT INTO users (id,display_name,username) VALUES (?,?,?)').run(name,name,name);
    tokens[name] = randomUUID();
    const hash = createHash('sha256').update(tokens[name]).digest('base64url');
    db.prepare("INSERT INTO auth_sessions(id,token_hash,user_id,expires_at) VALUES(?,?,?,datetime('now','+1 day'))").run(randomUUID(),hash,name);
  }
  for (const id of ['post-a','post-b']) db.prepare('INSERT INTO forum_posts(id,user_id,request_id,content) VALUES(?,?,?,?)').run(id,'alice',randomUUID(),'Original post');
  async function request(path, method = 'GET', user = null, body, origin = 'https://forum.test') {
    const headers = { Origin: origin, 'Content-Type': 'application/json' };
    if (user) headers.Cookie = `__Host-blinga_session=${tokens[user] || user}`;
    return worker.fetch(new Request(`https://forum.test${path}`, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }), { DB: binding }, { waitUntil() {} });
  }
  const send = (user, options = {}) => request('/api/forum/replies','POST',user,{postId:'post-a',content:'Hello',requestId:randomUUID(),...options});
  return { db, binding, request, send };
}

test('two real sessions can reply to each other and themselves; public reads keep private fields private', async t => {
  const { request, send } = fixture(t);
  const firstResponse = await send('bob', { userId:'alice' });
  assert.equal(firstResponse.status,201);
  const first = (await firstResponse.json()).reply;
  assert.equal(first.author.name,'bob');
  const second = (await (await send('alice',{replyToId:first.id})).json()).reply;
  assert.equal(second.replyTo.name,'bob');
  assert.equal((await send('alice',{replyToId:second.id})).status,201);
  const page = await request('/api/forum/replies?postId=post-a');
  assert.equal(page.headers.get('Cache-Control'),'no-store');
  const data = await page.json();
  assert.equal(data.replies.length,3);
  assert.ok(data.replies.every(r => r.mine === false));
  assert.doesNotMatch(JSON.stringify(data),/user_id|token_hash|email|request_id/);
  const feed = await (await request('/api/forum/posts')).json();
  assert.equal(feed.posts.find(p => p.id === 'post-a').replyCount,3);
  assert.equal(feed.stats.posts,2);
  assert.equal(feed.stats.contributors,1);
  await request('/api/forum/posts?id=post-a','PATCH','alice');
  assert.equal((await send('bob')).status,201);
});

test('rejects guests, forged sessions, cross-origin, invalid target and oversized content', async t => {
  const { send, request } = fixture(t);
  assert.equal((await send(null)).status,401);
  assert.equal((await send('fake-token')).status,401);
  assert.equal((await request('/api/forum/replies','POST','alice',{},'https://evil.test')).status,403);
  assert.equal((await send('alice',{content:' '})).status,400);
  assert.equal((await send('alice',{content:'x'.repeat(1001)})).status,400);
  assert.equal((await send('alice',{content:'x'.repeat(9000)})).status,413);
  assert.equal((await send('alice',{replyToId:'missing'})).status,404);
  const reply = (await (await send('alice',{postId:'post-b'})).json()).reply;
  assert.equal((await send('bob',{replyToId:reply.id})).status,404);
  assert.equal((await request('/api/forum/replies?postId=post-a&cursor=invalid')).status,400);
});

test('idempotency is stable under retries and concurrent requests; limit is atomic', async t => {
  const { send, db } = fixture(t);
  const requestId = randomUUID();
  const responses = await Promise.all([send('alice',{requestId}), send('alice',{requestId})]);
  assert.deepEqual(responses.map(r => r.status).sort(),[200,201]);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM forum_replies').get().n,1);
  assert.equal((await send('alice',{requestId,content:'changed'})).status,409);
  const batch = await Promise.all(Array.from({length:8},() => send('alice')));
  assert.equal(batch.filter(r => r.status === 201).length,4);
  assert.equal(batch.filter(r => r.status === 429).length,4);
  assert.equal((await send('alice',{requestId})).status,200);
});

test('only author deletes; tombstones preserve descendants and parent deletion hides everything', async t => {
  const { send, request, db } = fixture(t);
  const first = (await (await send('bob')).json()).reply;
  await send('alice',{replyToId:first.id});
  assert.equal((await request(`/api/forum/replies?id=${first.id}`,'DELETE','alice')).status,404);
  assert.equal((await request(`/api/forum/replies?id=${first.id}`,'DELETE','bob')).status,200);
  assert.equal((await send('alice',{replyToId:first.id})).status,404);
  const page = await (await request('/api/forum/replies?postId=post-a')).json();
  const tombstone = page.replies.find(r => r.id === first.id);
  assert.equal(tombstone.deleted,true); assert.equal(tombstone.content,''); assert.equal(tombstone.author,null);
  assert.ok(page.replies.find(r => r.replyTo)?.replyTo.deleted);
  assert.equal((await (await request('/api/forum/posts')).json()).posts.find(p => p.id === 'post-a').replyCount,1);
  assert.equal(db.prepare('SELECT content FROM forum_replies WHERE id=?').get(first.id).content,'');
  await request('/api/forum/posts?id=post-a','DELETE','alice');
  assert.equal((await request('/api/forum/replies?postId=post-a')).status,404);
  assert.equal((await send('alice')).status,404);
  assert.equal((await request(`/api/forum/avatar?reply=${first.id}`)).status,404);
});

test('cursor paging handles equal timestamps without duplicates or omissions', async t => {
  const { db, request } = fixture(t);
  for (let i=0;i<43;i++) db.prepare("INSERT INTO forum_replies(id,post_id,user_id,request_id,content,created_at) VALUES(?,'post-a','alice',?,'reply','2026-01-01 00:00:00')").run(`reply-${String(i).padStart(3,'0')}`,randomUUID());
  const ids = []; let cursor = null;
  do {
    const data = await (await request('/api/forum/replies?postId=post-a'+(cursor ? '&cursor='+encodeURIComponent(cursor):''))).json();
    assert.ok(data.replies.length <= 20);
    ids.push(...data.replies.map(r => r.id)); cursor = data.nextCursor;
  } while(cursor);
  assert.equal(ids.length,43); assert.equal(new Set(ids).size,43);
  assert.deepEqual(ids,[...ids].sort());
});

test('missing reply migration produces safe JSON without runtime schema mutation', async t => {
  const { db, request } = fixture(t);
  db.exec('DROP TABLE forum_replies');
  const response = await request('/api/forum/replies?postId=post-a');
  assert.equal(response.status,503);
  const body = await response.json();
  assert.equal(body.code,'FORUM_SCHEMA_NOT_READY');
  assert.doesNotMatch(JSON.stringify(body),/SQLITE|D1_ERROR|SELECT|column/);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM sqlite_schema WHERE name='forum_replies'").get().n,0);
});
