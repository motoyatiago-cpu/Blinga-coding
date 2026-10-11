import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import worker from '../dist/server/index.js';

function fixture(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  for (const file of readdirSync(new URL('../drizzle/', import.meta.url)).filter((name) => name.endsWith('.sql')).sort()) {
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
      try { const results = statements.map((statement) => statement.runSync()); db.exec('COMMIT'); return results; }
      catch (error) { db.exec('ROLLBACK'); throw error; }
    },
  };
  const tokens = {};
  for (const name of ['alice', 'bob', 'charlie', 'dave']) {
    db.prepare('INSERT INTO users (id,display_name,username,email) VALUES (?,?,?,?)').run(name, name, name, `${name}@private.test`);
    tokens[name] = randomUUID();
    const hash = createHash('sha256').update(tokens[name]).digest('base64url');
    db.prepare("INSERT INTO auth_sessions(id,token_hash,user_id,expires_at) VALUES(?,?,?,datetime('now','+1 day'))").run(randomUUID(), hash, name);
  }
  db.prepare("INSERT INTO forum_posts(id,user_id,request_id,content,category) VALUES('post-a','alice',?,'Need help','help')").run(randomUUID());
  async function request(path, method = 'GET', user = null, body, origin = 'https://forum.test') {
    const headers = { Origin: origin, 'Sec-Fetch-Site': origin === 'https://forum.test' ? 'same-origin' : 'cross-site', 'Content-Type': 'application/json' };
    if (user) headers.Cookie = `__Host-blinga_session=${tokens[user] || user}`;
    return worker.fetch(new Request(`https://forum.test${path}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }), { DB: binding }, { waitUntil() {} });
  }
  const reply = (user, options = {}) => request('/api/forum/replies', 'POST', user, {
    postId: 'post-a', content: 'A reply', requestId: randomUUID(), ...options,
  });
  const notifications = async (user, query = '') => {
    const response = await request(`/api/forum/notifications${query}`, 'GET', user);
    return { response, body: await response.json() };
  };
  return { db, request, reply, notifications };
}

test('creates deduplicated post, reply and mention notifications without self notifications or email exposure', async (t) => {
  const { db, reply, notifications } = fixture(t);
  const requestId = randomUUID();
  const firstResponse = await reply('bob', { content: '@charlie @charlie @bob @missing thanks', requestId });
  assert.equal(firstResponse.status, 201);
  const first = (await firstResponse.json()).reply;
  assert.equal((await reply('bob', { content: '@charlie @charlie @bob @missing thanks', requestId })).status, 200);

  const alice = await notifications('alice');
  const charlie = await notifications('charlie');
  const bob = await notifications('bob');
  assert.equal(alice.body.notifications.length, 1);
  assert.equal(alice.body.notifications[0].kind, 'post_reply');
  assert.equal(charlie.body.notifications.length, 1);
  assert.equal(charlie.body.notifications[0].kind, 'mention');
  assert.equal(bob.body.notifications.length, 0);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM forum_notifications').get().n, 2);

  await reply('charlie', { replyToId: first.id, content: '@alice @dave @charlie nested' });
  const bobAfter = await notifications('bob');
  const aliceAfter = await notifications('alice');
  const daveAfter = await notifications('dave');
  assert.equal(bobAfter.body.notifications[0].kind, 'reply_reply');
  assert.equal(aliceAfter.body.notifications.length, 2);
  assert.equal(aliceAfter.body.notifications[0].kind, 'post_reply');
  assert.equal(daveAfter.body.notifications[0].kind, 'mention');
  const serialized = JSON.stringify([aliceAfter.body, bobAfter.body, daveAfter.body]);
  assert.doesNotMatch(serialized, /@private\.test|recipient_user_id|actor_user_id|email/i);
});

test('requires the recipient session, enforces same-origin ownership and tracks unread state', async (t) => {
  const { request, reply, notifications } = fixture(t);
  await reply('bob');
  assert.equal((await request('/api/forum/notifications')).status, 401);
  assert.equal((await request('/api/forum/notifications/count', 'GET', 'fake')).status, 401);

  const alice = await notifications('alice');
  const id = alice.body.notifications[0].id;
  assert.equal(alice.body.unreadCount, 1);
  assert.equal((await request('/api/forum/notifications/read', 'PATCH', 'bob', { id })).status, 404);
  assert.equal((await request('/api/forum/notifications/read', 'PATCH', 'alice', { id }, 'https://evil.test')).status, 403);
  const marked = await request('/api/forum/notifications/read', 'PATCH', 'alice', { id });
  assert.equal(marked.status, 200);
  assert.equal((await marked.json()).unreadCount, 0);
  assert.equal((await notifications('alice')).body.notifications[0].read, true);
});

test('resolve notifications go to distinct active participants and remain idempotent', async (t) => {
  const { db, request, reply, notifications } = fixture(t);
  await reply('bob');
  await reply('bob');
  await reply('charlie');
  assert.equal((await request('/api/forum/posts?id=post-a', 'PATCH', 'dave')).status, 404);
  assert.equal((await request('/api/forum/posts?id=post-a', 'PATCH', 'alice')).status, 200);
  assert.equal((await request('/api/forum/posts?id=post-a', 'PATCH', 'alice')).status, 200);
  const resolved = db.prepare("SELECT recipient_user_id,kind FROM forum_notifications WHERE dedupe_key='resolved:post-a' ORDER BY recipient_user_id").all()
    .map((row) => ({ recipient_user_id: row.recipient_user_id, kind: row.kind }));
  assert.deepEqual(resolved, [
    { recipient_user_id: 'bob', kind: 'resolved' },
    { recipient_user_id: 'charlie', kind: 'resolved' },
  ]);
  assert.equal((await notifications('alice')).body.notifications.filter((item) => item.kind === 'resolved').length, 0);
});

test('notification pagination is bounded and rejects malformed cursors', async (t) => {
  const { db, notifications } = fixture(t);
  const insert = db.prepare(`INSERT INTO forum_notifications
    (id,recipient_user_id,actor_user_id,post_id,kind,dedupe_key,created_at)
    VALUES (?,'alice','bob','post-a','post_reply',?,'2026-01-01 00:00:00')`);
  for (let index = 0; index < 45; index++) insert.run(`notification-${String(index).padStart(3, '0')}`, `manual:${index}`);
  const first = await notifications('alice', '?limit=999');
  assert.equal(first.response.status, 200);
  assert.equal(first.body.notifications.length, 40);
  assert.ok(first.body.nextCursor);
  const second = await notifications('alice', `?limit=40&cursor=${encodeURIComponent(first.body.nextCursor)}`);
  assert.equal(second.body.notifications.length, 5);
  assert.equal(new Set([...first.body.notifications, ...second.body.notifications].map((item) => item.id)).size, 45);
  assert.equal((await notifications('alice', '?cursor=invalid')).response.status, 400);
});

test('loads a notification target directly when it is outside the first feed page', async (t) => {
  const { request } = fixture(t);
  const response = await request('/api/forum/posts?id=post-a', 'GET', 'alice');
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.posts.length, 1);
  assert.equal(body.posts[0].id, 'post-a');
  assert.equal((await request('/api/forum/posts?id=missing', 'GET', 'alice')).status, 404);
});

test('notification links retain the post id for on-demand loading', () => {
  const notificationsSource = readFileSync(new URL('../app/forum/forum-notifications.tsx', import.meta.url), 'utf8');
  const forumSource = readFileSync(new URL('../app/forum/forum-client.tsx', import.meta.url), 'utf8');
  const repliesSource = readFileSync(new URL('../app/forum/forum-replies.tsx', import.meta.url), 'utf8');
  assert.match(notificationsSource, /new URLSearchParams\(\{ post: item\.postId \}\)/);
  assert.match(notificationsSource, /params\.set\("reply", item\.replyId\)/);
  assert.match(forumSource, /link\.get\("post"\)/);
  assert.match(forumSource, /link\.get\("reply"\)/);
  assert.match(forumSource, /\/api\/forum\/posts\?id=/);
  assert.match(repliesSource, /replyId: targetReplyId/);
});

test('canonical notification APIs isolate recipients and keep every rapid distinct reply', async (t) => {
  const { request, reply } = fixture(t);
  const first = await reply('bob', { content: '<script>alert(1)</script> first' });
  const second = await reply('bob', { content: 'second' });
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  const list = await request('/api/notifications', 'GET', 'alice');
  const data = await list.json();
  assert.equal(data.notifications.length, 2);
  assert.deepEqual(new Set(data.notifications.map(item => item.content)), new Set(['<script>alert(1)</script> first', 'second']));
  assert.equal((await (await request('/api/notifications/unread-count', 'GET', 'alice')).json()).count, 2);
  const id = data.notifications[0].id;
  assert.equal((await request(`/api/notifications/${id}/read`, 'POST', 'bob')).status, 404);
  assert.equal((await request(`/api/notifications/${id}/read`, 'POST', 'alice', undefined, 'https://evil.test')).status, 403);
  assert.equal((await request(`/api/notifications/${id}/read`, 'POST', 'alice')).status, 200);
  assert.equal((await (await request('/api/notifications/unread-count', 'GET', 'alice')).json()).count, 1);
  assert.equal((await request('/api/notifications/read-all', 'POST', 'alice')).status, 200);
  assert.equal((await (await request('/api/notifications/unread-count', 'GET', 'alice')).json()).count, 0);
});

test('notification retains a safe historical summary and handles deleted reply and actor', async (t) => {
  const { db, request, reply } = fixture(t);
  const posted = await reply('bob', { content: 'Historical reply' });
  const replyId = (await posted.json()).reply.id;
  assert.equal((await request(`/api/forum/replies?id=${replyId}`, 'DELETE', 'bob')).status, 200);
  db.prepare("DELETE FROM users WHERE id = 'bob'").run();
  const data = await (await request('/api/notifications', 'GET', 'alice')).json();
  assert.equal(data.notifications.length, 1);
  assert.equal(data.notifications[0].content, 'Historical reply');
  assert.equal(data.notifications[0].targetDeleted, true);
  assert.equal(data.notifications[0].actor.name, 'bob');
});
