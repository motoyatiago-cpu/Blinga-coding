import {
  ensureColumn,
  ensureAuthSchema,
  ensureOwnershipColumns,
  getSessionUser,
  type AuthEnv,
  type AuthProvider,
  type SessionUser,
} from "./auth";

export interface ProfileEnv extends AuthEnv {
  AVATARS?: R2Bucket;
}

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_PRESETS = new Set([
  "#7182ff",
  "#58e6ba",
  "#b27cff",
  "#ff8b76",
  "#f2c94c",
  "#4da3ff",
]);

function profileJson(data: unknown, status = 200): Response {
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

async function requireUser(request: Request, env: ProfileEnv): Promise<SessionUser | Response> {
  const user = await getSessionUser(request, env);
  return user || profileJson({ error: "请先登录后访问个人中心" }, 401);
}

function isResponse(value: SessionUser | Response): value is Response {
  return value instanceof Response;
}

async function tableExists(database: D1Database, table: string): Promise<boolean> {
  const result = await database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .bind(table)
    .first<{ name: string }>();
  return Boolean(result);
}

async function readProfile(user: SessionUser, env: ProfileEnv): Promise<Response> {
  await ensureAuthSchema(env.DB);
  const [preferences, links] = await Promise.all([
    env.DB
      .prepare(`
        SELECT default_language, editor_font_size, reduce_motion, ai_detail, updated_at
        FROM user_preferences
        WHERE user_id = ?
      `)
      .bind(user.id)
      .first<{
        default_language: string;
        editor_font_size: number;
        reduce_motion: number;
        ai_detail: string;
        updated_at: string;
      }>(),
    env.DB
      .prepare(`
        SELECT provider, provider_name, provider_email, created_at, last_used_at
        FROM oauth_identities
        WHERE user_id = ?
        ORDER BY created_at ASC
      `)
      .bind(user.id)
      .all<{
        provider: AuthProvider;
        provider_name: string | null;
        provider_email: string | null;
        created_at: string;
        last_used_at: string;
      }>(),
  ]);

  const userKey = `user:${user.id}`;
  let drafts: Array<Record<string, unknown>> = [];
  let notes: Array<Record<string, unknown>> = [];
  if (await tableExists(env.DB, "code_drafts")) {
    await ensureOwnershipColumns(env.DB);
    const result = await env.DB
      .prepare(`
        SELECT language, topic_index, code, updated_at
        FROM code_drafts
        WHERE user_email = ?
        ORDER BY updated_at DESC
        LIMIT 12
      `)
      .bind(userKey)
      .all<{ language: string; topic_index: number; code: string; updated_at: string }>();
    drafts = result.results.map((item) => ({
      language: item.language,
      topicIndex: item.topic_index,
      preview: item.code.slice(0, 180),
      codeAvailable: true,
      updatedAt: item.updated_at,
    }));
  }
  if (await tableExists(env.DB, "learning_notes")) {
    const result = await env.DB
      .prepare(`
        SELECT language, topic_index, content, updated_at
        FROM learning_notes
        WHERE user_email = ?
        ORDER BY updated_at DESC
        LIMIT 12
      `)
      .bind(userKey)
      .all<{ language: string; topic_index: number; content: string; updated_at: string }>();
    notes = result.results.map((item) => ({
      language: item.language,
      topicIndex: item.topic_index,
      preview: item.content.slice(0, 180),
      updatedAt: item.updated_at,
    }));
  }

  return profileJson({
    user: {
      id: user.id,
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      avatarType: user.avatarType,
      avatarValue: user.avatarValue,
      avatarUrl: user.avatarType === "upload" ? "/api/profile/avatar" : null,
    },
    preferences: {
      defaultLanguage: preferences?.default_language || "Python",
      editorFontSize: preferences?.editor_font_size || 14,
      reduceMotion: Boolean(preferences?.reduce_motion),
      aiDetail: preferences?.ai_detail || "balanced",
      updatedAt: preferences?.updated_at || null,
    },
    links: links.results.map((item) => ({
      provider: item.provider,
      name: item.provider_name,
      email: item.provider_email,
      createdAt: item.created_at,
      lastUsedAt: item.last_used_at,
    })),
    drafts,
    notes,
  });
}

async function updateProfile(
  request: Request,
  user: SessionUser,
  env: ProfileEnv,
): Promise<Response> {
  if (!sameOrigin(request)) return profileJson({ error: "请求来源无效" }, 403);
  let body: {
    displayName?: unknown;
    username?: unknown;
    avatarPreset?: unknown;
    preferences?: {
      defaultLanguage?: unknown;
      editorFontSize?: unknown;
      reduceMotion?: unknown;
      aiDetail?: unknown;
    };
  };
  try {
    body = await request.json();
  } catch {
    return profileJson({ error: "请求格式无效" }, 400);
  }

  const statements: D1PreparedStatement[] = [];
  if (body.displayName !== undefined) {
    const displayName = String(body.displayName || "").trim();
    if (displayName.length < 1 || displayName.length > 40) {
      return profileJson({ error: "昵称长度应为 1 至 40 个字符" }, 400);
    }
    statements.push(
      env.DB
        .prepare("UPDATE users SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(displayName, user.id),
    );
  }
  if (body.username !== undefined) {
    const username = String(body.username || "").trim().toLowerCase();
    if (!/^[a-z0-9_]{4,20}$/.test(username)) {
      return profileJson({ error: "账号需为 4–20 位字母、数字或下划线" }, 400);
    }
    const duplicate = await env.DB.prepare(`
      SELECT id FROM users
      WHERE id <> ? AND (username = ? OR email = ?)
      LIMIT 1
    `).bind(user.id, username, username).first<{ id: string }>();
    const credentialDuplicate = await env.DB.prepare(`
      SELECT user_id FROM password_credentials
      WHERE user_id <> ? AND login_identifier = ?
      LIMIT 1
    `).bind(user.id, username).first<{ user_id: string }>();
    if (duplicate || credentialDuplicate) {
      return profileJson({ error: "该账号已被使用" }, 409);
    }
    statements.push(
      env.DB
        .prepare("UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(username, user.id),
    );
  }
  if (body.avatarPreset !== undefined) {
    const preset = String(body.avatarPreset || "").toLowerCase();
    if (!AVATAR_PRESETS.has(preset)) return profileJson({ error: "头像配色无效" }, 400);
    if (user.avatarType === "upload" && user.avatarValue && env.AVATARS) {
      await env.AVATARS.delete(user.avatarValue);
    }
    statements.push(
      env.DB
        .prepare(`
          UPDATE users
          SET avatar_type = 'preset', avatar_value = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .bind(preset, user.id),
    );
  }
  if (body.preferences) {
    const defaultLanguage = String(body.preferences.defaultLanguage || "Python");
    const editorFontSize = Number(body.preferences.editorFontSize ?? 14);
    const reduceMotion = Boolean(body.preferences.reduceMotion);
    const aiDetail = String(body.preferences.aiDetail || "balanced");
    if (!["Python", "C/C++", "JavaScript", "Java"].includes(defaultLanguage)) {
      return profileJson({ error: "默认语言无效" }, 400);
    }
    if (!Number.isInteger(editorFontSize) || editorFontSize < 12 || editorFontSize > 20) {
      return profileJson({ error: "编辑器字号应为 12 至 20" }, 400);
    }
    if (!["concise", "balanced", "detailed"].includes(aiDetail)) {
      return profileJson({ error: "AI 回答偏好无效" }, 400);
    }
    statements.push(
      env.DB
        .prepare(`
          INSERT INTO user_preferences (
            user_id, default_language, editor_font_size, reduce_motion, ai_detail, updated_at
          ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(user_id) DO UPDATE SET
            default_language = excluded.default_language,
            editor_font_size = excluded.editor_font_size,
            reduce_motion = excluded.reduce_motion,
            ai_detail = excluded.ai_detail,
            updated_at = CURRENT_TIMESTAMP
        `)
        .bind(user.id, defaultLanguage, editorFontSize, reduceMotion ? 1 : 0, aiDetail),
    );
  }
  if (!statements.length) return profileJson({ error: "没有需要保存的内容" }, 400);
  await env.DB.batch(statements);
  return profileJson({ saved: true });
}

function avatarType(bytes: Uint8Array, declaredType: string): { type: string; extension: string } | null {
  const png =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const webp =
    bytes.length >= 12 &&
    new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  if (png && declaredType === "image/png") return { type: "image/png", extension: "png" };
  if (jpeg && declaredType === "image/jpeg") return { type: "image/jpeg", extension: "jpg" };
  if (webp && declaredType === "image/webp") return { type: "image/webp", extension: "webp" };
  return null;
}

async function avatarRequest(
  request: Request,
  user: SessionUser,
  env: ProfileEnv,
): Promise<Response> {
  if (request.method === "GET") {
    if (user.avatarType !== "upload" || !user.avatarValue || !env.AVATARS) {
      return new Response("Not found", { status: 404 });
    }
    const object = await env.AVATARS.get(user.avatarValue);
    if (!object) return new Response("Not found", { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("Cache-Control", "private, max-age=300");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
    return new Response(object.body, { headers });
  }

  if (!sameOrigin(request)) return profileJson({ error: "请求来源无效" }, 403);
  if (request.method === "DELETE") {
    if (user.avatarType === "upload" && user.avatarValue && env.AVATARS) {
      await env.AVATARS.delete(user.avatarValue);
    }
    await env.DB
      .prepare(`
        UPDATE users
        SET avatar_type = 'preset', avatar_value = '#7182ff', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(user.id)
      .run();
    return profileJson({ removed: true });
  }
  if (request.method !== "POST") return profileJson({ error: "不支持该请求方法" }, 405);
  if (!env.AVATARS) return profileJson({ error: "头像存储尚未启用" }, 503);

  const contentLength = Number(request.headers.get("Content-Length") || "0");
  if (contentLength > AVATAR_MAX_BYTES + 100_000) {
    return profileJson({ error: "头像文件不能超过 2MB" }, 413);
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return profileJson({ error: "头像上传格式无效" }, 400);
  }
  const file = form.get("avatar");
  if (!(file instanceof File) || file.size < 16 || file.size > AVATAR_MAX_BYTES) {
    return profileJson({ error: "请选择不超过 2MB 的头像图片" }, 400);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = avatarType(bytes, file.type);
  if (!detected) {
    return profileJson({ error: "仅支持真实的 JPEG、PNG 或 WebP 图片" }, 400);
  }
  const key = `users/${user.id}/avatar-${crypto.randomUUID()}.${detected.extension}`;
  await env.AVATARS.put(key, bytes, {
    httpMetadata: {
      contentType: detected.type,
      cacheControl: "private, max-age=300",
    },
    customMetadata: { owner: user.id },
  });
  const oldKey = user.avatarType === "upload" ? user.avatarValue : null;
  await env.DB
    .prepare(`
      UPDATE users
      SET avatar_type = 'upload', avatar_value = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(key, user.id)
    .run();
  if (oldKey && oldKey !== key) await env.AVATARS.delete(oldKey);
  return profileJson({ saved: true, avatarUrl: "/api/profile/avatar" });
}

async function countRows(
  database: D1Database,
  table: string,
  where: string,
  value: string,
): Promise<number> {
  if (!(await tableExists(database, table))) return 0;
  const result = await database
    .prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${where} = ?`)
    .bind(value)
    .first<{ count: number }>();
  return Number(result?.count || 0);
}

async function overview(user: SessionUser, env: ProfileEnv): Promise<Response> {
  const userKey = `user:${user.id}`;
  await ensureAuthSchema(env.DB);
  const [completed, runs, drafts, notes, progress] = await Promise.all([
    countRows(env.DB, "lesson_completions", "user_email", userKey),
    countRows(env.DB, "code_run_history", "user_email", userKey),
    countRows(env.DB, "code_drafts", "user_email", userKey),
    countRows(env.DB, "learning_notes", "user_email", userKey),
    tableExists(env.DB, "learning_progress").then((exists) =>
      exists
        ? env.DB
            .prepare(`
              SELECT active_language, topics_json, updated_at
              FROM learning_progress
              WHERE user_email = ?
            `)
            .bind(userKey)
            .first<{ active_language: string; topics_json: string; updated_at: string }>()
        : null,
    ),
  ]);
  let topics: Record<string, number> = {};
  try {
    topics = progress?.topics_json ? JSON.parse(progress.topics_json) : {};
  } catch {
    topics = {};
  }
  return profileJson({
    stats: { completed, runs, drafts, notes },
    continueLearning: progress
      ? {
          language: progress.active_language,
          topicIndex: Number(topics[progress.active_language] || 0),
          updatedAt: progress.updated_at,
        }
      : null,
  });
}

async function history(request: Request, user: SessionUser, env: ProfileEnv): Promise<Response> {
  await ensureAuthSchema(env.DB);
  const url = new URL(request.url);
  const language = (url.searchParams.get("language") || "").slice(0, 64);
  const status = (url.searchParams.get("status") || "").slice(0, 24);
  const cursor = Math.max(0, Number(url.searchParams.get("cursor") || "0"));
  const userKey = `user:${user.id}`;
  let runs: Array<Record<string, unknown>> = [];

  if (await tableExists(env.DB, "code_run_history")) {
    await ensureColumn(env.DB, "code_run_history", "source_code", "TEXT");
    const conditions = ["user_email = ?"];
    const values: Array<string | number> = [userKey];
    if (language) {
      conditions.push("language = ?");
      values.push(language);
    }
    if (status === "passed") conditions.push("status_id = 3");
    if (status === "failed") conditions.push("status_id <> 3");
    if (cursor > 0) {
      conditions.push("id < ?");
      values.push(cursor);
    }
    const result = await env.DB
      .prepare(`
        SELECT
          id, language, topic_index, mode, status_id, status_description,
          duration_ms, memory_kb, passed_tests, total_tests,
          source_code IS NOT NULL AS code_available, created_at
        FROM code_run_history
        WHERE ${conditions.join(" AND ")}
        ORDER BY id DESC
        LIMIT 25
      `)
      .bind(...values)
      .all<{
        id: number;
        language: string;
        topic_index: number;
        mode: string;
        status_id: number;
        status_description: string;
        duration_ms: number | null;
        memory_kb: number | null;
        passed_tests: number | null;
        total_tests: number | null;
        code_available: number;
        created_at: string;
      }>();
    runs = result.results.map((item) => ({
      id: item.id,
      language: item.language,
      topicIndex: item.topic_index,
      mode: item.mode,
      statusId: item.status_id,
      statusDescription: item.status_description,
      durationMs: item.duration_ms,
      memoryKb: item.memory_kb,
      passedTests: item.passed_tests,
      totalTests: item.total_tests,
      codeAvailable: Boolean(item.code_available),
      createdAt: item.created_at,
    }));
  }
  const activities = await env.DB
    .prepare(`
      SELECT id, language, topic_index, action, created_at
      FROM learning_activity
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 25
    `)
    .bind(user.id)
    .all<{
      id: number;
      language: string;
      topic_index: number;
      action: string;
      created_at: string;
    }>();
  return profileJson({
    runs,
    activities: activities.results.map((item) => ({
      id: item.id,
      language: item.language,
      topicIndex: item.topic_index,
      action: item.action,
      createdAt: item.created_at,
    })),
    nextCursor: runs.length === 25 ? runs[runs.length - 1].id : null,
  });
}

async function exportData(user: SessionUser, env: ProfileEnv): Promise<Response> {
  await ensureAuthSchema(env.DB);
  const userKey = `user:${user.id}`;
  const result: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    user: { displayName: user.displayName, username: user.username, email: user.email },
  };
  const tableQueries: Array<[string, string, string]> = [
    ["progress", "learning_progress", "user_email"],
    ["drafts", "code_drafts", "user_email"],
    ["completions", "lesson_completions", "user_email"],
    ["runHistory", "code_run_history", "user_email"],
    ["notes", "learning_notes", "user_email"],
  ];
  for (const [key, table, column] of tableQueries) {
    result[key] = (await tableExists(env.DB, table))
      ? (await env.DB.prepare(`SELECT * FROM ${table} WHERE ${column} = ?`).bind(userKey).all()).results
      : [];
  }
  result.activities = (
    await env.DB.prepare("SELECT * FROM learning_activity WHERE user_id = ?").bind(user.id).all()
  ).results;
  const filename = `blinga-coding-data-${new Date().toISOString().slice(0, 10)}.json`;
  return new Response(JSON.stringify(result, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function clearData(request: Request, user: SessionUser, env: ProfileEnv): Promise<Response> {
  if (request.method !== "DELETE") return profileJson({ error: "仅支持 DELETE 请求" }, 405);
  if (!sameOrigin(request)) return profileJson({ error: "请求来源无效" }, 403);
  let body: { confirmation?: unknown };
  try {
    body = await request.json();
  } catch {
    return profileJson({ error: "请求格式无效" }, 400);
  }
  if (body.confirmation !== "清除我的学习数据") {
    return profileJson({ error: "请输入完整确认文字" }, 400);
  }
  const userKey = `user:${user.id}`;
  const statements: D1PreparedStatement[] = [
    env.DB.prepare("DELETE FROM learning_activity WHERE user_id = ?").bind(user.id),
  ];
  for (const table of [
    "learning_progress",
    "code_drafts",
    "lesson_completions",
    "code_run_history",
    "learning_notes",
  ]) {
    if (await tableExists(env.DB, table)) {
      statements.push(env.DB.prepare(`DELETE FROM ${table} WHERE user_email = ?`).bind(userKey));
    }
  }
  await env.DB.batch(statements);
  return profileJson({ cleared: true });
}

export async function handleProfileRequest(
  request: Request,
  env: ProfileEnv,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/profile")) return null;
  const required = await requireUser(request, env);
  if (isResponse(required)) return required;
  await ensureAuthSchema(env.DB);

  if (url.pathname === "/api/profile") {
    if (request.method === "GET") return readProfile(required, env);
    if (request.method === "PATCH") return updateProfile(request, required, env);
    return profileJson({ error: "仅支持 GET 或 PATCH 请求" }, 405);
  }
  if (url.pathname === "/api/profile/avatar") return avatarRequest(request, required, env);
  if (url.pathname === "/api/profile/overview") {
    if (request.method !== "GET") return profileJson({ error: "仅支持 GET 请求" }, 405);
    return overview(required, env);
  }
  if (url.pathname === "/api/profile/history") {
    if (request.method !== "GET") return profileJson({ error: "仅支持 GET 请求" }, 405);
    return history(request, required, env);
  }
  if (url.pathname === "/api/profile/export") {
    if (request.method !== "GET") return profileJson({ error: "仅支持 GET 请求" }, 405);
    return exportData(required, env);
  }
  if (url.pathname === "/api/profile/data") return clearData(request, required, env);
  return null;
}
