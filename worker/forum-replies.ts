import { getSessionUser, type AuthEnv, type SessionUser } from "./auth";

type ReplyRow = {
  id: string; post_id: string; user_id: string; reply_to_id: string | null;
  request_id: string; content: string; is_deleted: number; created_at: string;
  display_name: string; username: string | null; avatar_type: string; avatar_value: string | null;
  target_name: string | null; target_deleted: number | null;
};
const SELECT_REPLY = `SELECT r.*, u.display_name, u.username, u.avatar_type, u.avatar_value,
  COALESCE(tu.username, tu.display_name) AS target_name, t.is_deleted AS target_deleted
  FROM forum_replies r JOIN users u ON u.id = r.user_id
  JOIN forum_posts p ON p.id = r.post_id
  LEFT JOIN forum_replies t ON t.id = r.reply_to_id AND t.post_id = r.post_id
  LEFT JOIN users tu ON tu.id = t.user_id
  WHERE p.status = 'published' AND p.is_deleted = 0`;
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: {
  "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'", "Referrer-Policy": "no-referrer",
} });
const validId = (value: unknown): value is string => typeof value === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(value);
function publicReply(row: ReplyRow, viewer: SessionUser | null) {
  return {
    id: row.id, postId: row.post_id, content: row.is_deleted ? "" : row.content,
    deleted: Boolean(row.is_deleted), createdAt: row.created_at,
    mine: viewer?.id === row.user_id,
    author: row.is_deleted ? null : {
      name: row.username || row.display_name,
      avatarType: row.avatar_type,
      avatarValue: row.avatar_type === "preset" ? row.avatar_value : null,
      avatarUrl: row.avatar_type === "upload" ? `/api/forum/avatar?reply=${encodeURIComponent(row.id)}` : null,
    },
    replyTo: row.reply_to_id ? {
      id: row.reply_to_id, name: row.target_deleted ? null : row.target_name,
      deleted: Boolean(row.target_deleted) || !row.target_name,
    } : null,
  };
}
async function postExists(db: D1Database, id: string) {
  return db.prepare("SELECT id FROM forum_posts WHERE id = ? AND status = 'published' AND is_deleted = 0").bind(id).first();
}
async function readReply(db: D1Database, userId: string, requestId: string) {
  return db.prepare(`${SELECT_REPLY} AND r.user_id = ? AND r.request_id = ?`).bind(userId, requestId).first<ReplyRow>();
}
async function replyCount(db: D1Database, postId: string) {
  const row = await db.prepare("SELECT COUNT(*) AS n FROM forum_replies WHERE post_id = ? AND is_deleted = 0").bind(postId).first<{ n: number }>();
  return Number(row?.n || 0);
}

/** Called behind the forum API's schema check and JSON error boundary. */
export async function handleReplies(request: Request, env: AuthEnv): Promise<Response> {
  const url = new URL(request.url);
  if (!["GET", "POST", "DELETE"].includes(request.method)) return json({ error: "不支持该请求方法" }, 405);
  if (request.method !== "GET" && (request.headers.get("Origin") !== url.origin || request.headers.get("Sec-Fetch-Site") === "cross-site")) {
    return json({ error: "请求来源无效" }, 403);
  }
  const viewer = await getSessionUser(request, env);
  if (request.method !== "GET" && !viewer) return json({ error: "登录后即可回复" }, 401);

  if (request.method === "GET") {
    const postId = url.searchParams.get("postId");
    if (!validId(postId) || !await postExists(env.DB, postId)) return json({ error: "讨论不存在或已删除" }, 404);
    let cursor: { createdAt: string; id: string } | null = null;
    const raw = url.searchParams.get("cursor");
    if (raw) {
      try {
        if (raw.length > 500) throw new Error();
        const parsed = JSON.parse(atob(raw));
        if (!validId(parsed.id) || typeof parsed.createdAt !== "string" || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(parsed.createdAt)) throw new Error();
        cursor = parsed;
      } catch { return json({ error: "分页参数无效" }, 400); }
    }
    const query = `${SELECT_REPLY} AND r.post_id = ? ${cursor ? "AND (r.created_at > ? OR (r.created_at = ? AND r.id > ?))" : ""}
      ORDER BY r.created_at ASC, r.id ASC LIMIT 21`;
    const args = cursor ? [postId, cursor.createdAt, cursor.createdAt, cursor.id] : [postId];
    const result = await env.DB.prepare(query).bind(...args).all<ReplyRow>();
    const rows = result.results.slice(0, 20), last = rows.at(-1);
    return json({ replyCount: await replyCount(env.DB, postId), replies: rows.map(row => publicReply(row, viewer)), nextCursor: result.results.length > 20 && last
      ? btoa(JSON.stringify({ createdAt: last.created_at, id: last.id })) : null });
  }

  if (request.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!validId(id)) return json({ error: "回复不存在" }, 404);
    const result = await env.DB.prepare(`UPDATE forum_replies SET is_deleted = 1, content = '', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ? AND is_deleted = 0 AND EXISTS
      (SELECT 1 FROM forum_posts p WHERE p.id = forum_replies.post_id AND p.status = 'published' AND p.is_deleted = 0)`)
      .bind(id, viewer!.id).run();
    return result.meta.changes ? json({ removed: true }) : json({ error: "回复不存在或无权删除" }, 404);
  }

  if (Number(request.headers.get("Content-Length")) > 8000) return json({ error: "回复内容过长" }, 413);
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 8000) return json({ error: "回复内容过长" }, 413);
    body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
  } catch { return json({ error: "回复格式无效" }, 400); }
  const { postId, requestId } = body;
  const replyToId = body.replyToId ?? null;
  const content = typeof body.content === "string" ? body.content.replace(/\r\n?/g, "\n").trim() : "";
  if (!validId(postId) || (replyToId !== null && !validId(replyToId)) || typeof requestId !== "string" || !/^[a-zA-Z0-9-]{16,64}$/.test(requestId)) {
    return json({ error: "回复请求无效" }, 400);
  }
  if (!content || content.length > 1000) return json({ error: "回复需填写 1–1000 个字符" }, 400);
  if (!await postExists(env.DB, postId)) return json({ error: "讨论不存在或已删除" }, 404);
  const replay = async (row: ReplyRow) => row.post_id === postId && row.reply_to_id === replyToId && (row.is_deleted || row.content === content)
    ? json({ reply: publicReply(row, viewer), replayed: true, replyCount: await replyCount(env.DB, postId) }) : json({ error: "请使用新的请求重新发送" }, 409);
  const existing = await readReply(env.DB, viewer!.id, requestId);
  if (existing) return replay(existing);
  if (replyToId && !await env.DB.prepare("SELECT id FROM forum_replies WHERE id = ? AND post_id = ? AND is_deleted = 0").bind(replyToId, postId).first()) {
    return json({ error: "回复对象不存在或已删除" }, 404);
  }
  // Visibility, target, rate limit and uniqueness are checked in the same atomic write.
  const id = crypto.randomUUID();
  const result = await env.DB.prepare(`INSERT INTO forum_replies (id, post_id, user_id, reply_to_id, request_id, content)
    SELECT ?, ?, ?, ?, ?, ? WHERE EXISTS
      (SELECT 1 FROM forum_posts WHERE id = ? AND status = 'published' AND is_deleted = 0)
    AND (? IS NULL OR EXISTS (SELECT 1 FROM forum_replies WHERE id = ? AND post_id = ? AND is_deleted = 0))
    AND (SELECT COUNT(*) FROM forum_replies WHERE user_id = ? AND created_at >= datetime('now', '-1 minute')) < 5
    ON CONFLICT(user_id, request_id) DO NOTHING`)
    .bind(id, postId, viewer!.id, replyToId, requestId, content, postId, replyToId, replyToId, postId, viewer!.id).run();
  const row = await readReply(env.DB, viewer!.id, requestId);
  if (row) return result.meta.changes ? json({ reply: publicReply(row, viewer), replayed: false, replyCount: await replyCount(env.DB, postId) }, 201) : replay(row);
  if (!await postExists(env.DB, postId)) return json({ error: "讨论不存在或已删除" }, 404);
  if (replyToId && !await env.DB.prepare("SELECT id FROM forum_replies WHERE id = ? AND post_id = ? AND is_deleted = 0").bind(replyToId, postId).first()) return json({ error: "回复对象不存在或已删除" }, 404);
  return json({ error: "回复过于频繁，请稍后再试" }, 429);
}
