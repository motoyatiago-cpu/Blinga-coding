export type AuthProvider = "microsoft" | "qq" | "wechat-open" | "wechat-oa";

export interface AuthEnv {
  DB: D1Database;
  AUTH_SESSION_SECRET?: string;
  AUTH_LEGACY_TRANSITION?: string;
  OAUTH_BASE_URL?: string;
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_CLIENT_SECRET?: string;
  QQ_CLIENT_ID?: string;
  QQ_CLIENT_SECRET?: string;
  WECHAT_OPEN_APP_ID?: string;
  WECHAT_OPEN_APP_SECRET?: string;
  WECHAT_OA_APP_ID?: string;
  WECHAT_OA_APP_SECRET?: string;
}

export type SessionUser = {
  id: string;
  displayName: string;
  email: string | null;
  avatarType: string;
  avatarValue: string | null;
  sessionId: string;
  sessionCreatedAt: string;
};

export type RequestPrincipal = {
  userId: string | null;
  userKey: string;
  legacyEmail: string | null;
  session: SessionUser | null;
};

type OAuthProfile = {
  subject: string;
  displayName: string;
  email: string | null;
};

type OAuthTransaction = {
  id: string;
  provider: AuthProvider;
  code_verifier: string;
  nonce: string;
  return_to: string;
  link_user_id: string | null;
  expires_at: string;
};

const SESSION_COOKIE = "__Host-blinga_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const OAUTH_TRANSACTION_SECONDS = 10 * 60;
const PROVIDERS: AuthProvider[] = ["microsoft", "qq", "wechat-open", "wechat-oa"];

function authJson(data: unknown, status = 200): Response {
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

function legacyEmail(request: Request): string | null {
  const email = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase();
  return email && email.length <= 320 ? email : null;
}

function decodeLegacyName(request: Request): string | null {
  const value = request.headers.get("oai-authenticated-user-full-name")?.trim();
  if (!value) return null;
  if (request.headers.get("oai-authenticated-user-full-name-encoding") !== "percent-encoded-utf-8") {
    return value.slice(0, 80);
  }
  try {
    return decodeURIComponent(value).slice(0, 80);
  } catch {
    return null;
  }
}

function providerConfigured(provider: AuthProvider, env: AuthEnv): boolean {
  if (provider === "microsoft") {
    return Boolean(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET);
  }
  if (provider === "qq") return Boolean(env.QQ_CLIENT_ID && env.QQ_CLIENT_SECRET);
  if (provider === "wechat-open") {
    return Boolean(env.WECHAT_OPEN_APP_ID && env.WECHAT_OPEN_APP_SECRET);
  }
  return Boolean(env.WECHAT_OA_APP_ID && env.WECHAT_OA_APP_SECRET);
}

export function configuredProviders(env: AuthEnv): Record<AuthProvider, boolean> {
  return {
    microsoft: providerConfigured("microsoft", env),
    qq: providerConfigured("qq", env),
    "wechat-open": providerConfigured("wechat-open", env),
    "wechat-oa": providerConfigured("wechat-oa", env),
  };
}

function hasExternalProvider(env: AuthEnv): boolean {
  return Object.values(configuredProviders(env)).some(Boolean);
}

function legacyTransitionEnabled(env: AuthEnv): boolean {
  if (env.AUTH_LEGACY_TRANSITION === "enabled") return true;
  if (env.AUTH_LEGACY_TRANSITION === "disabled") return false;
  return !hasExternalProvider(env);
}

function parseCookies(request: Request): Map<string, string> {
  const result = new Map<string, string>();
  for (const item of (request.headers.get("Cookie") || "").split(";")) {
    const separator = item.indexOf("=");
    if (separator < 1) continue;
    result.set(item.slice(0, separator).trim(), item.slice(separator + 1).trim());
  }
  return result;
}

function sessionCookie(token: string, maxAge = SESSION_MAX_AGE_SECONDS): string {
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function randomToken(size = 32): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

async function sessionTokenHash(token: string, env: AuthEnv): Promise<string> {
  const secret = env.AUTH_SESSION_SECRET?.trim();
  if (!secret) return sha256(token);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(token));
  return bytesToBase64Url(new Uint8Array(signature));
}

function safeReturnTo(input: string | null): string {
  if (!input || !input.startsWith("/") || input.startsWith("//") || input.includes("\\")) return "/profile";
  return input.slice(0, 500);
}

function oauthOrigin(request: Request, env: AuthEnv): string {
  const configured = env.OAUTH_BASE_URL?.trim();
  if (!configured) return new URL(request.url).origin;
  try {
    return new URL(configured).origin;
  } catch {
    return new URL(request.url).origin;
  }
}

function callbackUrl(provider: AuthProvider, request: Request, env: AuthEnv): string {
  return `${oauthOrigin(request, env)}/api/auth/${provider}/callback`;
}

async function ensureColumn(
  database: D1Database,
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  const exists = await database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .bind(table)
    .first<{ name: string }>();
  if (!exists) return;
  const columns = await database.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
  if (!columns.results.some((entry) => entry.name === column)) {
    await database.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
}

export async function ensureOwnershipColumns(database: D1Database): Promise<void> {
  for (const table of [
    "learning_progress",
    "code_drafts",
    "lesson_completions",
    "code_run_history",
    "learning_notes",
  ]) {
    await ensureColumn(database, table, "user_id", "TEXT");
    await database
      .prepare(`CREATE INDEX IF NOT EXISTS ${table}_user_id_idx ON ${table} (user_id)`)
      .run()
      .catch(() => undefined);
  }
}

export async function ensureAuthSchema(database: D1Database): Promise<void> {
  await database.batch([
    database.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        display_name TEXT NOT NULL,
        email TEXT,
        avatar_type TEXT NOT NULL DEFAULT 'preset',
        avatar_value TEXT,
        legacy_email TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_login_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    database.prepare(`
      CREATE TABLE IF NOT EXISTS oauth_identities (
        provider TEXT NOT NULL,
        provider_subject TEXT NOT NULL,
        user_id TEXT NOT NULL,
        provider_email TEXT,
        provider_name TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_used_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (provider, provider_subject)
      )
    `),
    database.prepare(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        token_hash TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        user_agent TEXT,
        ip_hint TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TEXT NOT NULL
      )
    `),
    database.prepare(`
      CREATE TABLE IF NOT EXISTS oauth_transactions (
        id TEXT PRIMARY KEY NOT NULL,
        state_hash TEXT UNIQUE NOT NULL,
        provider TEXT NOT NULL,
        code_verifier TEXT NOT NULL,
        nonce TEXT NOT NULL,
        return_to TEXT NOT NULL,
        link_user_id TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TEXT NOT NULL
      )
    `),
    database.prepare(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id TEXT PRIMARY KEY NOT NULL,
        default_language TEXT NOT NULL DEFAULT 'Python',
        editor_font_size INTEGER NOT NULL DEFAULT 14,
        reduce_motion INTEGER NOT NULL DEFAULT 0,
        ai_detail TEXT NOT NULL DEFAULT 'balanced',
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    database.prepare(`
      CREATE TABLE IF NOT EXISTS learning_activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        language TEXT NOT NULL,
        topic_index INTEGER NOT NULL,
        action TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    database.prepare("CREATE INDEX IF NOT EXISTS oauth_identities_user_idx ON oauth_identities (user_id)"),
    database.prepare("CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions (user_id, expires_at)"),
    database.prepare("CREATE INDEX IF NOT EXISTS oauth_transactions_expiry_idx ON oauth_transactions (expires_at)"),
    database.prepare("CREATE INDEX IF NOT EXISTS learning_activity_user_idx ON learning_activity (user_id, id DESC)"),
  ]);
  await ensureOwnershipColumns(database);
}

export async function getSessionUser(request: Request, env: AuthEnv): Promise<SessionUser | null> {
  const token = parseCookies(request).get(SESSION_COOKIE);
  if (!token || token.length > 256) return null;
  await ensureAuthSchema(env.DB);
  const tokenHash = await sessionTokenHash(token, env);
  const record = await env.DB
    .prepare(`
      SELECT
        u.id, u.display_name, u.email, u.avatar_type, u.avatar_value,
        s.id AS session_id, s.created_at AS session_created_at, s.last_seen_at
      FROM auth_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP
    `)
    .bind(tokenHash)
    .first<{
      id: string;
      display_name: string;
      email: string | null;
      avatar_type: string;
      avatar_value: string | null;
      session_id: string;
      session_created_at: string;
      last_seen_at: string;
    }>();
  if (!record) return null;

  const lastSeen = Date.parse(record.last_seen_at);
  if (!Number.isFinite(lastSeen) || Date.now() - lastSeen > 60 * 60 * 1000) {
    await env.DB
      .prepare("UPDATE auth_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(record.session_id)
      .run();
  }

  return {
    id: record.id,
    displayName: record.display_name,
    email: record.email,
    avatarType: record.avatar_type,
    avatarValue: record.avatar_value,
    sessionId: record.session_id,
    sessionCreatedAt: record.session_created_at,
  };
}

export async function resolvePrincipal(request: Request, env: AuthEnv): Promise<RequestPrincipal | null> {
  const session = await getSessionUser(request, env);
  if (session) {
    return {
      userId: session.id,
      userKey: `user:${session.id}`,
      legacyEmail: null,
      session,
    };
  }

  const email = legacyTransitionEnabled(env) ? legacyEmail(request) : null;
  if (!email) return null;
  return {
    userId: null,
    userKey: email,
    legacyEmail: email,
    session: null,
  };
}

async function createSession(userId: string, request: Request, env: AuthEnv): Promise<string> {
  const token = randomToken(32);
  const tokenHash = await sessionTokenHash(token, env);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
  const userAgent = (request.headers.get("User-Agent") || "未知设备").slice(0, 240);
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const ipHint = ip.includes(".") ? `${ip.split(".").slice(0, 2).join(".")}.*.*` : ip.slice(0, 18);
  await env.DB
    .prepare(`
      INSERT INTO auth_sessions (
        id, token_hash, user_id, user_agent, ip_hint, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `)
    .bind(crypto.randomUUID(), tokenHash, userId, userAgent, ipHint, expiresAt)
    .run();
  return token;
}

async function migrateLegacyData(
  userId: string,
  request: Request,
  env: AuthEnv,
): Promise<void> {
  const email = legacyEmail(request);
  if (!email) return;
  await ensureOwnershipColumns(env.DB);
  const userKey = `user:${userId}`;
  await env.DB.batch([
    env.DB
      .prepare("UPDATE learning_progress SET user_email = ?, user_id = ? WHERE user_email = ?")
      .bind(userKey, userId, email),
    env.DB
      .prepare("UPDATE code_drafts SET user_email = ?, user_id = ? WHERE user_email = ?")
      .bind(userKey, userId, email),
    env.DB
      .prepare("UPDATE lesson_completions SET user_email = ?, user_id = ? WHERE user_email = ?")
      .bind(userKey, userId, email),
    env.DB
      .prepare("UPDATE code_run_history SET user_email = ?, user_id = ? WHERE user_email = ?")
      .bind(userKey, userId, email),
    env.DB
      .prepare("UPDATE learning_notes SET user_email = ?, user_id = ? WHERE user_email = ?")
      .bind(userKey, userId, email),
    env.DB
      .prepare("UPDATE users SET legacy_email = COALESCE(legacy_email, ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(email, userId),
  ]);
}

function providerClientId(provider: AuthProvider, env: AuthEnv): string {
  if (provider === "microsoft") return env.MICROSOFT_CLIENT_ID || "";
  if (provider === "qq") return env.QQ_CLIENT_ID || "";
  if (provider === "wechat-open") return env.WECHAT_OPEN_APP_ID || "";
  return env.WECHAT_OA_APP_ID || "";
}

function authorizationUrl(
  provider: AuthProvider,
  state: string,
  verifierChallenge: string,
  nonce: string,
  request: Request,
  env: AuthEnv,
): string {
  const redirectUri = callbackUrl(provider, request, env);
  if (provider === "microsoft") {
    const url = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
    url.search = new URLSearchParams({
      client_id: providerClientId(provider, env),
      response_type: "code",
      redirect_uri: redirectUri,
      response_mode: "query",
      scope: "openid profile email",
      state,
      nonce,
      code_challenge: verifierChallenge,
      code_challenge_method: "S256",
    }).toString();
    return url.toString();
  }
  if (provider === "qq") {
    const url = new URL("https://graph.qq.com/oauth2.0/authorize");
    url.search = new URLSearchParams({
      response_type: "code",
      client_id: providerClientId(provider, env),
      redirect_uri: redirectUri,
      state,
      scope: "get_user_info",
    }).toString();
    return url.toString();
  }
  const openPlatform = provider === "wechat-open";
  const url = new URL(
    openPlatform
      ? "https://open.weixin.qq.com/connect/qrconnect"
      : "https://open.weixin.qq.com/connect/oauth2/authorize",
  );
  url.search = new URLSearchParams({
    appid: providerClientId(provider, env),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: openPlatform ? "snsapi_login" : "snsapi_userinfo",
    state,
  }).toString();
  return `${url.toString()}#wechat_redirect`;
}

async function startOAuth(provider: AuthProvider, request: Request, env: AuthEnv): Promise<Response> {
  if (request.method !== "GET") return authJson({ error: "仅支持 GET 请求" }, 405);
  if (!providerConfigured(provider, env)) {
    return authJson({ error: "该登录方式尚未配置" }, 503);
  }
  await ensureAuthSchema(env.DB);

  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");
  const currentSession = intent === "link" ? await getSessionUser(request, env) : null;
  if (intent === "link" && !currentSession) {
    return authJson({ error: "请先登录后再绑定其他账号" }, 401);
  }

  const state = randomToken(32);
  const verifier = randomToken(48);
  const nonce = randomToken(24);
  const challenge = await sha256(verifier);
  const expiresAt = new Date(Date.now() + OAUTH_TRANSACTION_SECONDS * 1000).toISOString();
  await env.DB.prepare("DELETE FROM oauth_transactions WHERE expires_at <= CURRENT_TIMESTAMP").run();
  await env.DB
    .prepare(`
      INSERT INTO oauth_transactions (
        id, state_hash, provider, code_verifier, nonce, return_to, link_user_id, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      crypto.randomUUID(),
      await sha256(state),
      provider,
      verifier,
      nonce,
      safeReturnTo(url.searchParams.get("returnTo")),
      currentSession?.id || null,
      expiresAt,
    )
    .run();

  return Response.redirect(
    authorizationUrl(provider, state, challenge, nonce, request, env),
    302,
  );
}

function parseJwt(value: string): {
  header: { kid?: string; alg?: string };
  payload: Record<string, unknown>;
  signingInput: string;
  signature: Uint8Array;
} {
  const parts = value.split(".");
  if (parts.length !== 3) throw new Error("ID token 格式无效");
  return {
    header: JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[0]))),
    payload: JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[1]))),
    signingInput: `${parts[0]}.${parts[1]}`,
    signature: base64UrlToBytes(parts[2]),
  };
}

async function validateMicrosoftIdToken(
  idToken: string,
  nonce: string,
  env: AuthEnv,
): Promise<OAuthProfile> {
  const parsed = parseJwt(idToken);
  if (parsed.header.alg !== "RS256" || !parsed.header.kid) throw new Error("ID token 签名算法无效");
  const response = await fetch("https://login.microsoftonline.com/common/discovery/v2.0/keys", {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("无法读取 Microsoft 签名密钥");
  const jwks = (await response.json()) as { keys?: Array<JsonWebKey & { kid?: string; use?: string }> };
  const jwk = jwks.keys?.find((item) => item.kid === parsed.header.kid && item.use === "sig");
  if (!jwk) throw new Error("Microsoft 签名密钥不匹配");
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    parsed.signature,
    new TextEncoder().encode(parsed.signingInput),
  );
  if (!valid) throw new Error("Microsoft ID token 签名无效");

  const payload = parsed.payload;
  const now = Math.floor(Date.now() / 1000);
  const tenant = String(payload.tid || "");
  const issuer = String(payload.iss || "");
  const expectedIssuer = tenant ? `https://login.microsoftonline.com/${tenant}/v2.0` : "";
  if (
    payload.aud !== env.MICROSOFT_CLIENT_ID ||
    payload.nonce !== nonce ||
    Number(payload.exp || 0) <= now ||
    !tenant ||
    issuer !== expectedIssuer
  ) {
    throw new Error("Microsoft ID token 声明无效");
  }
  const subject = String(payload.sub || "");
  if (!subject) throw new Error("Microsoft 用户标识缺失");
  const email = String(payload.email || payload.preferred_username || "").trim().toLowerCase();
  return {
    subject: `${tenant}:${subject}`,
    displayName: String(payload.name || email || "Microsoft 用户").slice(0, 80),
    email: email && email.length <= 320 ? email : null,
  };
}

async function microsoftProfile(
  code: string,
  transaction: OAuthTransaction,
  request: Request,
  env: AuthEnv,
): Promise<OAuthProfile> {
  const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    signal: AbortSignal.timeout(15_000),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.MICROSOFT_CLIENT_ID || "",
      client_secret: env.MICROSOFT_CLIENT_SECRET || "",
      code,
      redirect_uri: callbackUrl("microsoft", request, env),
      grant_type: "authorization_code",
      code_verifier: transaction.code_verifier,
      scope: "openid profile email",
    }),
  });
  const result = (await response.json()) as { id_token?: string; error_description?: string };
  if (!response.ok || !result.id_token) {
    throw new Error(result.error_description || "Microsoft 授权码兑换失败");
  }
  return validateMicrosoftIdToken(result.id_token, transaction.nonce, env);
}

async function qqProfile(code: string, request: Request, env: AuthEnv): Promise<OAuthProfile> {
  const tokenUrl = new URL("https://graph.qq.com/oauth2.0/token");
  tokenUrl.search = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: env.QQ_CLIENT_ID || "",
    client_secret: env.QQ_CLIENT_SECRET || "",
    code,
    redirect_uri: callbackUrl("qq", request, env),
    fmt: "json",
  }).toString();
  const tokenResponse = await fetch(tokenUrl, { signal: AbortSignal.timeout(15_000) });
  const tokenText = await tokenResponse.text();
  let accessToken = "";
  try {
    const token = JSON.parse(tokenText) as { access_token?: string; error_description?: string };
    accessToken = token.access_token || "";
    if (!accessToken && token.error_description) throw new Error(token.error_description);
  } catch {
    accessToken = new URLSearchParams(tokenText).get("access_token") || "";
  }
  if (!tokenResponse.ok || !accessToken) throw new Error("QQ 授权码兑换失败");

  const meUrl = new URL("https://graph.qq.com/oauth2.0/me");
  meUrl.search = new URLSearchParams({ access_token: accessToken, fmt: "json" }).toString();
  const meResponse = await fetch(meUrl, { signal: AbortSignal.timeout(10_000) });
  const me = (await meResponse.json()) as { openid?: string; client_id?: string; error_description?: string };
  if (!meResponse.ok || !me.openid || me.client_id !== env.QQ_CLIENT_ID) {
    throw new Error(me.error_description || "QQ OpenID 校验失败");
  }

  const userUrl = new URL("https://graph.qq.com/user/get_user_info");
  userUrl.search = new URLSearchParams({
    access_token: accessToken,
    oauth_consumer_key: env.QQ_CLIENT_ID || "",
    openid: me.openid,
    format: "json",
  }).toString();
  const userResponse = await fetch(userUrl, { signal: AbortSignal.timeout(10_000) });
  const user = (await userResponse.json()) as { nickname?: string; ret?: number; msg?: string };
  if (!userResponse.ok || Number(user.ret || 0) !== 0) throw new Error(user.msg || "QQ 用户资料读取失败");
  return {
    subject: me.openid,
    displayName: String(user.nickname || "QQ 用户").slice(0, 80),
    email: null,
  };
}

async function wechatProfile(
  provider: "wechat-open" | "wechat-oa",
  code: string,
  request: Request,
  env: AuthEnv,
): Promise<OAuthProfile> {
  const appId = provider === "wechat-open" ? env.WECHAT_OPEN_APP_ID : env.WECHAT_OA_APP_ID;
  const secret = provider === "wechat-open" ? env.WECHAT_OPEN_APP_SECRET : env.WECHAT_OA_APP_SECRET;
  const tokenUrl = new URL("https://api.weixin.qq.com/sns/oauth2/access_token");
  tokenUrl.search = new URLSearchParams({
    appid: appId || "",
    secret: secret || "",
    code,
    grant_type: "authorization_code",
  }).toString();
  const tokenResponse = await fetch(tokenUrl, { signal: AbortSignal.timeout(15_000) });
  const token = (await tokenResponse.json()) as {
    access_token?: string;
    openid?: string;
    unionid?: string;
    errmsg?: string;
  };
  if (!tokenResponse.ok || !token.access_token || !token.openid) {
    throw new Error(token.errmsg || "微信授权码兑换失败");
  }
  const userUrl = new URL("https://api.weixin.qq.com/sns/userinfo");
  userUrl.search = new URLSearchParams({
    access_token: token.access_token,
    openid: token.openid,
    lang: "zh_CN",
  }).toString();
  const userResponse = await fetch(userUrl, { signal: AbortSignal.timeout(10_000) });
  const user = (await userResponse.json()) as {
    nickname?: string;
    unionid?: string;
    openid?: string;
    errmsg?: string;
  };
  if (!userResponse.ok || !user.openid) throw new Error(user.errmsg || "微信用户资料读取失败");
  return {
    subject: user.unionid ? `union:${user.unionid}` : `openid:${user.openid}`,
    displayName: String(user.nickname || "微信用户").slice(0, 80),
    email: null,
  };
}

async function exchangeProfile(
  provider: AuthProvider,
  code: string,
  transaction: OAuthTransaction,
  request: Request,
  env: AuthEnv,
): Promise<OAuthProfile> {
  if (provider === "microsoft") return microsoftProfile(code, transaction, request, env);
  if (provider === "qq") return qqProfile(code, request, env);
  return wechatProfile(provider, code, request, env);
}

async function finishOAuth(provider: AuthProvider, request: Request, env: AuthEnv): Promise<Response> {
  if (request.method !== "GET") return authJson({ error: "仅支持 GET 请求" }, 405);
  if (!providerConfigured(provider, env)) {
    return authJson({ error: "该登录方式尚未配置" }, 503);
  }
  await ensureAuthSchema(env.DB);
  const url = new URL(request.url);
  const state = url.searchParams.get("state") || "";
  const code = url.searchParams.get("code") || "";
  if (!state || !code) {
    return Response.redirect(`${oauthOrigin(request, env)}/profile?authError=cancelled`, 302);
  }
  const stateHash = await sha256(state);
  const transaction = await env.DB
    .prepare(`
      SELECT id, provider, code_verifier, nonce, return_to, link_user_id, expires_at
      FROM oauth_transactions
      WHERE state_hash = ? AND provider = ? AND expires_at > CURRENT_TIMESTAMP
    `)
    .bind(stateHash, provider)
    .first<OAuthTransaction>();
  if (!transaction) {
    return Response.redirect(`${oauthOrigin(request, env)}/profile?authError=expired`, 302);
  }
  await env.DB.prepare("DELETE FROM oauth_transactions WHERE id = ?").bind(transaction.id).run();

  try {
    const profile = await exchangeProfile(provider, code, transaction, request, env);
    const existing = await env.DB
      .prepare("SELECT user_id FROM oauth_identities WHERE provider = ? AND provider_subject = ?")
      .bind(provider, profile.subject)
      .first<{ user_id: string }>();

    let userId = transaction.link_user_id;
    if (userId) {
      if (existing && existing.user_id !== userId) {
        throw new Error("该登录方式已绑定其他 Blinga coding 账号");
      }
    } else if (existing) {
      userId = existing.user_id;
    } else {
      userId = crypto.randomUUID();
      await env.DB
        .prepare(`
          INSERT INTO users (id, display_name, email, avatar_type, avatar_value)
          VALUES (?, ?, ?, 'preset', '#7182ff')
        `)
        .bind(userId, profile.displayName, profile.email)
        .run();
      await env.DB
        .prepare(`
          INSERT INTO user_preferences (user_id)
          VALUES (?)
          ON CONFLICT(user_id) DO NOTHING
        `)
        .bind(userId)
        .run();
    }

    await env.DB
      .prepare(`
        INSERT INTO oauth_identities (
          provider, provider_subject, user_id, provider_email, provider_name
        ) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(provider, provider_subject) DO UPDATE SET
          provider_email = excluded.provider_email,
          provider_name = excluded.provider_name,
          last_used_at = CURRENT_TIMESTAMP
      `)
      .bind(provider, profile.subject, userId, profile.email, profile.displayName)
      .run();
    await env.DB
      .prepare(`
        UPDATE users
        SET email = COALESCE(email, ?), last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(profile.email, userId)
      .run();
    await migrateLegacyData(userId, request, env);
    const token = await createSession(userId, request, env);
    const response = Response.redirect(`${oauthOrigin(request, env)}${safeReturnTo(transaction.return_to)}`, 302);
    response.headers.append("Set-Cookie", sessionCookie(token));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 120) : "登录失败";
    const target = new URL("/profile", oauthOrigin(request, env));
    target.searchParams.set("authError", reason);
    return Response.redirect(target.toString(), 302);
  }
}

async function sessionPayload(request: Request, env: AuthEnv): Promise<Response> {
  const user = await getSessionUser(request, env);
  const providers = configuredProviders(env);
  if (!user) {
    const transitionEmail = legacyTransitionEnabled(env) ? legacyEmail(request) : null;
    return authJson({
      authenticated: false,
      providers,
      transition: transitionEmail
        ? {
            active: true,
            displayName: decodeLegacyName(request) || transitionEmail.split("@")[0],
          }
        : null,
    });
  }
  const links = await env.DB
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
    }>();
  return authJson({
    authenticated: true,
    providers,
    user: {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      avatarType: user.avatarType,
      avatarValue: user.avatarValue,
      avatarUrl: user.avatarType === "upload" ? "/api/profile/avatar" : null,
    },
    links: links.results.map((link) => ({
      provider: link.provider,
      name: link.provider_name,
      email: link.provider_email,
      createdAt: link.created_at,
      lastUsedAt: link.last_used_at,
    })),
  });
}

async function logout(request: Request, env: AuthEnv, all = false): Promise<Response> {
  if (request.method !== "POST") return authJson({ error: "仅支持 POST 请求" }, 405);
  if (!sameOrigin(request)) return authJson({ error: "请求来源无效" }, 403);
  const user = await getSessionUser(request, env);
  if (user) {
    if (all) {
      await env.DB.prepare("DELETE FROM auth_sessions WHERE user_id = ?").bind(user.id).run();
    } else {
      await env.DB.prepare("DELETE FROM auth_sessions WHERE id = ?").bind(user.sessionId).run();
    }
  }
  const response = authJson({ signedOut: true });
  response.headers.append("Set-Cookie", sessionCookie("", 0));
  return response;
}

async function removeLink(request: Request, env: AuthEnv): Promise<Response> {
  if (request.method === "GET") return sessionPayload(request, env);
  if (request.method !== "DELETE") return authJson({ error: "仅支持 GET 或 DELETE 请求" }, 405);
  if (!sameOrigin(request)) return authJson({ error: "请求来源无效" }, 403);
  const user = await getSessionUser(request, env);
  if (!user) return authJson({ error: "请先登录" }, 401);
  let body: { provider?: unknown };
  try {
    body = await request.json();
  } catch {
    return authJson({ error: "请求格式无效" }, 400);
  }
  const provider = String(body.provider || "") as AuthProvider;
  if (!PROVIDERS.includes(provider)) return authJson({ error: "登录方式无效" }, 400);
  const count = await env.DB
    .prepare("SELECT COUNT(*) AS count FROM oauth_identities WHERE user_id = ?")
    .bind(user.id)
    .first<{ count: number }>();
  if (Number(count?.count || 0) <= 1) {
    return authJson({ error: "必须至少保留一种登录方式" }, 409);
  }
  await env.DB
    .prepare("DELETE FROM oauth_identities WHERE user_id = ? AND provider = ?")
    .bind(user.id, provider)
    .run();
  return authJson({ removed: true });
}

export async function handleAuthRequest(
  request: Request,
  env: AuthEnv,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname === "/api/auth/providers" || url.pathname === "/api/auth/session") {
    if (request.method !== "GET") return authJson({ error: "仅支持 GET 请求" }, 405);
    return sessionPayload(request, env);
  }
  if (url.pathname === "/api/auth/logout") return logout(request, env, false);
  if (url.pathname === "/api/auth/logout-all") return logout(request, env, true);
  if (url.pathname === "/api/auth/links") return removeLink(request, env);

  const match = url.pathname.match(
    /^\/api\/auth\/(microsoft|qq|wechat-open|wechat-oa)\/(start|callback)$/,
  );
  if (!match) return null;
  const provider = match[1] as AuthProvider;
  return match[2] === "start"
    ? startOAuth(provider, request, env)
    : finishOAuth(provider, request, env);
}
