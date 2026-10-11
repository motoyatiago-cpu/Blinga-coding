import { getSessionUser, type AuthEnv, type SessionUser } from "./auth";

const PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 40;
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

type NotificationKind = "post_reply" | "reply_reply" | "mention" | "resolved";
type NotificationRow = {
  id: string;
  post_id: string;
  reply_id: string | null;
  kind: NotificationKind;
  content_excerpt: string;
  reply_content: string | null;
  actor_name: string;
  is_read: number;
  read_at: string | null;
  created_at: string;
  target_post_id: string | null;
  post_deleted: number | null;
  target_reply_id: string | null;
  reply_deleted: number | null;
  display_name: string | null;
  username: string | null;
  avatar_type: string | null;
  avatar_value: string | null;
};

const json = (data: unknown, status = 200) => Response.json(data, {
  status,
  headers: {
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'none'",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  },
});

function sameOrigin(request: Request): boolean {
  const url = new URL(request.url);
  return request.headers.get("Origin") === url.origin
    && request.headers.get("Sec-Fetch-Site") !== "cross-site";
}

function mentionNames(content: string): string[] {
  const usernames = new Set<string>();
  const pattern = /(?:^|[^a-zA-Z0-9_])@([a-z0-9_]{4,20})(?![a-zA-Z0-9_])/gi;
  for (const match of content.matchAll(pattern)) usernames.add(match[1].toLowerCase());
  return [...usernames];
}

/**
 * Re-running this after a retried reply is intentional: recipient + event uniqueness
 * repairs a partially completed request without producing duplicate notifications.
 */
export async function ensureReplyNotifications(database: D1Database, input: {
  actorUserId: string;
  postId: string;
  replyId: string;
  replyToId: string | null;
  content: string;
}): Promise<void> {
  const key = `reply:${input.replyId}`;
  const actor = await database.prepare("SELECT COALESCE(username, display_name) AS name FROM users WHERE id = ?")
    .bind(input.actorUserId).first<{ name: string }>();
  const actorName = actor?.name && !actor.name.includes("@") ? actor.name.slice(0, 80) : "一位用户";
  const excerpt = input.content.replace(/\s+/g, " ").trim().slice(0, 160);
  const statements = [];
  if (input.replyToId) {
    statements.push(database.prepare(`
      INSERT INTO forum_notifications (
        id, recipient_user_id, actor_user_id, post_id, reply_id, kind, dedupe_key, content_excerpt, actor_name
      )
      SELECT lower(hex(randomblob(16))), target.user_id, ?, ?, ?, 'reply_reply', ?, ?, ?
      FROM forum_replies target
      WHERE target.id = ? AND target.post_id = ? AND target.is_deleted = 0
        AND target.user_id <> ?
      ON CONFLICT(recipient_user_id, dedupe_key) DO NOTHING
    `).bind(input.actorUserId, input.postId, input.replyId, key, excerpt, actorName, input.replyToId, input.postId, input.actorUserId));
  }
  statements.push(database.prepare(`
    INSERT INTO forum_notifications (
      id, recipient_user_id, actor_user_id, post_id, reply_id, kind, dedupe_key, content_excerpt, actor_name
    )
    SELECT lower(hex(randomblob(16))), post.user_id, ?, ?, ?, 'post_reply', ?, ?, ?
    FROM forum_posts post
    WHERE post.id = ? AND post.status = 'published' AND post.is_deleted = 0
      AND post.user_id <> ?
    ON CONFLICT(recipient_user_id, dedupe_key) DO NOTHING
  `).bind(input.actorUserId, input.postId, input.replyId, key, excerpt, actorName, input.postId, input.actorUserId));
  for (const username of mentionNames(input.content)) {
    statements.push(database.prepare(`
      INSERT INTO forum_notifications (
        id, recipient_user_id, actor_user_id, post_id, reply_id, kind, dedupe_key, content_excerpt, actor_name
      )
      SELECT lower(hex(randomblob(16))), mentioned.id, ?, ?, ?, 'mention', ?, ?, ?
      FROM users mentioned
      WHERE mentioned.username = ? AND mentioned.id <> ?
      ON CONFLICT(recipient_user_id, dedupe_key) DO NOTHING
    `).bind(input.actorUserId, input.postId, input.replyId, key, excerpt, actorName, username, input.actorUserId));
  }
  await database.batch(statements);
}

export async function ensureResolvedNotifications(database: D1Database, postId: string, actorUserId: string): Promise<void> {
  await database.prepare(`
    INSERT INTO forum_notifications (
      id, recipient_user_id, actor_user_id, post_id, reply_id, kind, dedupe_key
    )
    SELECT lower(hex(randomblob(16))), participant.user_id, ?, ?, NULL, 'resolved', ?
    FROM (
      SELECT DISTINCT user_id FROM forum_replies
      WHERE post_id = ? AND is_deleted = 0 AND user_id <> ?
    ) participant
    JOIN forum_posts post ON post.id = ?
    WHERE post.user_id = ? AND post.category = 'help' AND post.resolved = 1
      AND post.status = 'published' AND post.is_deleted = 0
    ON CONFLICT(recipient_user_id, dedupe_key) DO NOTHING
  `).bind(actorUserId, postId, `resolved:${postId}`, postId, actorUserId, postId, actorUserId).run();
}

function publicNotification(row: NotificationRow) {
  const currentName = row.username || row.display_name;
  const name = currentName && !currentName.includes("@") ? currentName
    : row.actor_name && !row.actor_name.includes("@") ? row.actor_name
      : currentName ? "一位用户" : "已注销用户";
  const avatarType = row.avatar_type || "preset";
  const messages: Record<NotificationKind, string> = {
    post_reply: `${name} 回复了你的讨论`,
    reply_reply: `${name} 回复了你的回复`,
    mention: `${name} 在回复中提到了你`,
    resolved: `${name} 将你参与的求助标记为已解决`,
  };
  return {
    id: row.id,
    postId: row.post_id,
    replyId: row.reply_id,
    kind: row.kind,
    message: messages[row.kind],
    content: row.content_excerpt || (row.reply_deleted ? "" : row.reply_content?.replace(/\s+/g, " ").trim().slice(0, 160)) || "",
    read: Boolean(row.is_read || row.read_at),
    isRead: Boolean(row.is_read || row.read_at),
    targetDeleted: !row.target_post_id || Boolean(row.post_deleted)
      || Boolean(row.reply_id && (!row.target_reply_id || row.reply_deleted)),
    createdAt: row.created_at,
    actor: {
      name,
      avatarType,
      avatarValue: avatarType === "preset" ? row.avatar_value : null,
      avatarUrl: avatarType === "upload"
        ? row.reply_id
          ? `/api/forum/avatar?reply=${encodeURIComponent(row.reply_id)}`
          : `/api/forum/avatar?post=${encodeURIComponent(row.post_id)}`
        : null,
    },
  };
}

function encodeCursor(row: NotificationRow): string {
  return btoa(JSON.stringify({ createdAt: row.created_at, id: row.id }));
}

function decodeCursor(value: string | null): { createdAt: string; id: string } | null | undefined {
  if (!value) return null;
  if (value.length > 500) return undefined;
  try {
    const parsed = JSON.parse(atob(value)) as { createdAt?: unknown; id?: unknown };
    if (typeof parsed.createdAt !== "string" || !TIMESTAMP_PATTERN.test(parsed.createdAt)
      || typeof parsed.id !== "string" || !ID_PATTERN.test(parsed.id)) return undefined;
    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch {
    return undefined;
  }
}

async function unreadCount(database: D1Database, userId: string): Promise<number> {
  const row = await database.prepare(`
    SELECT COUNT(*) AS count FROM forum_notifications
    WHERE recipient_user_id = ? AND is_read = 0 AND read_at IS NULL
  `).bind(userId).first<{ count: number }>();
  return Number(row?.count || 0);
}

async function listNotifications(request: Request, env: AuthEnv, viewer: SessionUser): Promise<Response> {
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") || PAGE_SIZE);
  const limit = Number.isInteger(requestedLimit)
    ? Math.max(1, Math.min(MAX_PAGE_SIZE, requestedLimit))
    : PAGE_SIZE;
  const cursor = decodeCursor(url.searchParams.get("cursor"));
  if (cursor === undefined) return json({ error: "分页参数无效" }, 400);
  const result = await env.DB.prepare(`
    SELECT n.id, n.post_id, n.reply_id, n.kind, n.content_excerpt, n.actor_name,
      n.is_read, n.read_at, n.created_at, actor.display_name, actor.username,
      actor.avatar_type, actor.avatar_value, post.id AS target_post_id,
      post.is_deleted AS post_deleted, reply.id AS target_reply_id,
      reply.is_deleted AS reply_deleted, reply.content AS reply_content
    FROM forum_notifications n
    LEFT JOIN users actor ON actor.id = n.actor_user_id
    LEFT JOIN forum_posts post ON post.id = n.post_id
    LEFT JOIN forum_replies reply ON reply.id = n.reply_id AND reply.post_id = n.post_id
    WHERE n.recipient_user_id = ?
      ${cursor ? "AND (n.created_at < ? OR (n.created_at = ? AND n.id < ?))" : ""}
    ORDER BY n.created_at DESC, n.id DESC
    LIMIT ?
  `).bind(...(cursor
    ? [viewer.id, cursor.createdAt, cursor.createdAt, cursor.id, limit + 1]
    : [viewer.id, limit + 1])).all<NotificationRow>();
  const rows = result.results.slice(0, limit);
  return json({
    notifications: rows.map(publicNotification),
    nextCursor: result.results.length > limit && rows.length ? encodeCursor(rows[rows.length - 1]) : null,
    unreadCount: await unreadCount(env.DB, viewer.id),
  });
}

async function markOneRead(env: AuthEnv, viewer: SessionUser, id: string): Promise<Response> {
  if (!ID_PATTERN.test(id)) return json({ error: "通知不存在" }, 404);
  const result = await env.DB.prepare(`
    UPDATE forum_notifications SET is_read = 1, read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
    WHERE id = ? AND recipient_user_id = ?
  `).bind(id, viewer.id).run();
  if (!result.meta.changes) return json({ error: "通知不存在" }, 404);
  const count = await unreadCount(env.DB, viewer.id);
  return json({ marked: 1, unreadCount: count, count });
}

async function markAllRead(env: AuthEnv, viewer: SessionUser): Promise<Response> {
  const result = await env.DB.prepare(`
    UPDATE forum_notifications SET is_read = 1, read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
    WHERE recipient_user_id = ? AND (is_read = 0 OR read_at IS NULL)
  `).bind(viewer.id).run();
  return json({ marked: Number(result.meta.changes || 0), unreadCount: 0, count: 0 });
}

async function markRead(request: Request, env: AuthEnv, viewer: SessionUser): Promise<Response> {
  if (Number(request.headers.get("Content-Length") || "0") > 1_000) return json({ error: "请求内容过长" }, 413);
  let body: { id?: unknown; all?: unknown };
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 1_000) return json({ error: "请求内容过长" }, 413);
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    body = parsed as { id?: unknown; all?: unknown };
  }
  catch { return json({ error: "请求格式无效" }, 400); }
  if (body.all === true) return markAllRead(env, viewer);
  if (typeof body.id !== "string" || !ID_PATTERN.test(body.id)) return json({ error: "通知不存在" }, 404);
  return markOneRead(env, viewer, body.id);
}

/** Called behind the forum API schema checks and error boundary. */
export async function handleNotifications(request: Request, env: AuthEnv): Promise<Response> {
  const url = new URL(request.url);
  const viewer = await getSessionUser(request, env);
  if (!viewer) return json({ error: "登录后可以查看通知" }, 401);
  if (url.pathname === "/api/notifications/unread-count") {
    if (request.method !== "GET") return json({ error: "不支持该请求方法" }, 405);
    return json({ count: await unreadCount(env.DB, viewer.id) });
  }
  if (url.pathname === "/api/notifications/read-all") {
    if (request.method !== "POST") return json({ error: "不支持该请求方法" }, 405);
    if (!sameOrigin(request)) return json({ error: "请求来源无效" }, 403);
    return markAllRead(env, viewer);
  }
  const readId = url.pathname.match(/^\/api\/notifications\/([a-zA-Z0-9_-]{1,128})\/read$/)?.[1];
  if (readId) {
    if (request.method !== "POST") return json({ error: "不支持该请求方法" }, 405);
    if (!sameOrigin(request)) return json({ error: "请求来源无效" }, 403);
    return markOneRead(env, viewer, readId);
  }
  if (url.pathname === "/api/forum/notifications/count") {
    if (request.method !== "GET") return json({ error: "不支持该请求方法" }, 405);
    return json({ unreadCount: await unreadCount(env.DB, viewer.id) });
  }
  if (url.pathname === "/api/forum/notifications/read") {
    if (request.method !== "PATCH") return json({ error: "不支持该请求方法" }, 405);
    if (!sameOrigin(request)) return json({ error: "请求来源无效" }, 403);
    return markRead(request, env, viewer);
  }
  if (url.pathname !== "/api/notifications" && url.pathname !== "/api/forum/notifications") {
    return json({ error: "通知接口不存在" }, 404);
  }
  if (request.method !== "GET") return json({ error: "不支持该请求方法" }, 405);
  return listNotifications(request, env, viewer);
}
