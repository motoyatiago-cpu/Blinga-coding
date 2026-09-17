import {
  ensureAuthSchema,
  getSessionUser,
  type AuthEnv,
  type SessionUser,
} from "./auth";
import { handleReplies } from "./forum-replies";

export interface ForumEnv extends AuthEnv {
  AVATARS?: R2Bucket;
}

const MAX_POST_LENGTH = 1_000;
const PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 40;
const POST_RATE_LIMIT = 5;

type ForumPostRow = {
  id: string;
  user_id: string;
  category: string;
  resolved: number;
  content: string;
  created_at: string;
  updated_at: string;
  display_name: string;
  username: string | null;
  avatar_type: string;
  avatar_value: string | null;
  reply_count?: number;
};

function forumJson(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

class ForumSchemaError extends Error {
  constructor() { super("Forum schema does not match the deployed migrations"); }
}

const schemaChecks = new WeakMap<D1Database, Promise<void>>();
/** Migrations own DDL. Requests only verify readiness, never rebuild user tables. */
export async function ensureForumSchema(database: D1Database): Promise<void> {
  let check = schemaChecks.get(database);
  if (!check) {
    check = (async () => {
      const required: Record<string, string[]> = {
        forum_posts: ["id", "user_id", "request_id", "category", "resolved", "content", "status", "is_deleted", "created_at", "updated_at"],
        forum_user_stats: ["user_id", "post_count", "first_post_at", "last_post_at", "updated_at"],
        forum_replies: ["id", "post_id", "user_id", "reply_to_id", "request_id", "content", "is_deleted", "created_at", "updated_at"],
      };
      for (const [table, columns] of Object.entries(required)) {
        const info = await database.prepare(`PRAGMA table_info(${table})`).all<{ name: string; type: string }>();
        const actual = new Set(info.results.map((column) => column.name));
        if (columns.some((column) => !actual.has(column))) throw new ForumSchemaError();
        if (table === "forum_posts" && info.results.find((column) => column.name === "id")?.type.toUpperCase() !== "TEXT") throw new ForumSchemaError();
      }
    })();
    schemaChecks.set(database, check);
  }
  try { await check; }
  catch (error) {
    schemaChecks.delete(database); // A corrected migration is observable on retry.
    throw error;
  }
}

function publicPost(row: ForumPostRow, viewer: SessionUser | null) {
  const isOwner = Boolean(viewer && viewer.id === row.user_id);
  const resolved = Boolean(row.resolved);
  return {
    id: row.id,
    content: row.content,
    replyCount: Number(row.reply_count || 0),
    category: row.category,
    resolved,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      name: row.username || row.display_name,
      avatarType: row.avatar_type,
      avatarValue: row.avatar_type === "preset" ? row.avatar_value : null,
      avatarUrl: row.avatar_type === "upload"
        ? `/api/forum/avatar?post=${encodeURIComponent(row.id)}`
        : null,
    },
    permissions: {
      canResolve: isOwner && !resolved && row.category === "help",
      canDelete: isOwner,
    },
  };
}

function encodeCursor(row: ForumPostRow): string {
  return btoa(JSON.stringify({ createdAt: row.created_at, id: row.id }));
}

function decodeCursor(value: string | null): { createdAt: string; id: string } | null {
  if (!value || value.length > 500) return null;
  try {
    const parsed = JSON.parse(atob(value)) as { createdAt?: unknown; id?: unknown };
    const createdAt = String(parsed.createdAt || "");
    const id = String(parsed.id || "");
    if (!createdAt || createdAt.length > 64 || !id || id.length > 64) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

async function forumStats(database: D1Database, viewer: SessionUser | null) {
  const [totals, mine] = await Promise.all([
    database.prepare(`
      SELECT COUNT(*) AS post_count, COUNT(DISTINCT user_id) AS contributor_count
      FROM forum_posts
      WHERE status = 'published' AND is_deleted = 0
    `).first<{ post_count: number; contributor_count: number }>(),
    viewer
      ? database.prepare(`
          SELECT post_count, first_post_at, last_post_at
          FROM forum_user_stats
          WHERE user_id = ?
        `).bind(viewer.id).first<{
          post_count: number;
          first_post_at: string | null;
          last_post_at: string | null;
        }>()
      : Promise.resolve(null),
  ]);

  return {
    posts: Number(totals?.post_count || 0),
    contributors: Number(totals?.contributor_count || 0),
    mine: viewer ? {
      posts: Number(mine?.post_count || 0),
      firstPostAt: mine?.first_post_at || null,
      lastPostAt: mine?.last_post_at || null,
    } : null,
  };
}

async function listPosts(request: Request, env: ForumEnv): Promise<Response> {
  await ensureAuthSchema(env.DB);
  await ensureForumSchema(env.DB);
  const viewer = await getSessionUser(request, env);
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") || PAGE_SIZE);
  const limit = Number.isInteger(requestedLimit)
    ? Math.max(1, Math.min(MAX_PAGE_SIZE, requestedLimit))
    : PAGE_SIZE;
  const cursor = decodeCursor(url.searchParams.get("cursor"));

  const result = cursor
    ? await env.DB.prepare(`
        SELECT
          p.id, p.user_id, p.category, p.resolved, p.content, p.created_at, p.updated_at,
          u.display_name, u.username, u.avatar_type, u.avatar_value,
          (SELECT COUNT(*) FROM forum_replies r WHERE r.post_id = p.id AND r.is_deleted = 0) AS reply_count
        FROM forum_posts p
        JOIN users u ON u.id = p.user_id
        WHERE p.status = 'published' AND p.is_deleted = 0
          AND (p.created_at < ? OR (p.created_at = ? AND p.id < ?))
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT ?
      `).bind(cursor.createdAt, cursor.createdAt, cursor.id, limit + 1).all<ForumPostRow>()
    : await env.DB.prepare(`
        SELECT
          p.id, p.user_id, p.category, p.resolved, p.content, p.created_at, p.updated_at,
          u.display_name, u.username, u.avatar_type, u.avatar_value,
          (SELECT COUNT(*) FROM forum_replies r WHERE r.post_id = p.id AND r.is_deleted = 0) AS reply_count
        FROM forum_posts p
        JOIN users u ON u.id = p.user_id
        WHERE p.status = 'published' AND p.is_deleted = 0
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT ?
      `).bind(limit + 1).all<ForumPostRow>();

  const hasMore = result.results.length > limit;
  const rows = result.results.slice(0, limit);
  return forumJson({
    posts: rows.map((row) => publicPost(row, viewer)),
    nextCursor: hasMore && rows.length ? encodeCursor(rows[rows.length - 1]) : null,
    stats: await forumStats(env.DB, viewer),
    viewer: viewer ? {
      authenticated: true,
      name: viewer.username || viewer.displayName,
    } : { authenticated: false, name: null },
  });
}

async function createPost(request: Request, env: ForumEnv): Promise<Response> {
  if (!sameOrigin(request)) return forumJson({ error: "请求来源无效" }, 403);
  const user = await getSessionUser(request, env);
  if (!user) return forumJson({ error: "登录后可以留言" }, 401);
  const contentLength = Number(request.headers.get("Content-Length") || "0");
  if (contentLength > 5_000) return forumJson({ error: "留言内容过长" }, 413);

  let body: { content?: unknown; requestId?: unknown; category?: unknown };
  try {
    body = await request.json();
  } catch {
    return forumJson({ error: "留言格式无效" }, 400);
  }

  const content = typeof body.content === "string"
    ? body.content.replace(/\r\n?/g, "\n").trim()
    : "";
  const category = body.category === "share" ? "share" : "help";
  const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
  if (!content) return forumJson({ error: "请输入留言内容" }, 400);
  if (content.length > MAX_POST_LENGTH) {
    return forumJson({ error: `留言不能超过 ${MAX_POST_LENGTH} 个字符` }, 400);
  }
  if (!/^[a-zA-Z0-9-]{16,64}$/.test(requestId)) {
    return forumJson({ error: "发布请求无效，请重试" }, 400);
  }

  await ensureForumSchema(env.DB);
  const recent = await env.DB.prepare(`
    SELECT COUNT(*) AS count
    FROM forum_posts
    WHERE user_id = ? AND created_at >= datetime('now', '-1 minute')
  `).bind(user.id).first<{ count: number }>();
  if (Number(recent?.count || 0) >= POST_RATE_LIMIT) {
    return forumJson({ error: "发布过于频繁，请稍后再试" }, 429);
  }

  const duplicate = await env.DB.prepare(`
    SELECT id
    FROM forum_posts
    WHERE user_id = ? AND content = ? AND created_at >= datetime('now', '-10 seconds')
    LIMIT 1
  `).bind(user.id, content).first<{ id: string }>();
  if (duplicate) return forumJson({ error: "请勿重复发布相同内容" }, 409);

  const id = crypto.randomUUID();
  try {
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO forum_posts (id, user_id, request_id, content, category)
        VALUES (?, ?, ?, ?, ?)
      `).bind(id, user.id, requestId, content, category),
      env.DB.prepare(`
        INSERT INTO forum_user_stats (
          user_id, post_count, first_post_at, last_post_at, updated_at
        ) VALUES (?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          post_count = forum_user_stats.post_count + 1,
          last_post_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      `).bind(user.id),
    ]);
  } catch {
    const existing = await env.DB.prepare(`
      SELECT id FROM forum_posts WHERE user_id = ? AND request_id = ?
    `).bind(user.id, requestId).first<{ id: string }>();
    if (existing) return forumJson({ error: "该留言已经发布" }, 409);
    return forumJson({ error: "留言暂时无法发布，请稍后重试" }, 500);
  }

  const row: ForumPostRow = {
    id,
    user_id: user.id,
    category,
    resolved: 0,
    content,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    display_name: user.displayName,
    username: user.username,
    avatar_type: user.avatarType,
    avatar_value: user.avatarValue,
  };
  return forumJson({ post: publicPost(row, user) }, 201);
}

async function deletePost(request: Request, env: ForumEnv): Promise<Response> {
  if (!sameOrigin(request)) return forumJson({ error: "请求来源无效" }, 403);
  const user = await getSessionUser(request, env);
  if (!user) return forumJson({ error: "请先登录" }, 401);
  const id = new URL(request.url).searchParams.get("id")?.trim() || "";
  if (!id || id.length > 64) return forumJson({ error: "留言不存在" }, 404);
  await ensureForumSchema(env.DB);

  const result = await env.DB.prepare(`
    UPDATE forum_posts
    SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ? AND is_deleted = 0
  `).bind(id, user.id).run();
  if (!result.meta.changes) return forumJson({ error: "留言不存在或无权删除" }, 404);

  await env.DB.prepare(`
    UPDATE forum_user_stats
    SET
      post_count = MAX(0, post_count - 1),
      last_post_at = (
        SELECT MAX(created_at) FROM forum_posts
        WHERE user_id = ? AND status = 'published' AND is_deleted = 0
      ),
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).bind(user.id, user.id).run();
  return forumJson({ removed: true });
}

async function publicAvatar(request: Request, env: ForumEnv): Promise<Response> {
  if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
  const postId = new URL(request.url).searchParams.get("post")?.trim() || "";
  const replyId = new URL(request.url).searchParams.get("reply")?.trim() || "";
  if ((!postId && !replyId) || postId.length > 64 || replyId.length > 64 || !env.AVATARS) return new Response("Not found", { status: 404 });
  await ensureAuthSchema(env.DB);
  await ensureForumSchema(env.DB);
  const avatar = replyId ? await env.DB.prepare(`
    SELECT u.avatar_value FROM forum_replies r
    JOIN users u ON u.id = r.user_id JOIN forum_posts p ON p.id = r.post_id
    WHERE r.id = ? AND r.is_deleted = 0 AND p.status = 'published' AND p.is_deleted = 0
      AND u.avatar_type = 'upload'
  `).bind(replyId).first<{ avatar_value: string | null }>() : await env.DB.prepare(`
    SELECT u.avatar_value
    FROM forum_posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.id = ? AND p.status = 'published' AND p.is_deleted = 0
      AND u.avatar_type = 'upload'
  `).bind(postId).first<{ avatar_value: string | null }>();
  if (!avatar?.avatar_value) return new Response("Not found", { status: 404 });
  const object = await env.AVATARS.get(avatar.avatar_value);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=300");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
  return new Response(object.body, { headers });
}

async function dispatchForumRequest(
  request: Request,
  env: ForumEnv,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname === "/api/forum/replies") {
    await ensureAuthSchema(env.DB);
    await ensureForumSchema(env.DB);
    return handleReplies(request, env);
  }
  if (url.pathname === "/api/forum/avatar") return publicAvatar(request, env);
  if (url.pathname === "/api/forum/stats") {
    if (request.method !== "GET") return forumJson({ error: "仅支持 GET 请求" }, 405);
    await ensureAuthSchema(env.DB);
    await ensureForumSchema(env.DB);
    return forumJson(await forumStats(env.DB, await getSessionUser(request, env)));
  }
  if (url.pathname !== "/api/forum/posts") return null;
  if (request.method === "GET") return listPosts(request, env);
  if (request.method === "POST") return createPost(request, env);
  if (request.method === "PATCH") {
    if (!sameOrigin(request)) return forumJson({ error: "请求来源无效" }, 403);
    const user = await getSessionUser(request, env);
    if (!user) return forumJson({ error: "请先登录" }, 401);
    await ensureForumSchema(env.DB);
    const id = url.searchParams.get("id") || "";
    const result = await env.DB.prepare("UPDATE forum_posts SET resolved = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND is_deleted = 0 AND category = 'help'").bind(id, user.id).run();
    return result.meta.changes ? forumJson({ resolved: true }) : forumJson({ error: "讨论不存在或无权修改" }, 404);
  }
  if (request.method === "DELETE") return deletePost(request, env);
  return forumJson({ error: "不支持该请求方法" }, 405);
}


/** Catch awaited failures at the API boundary; never return SQL or HTML to clients. */
export async function handleForumRequest(request: Request, env: ForumEnv): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (!["/api/forum/posts", "/api/forum/stats", "/api/forum/avatar", "/api/forum/replies"].includes(path)) return null;
  try {
    return await dispatchForumRequest(request, env);
  } catch (error) {
    console.error("[forum] request failed", path, error);
    return forumJson({
      code: error instanceof ForumSchemaError ? "FORUM_SCHEMA_NOT_READY" : "FORUM_UNAVAILABLE",
      error: "论坛暂时不可用，请稍后重试",
    }, 503);
  }
}
