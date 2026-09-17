import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("uses a real shared forum feed with authenticated writes", async () => {
  const [page, client, worker, workerEntry, schema, migration, css] = await Promise.all([
    readFile(new URL("../app/forum/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/forum/forum-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("../worker/forum.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0010_equal_orphan.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/forum/forum.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<ForumClient \/>/);
  assert.match(client, /<h1>用户论坛/);
  assert.match(client, /网站建议/);
  assert.doesNotMatch(client, /学习分享/);
  assert.doesNotMatch(page, /forum-ambient|forum-categories|forum-guidelines|Blinga community/);

  assert.match(client, /fetch\("\/api\/forum\/posts\?limit=20"/);
  assert.match(client, /method: "POST"/);
  assert.match(client, /method: "DELETE"/);
  assert.match(client, /登录后可以留言/);
  assert.match(client, /maxLength=\{MAX_LENGTH\}/);
  assert.match(client, /requestId: requestIdRef\.current/);
  assert.match(client, /post\.author\.avatarUrl/);
  assert.match(client, /post\.mine/);

  assert.match(workerEntry, /handleForumRequest/);
  assert.match(worker, /getSessionUser/);
  assert.match(worker, /sameOrigin\(request\)/);
  assert.match(worker, /POST_RATE_LIMIT/);
  assert.match(worker, /请勿重复发布相同内容/);
  assert.match(worker, /status = 'published' AND p\.is_deleted = 0/);
  assert.match(worker, /\/api\/forum\/avatar/);
  assert.match(worker, /Cache-Control", "public, max-age=300/);
  assert.match(worker, /forum_user_stats/);
  assert.match(worker, /COUNT\(DISTINCT user_id\)/);

  assert.match(schema, /export const forumPosts/);
  assert.match(schema, /forum_posts_public_feed_idx/);
  assert.match(schema, /export const forumUserStats/);
  assert.match(migration, /CREATE TABLE `forum_posts`/);
  assert.match(migration, /CREATE TABLE `forum_user_stats`/);
  assert.match(migration, /PRAGMA optimize/);

  assert.doesNotMatch(css, /box-shadow|backdrop-filter|linear-gradient|radial-gradient/);
  assert.match(css, /\.forum-post\{[\s\S]*?background:transparent/);
  assert.match(css, /\.forum-composer textarea\{[\s\S]*?border:0/);
});
