import { resolvePrincipal, type AuthEnv, type RequestPrincipal } from "./auth";

export type MasteryState = "not_started" | "learning" | "mastered" | "review_due";

export interface ReviewEnv extends AuthEnv {
  DB: D1Database;
}

export type ReviewResultInput = {
  language: string;
  topicIndex: number;
  mode: "run" | "judge";
  passed: boolean;
  runId: number | null;
  sourceCode: string;
  errorSummary: string;
};

const MAX_SOURCE_LENGTH = 12_000;
const MAX_ERROR_LENGTH = 1_000;
const MAX_MUTATION_BYTES = 2_000;
const VALID_STATES = new Set<MasteryState>([
  "not_started",
  "learning",
  "mastered",
  "review_due",
]);

function reviewJson(data: unknown, status = 200): Response {
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

function schemaNotReady(): Response {
  return reviewJson({
    error: "复习系统正在升级，请稍后再试",
    code: "REVIEW_SCHEMA_NOT_READY",
  }, 503);
}

function isMissingSchema(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /no such table|no such column|does not exist/i.test(message);
}

function asPositiveInteger(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Keeps the learning signal intentionally simple and explainable:
 * - any first execution starts learning;
 * - a failed judge returns the topic to learning and creates a wrong-answer item;
 * - a passed judge marks mastery and schedules review after 3, 7, then 14 days;
 * - ordinary runs never promote a topic to mastered.
 */
export async function recordReviewResult(
  database: D1Database,
  principal: RequestPrincipal,
  input: ReviewResultInput,
): Promise<void> {
  const common = [
    principal.userKey,
    principal.userId,
    input.language.slice(0, 64),
    Math.max(0, Math.min(999, Math.trunc(input.topicIndex))),
  ] as const;

  if (input.mode === "run") {
    await database.prepare(`
      INSERT INTO learning_mastery (
        user_key, user_id, language, topic_index, state,
        successful_judges, failed_judges, consecutive_passes,
        last_attempt_at, updated_at
      ) VALUES (?, ?, ?, ?, 'learning', 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(user_key, language, topic_index) DO UPDATE SET
        user_id = excluded.user_id,
        last_attempt_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `).bind(...common).run();
    return;
  }

  if (input.passed) {
    const mastery = database.prepare(`
      INSERT INTO learning_mastery (
        user_key, user_id, language, topic_index, state,
        successful_judges, failed_judges, consecutive_passes,
        last_attempt_at, last_passed_at, review_due_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, 'mastered', 1, 0, 1,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, datetime('now', '+3 days'), CURRENT_TIMESTAMP
      )
      ON CONFLICT(user_key, language, topic_index) DO UPDATE SET
        user_id = excluded.user_id,
        state = 'mastered',
        successful_judges = learning_mastery.successful_judges + 1,
        consecutive_passes = learning_mastery.consecutive_passes + 1,
        last_attempt_at = CURRENT_TIMESTAMP,
        last_passed_at = CURRENT_TIMESTAMP,
        review_due_at = datetime('now', CASE
          WHEN learning_mastery.successful_judges = 0 THEN '+3 days'
          WHEN learning_mastery.successful_judges = 1 THEN '+7 days'
          ELSE '+14 days'
        END),
        updated_at = CURRENT_TIMESTAMP
    `).bind(...common);
    const closeWrongAnswers = database.prepare(`
      UPDATE wrong_answers
      SET status = 'reviewed', reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE user_key = ? AND language = ? AND topic_index = ? AND status = 'pending'
    `).bind(principal.userKey, common[2], common[3]);
    await database.batch([mastery, closeWrongAnswers]);
    return;
  }

  const mastery = database.prepare(`
    INSERT INTO learning_mastery (
      user_key, user_id, language, topic_index, state,
      successful_judges, failed_judges, consecutive_passes,
      last_attempt_at, review_due_at, updated_at
    ) VALUES (?, ?, ?, ?, 'learning', 0, 1, 0, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP)
    ON CONFLICT(user_key, language, topic_index) DO UPDATE SET
      user_id = excluded.user_id,
      state = 'learning',
      failed_judges = learning_mastery.failed_judges + 1,
      consecutive_passes = 0,
      last_attempt_at = CURRENT_TIMESTAMP,
      review_due_at = NULL,
      updated_at = CURRENT_TIMESTAMP
  `).bind(...common);
  const wrongAnswer = database.prepare(`
    INSERT INTO wrong_answers (
      user_key, user_id, language, topic_index, run_id,
      error_summary, source_code, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    ...common,
    input.runId && input.runId > 0 ? input.runId : null,
    input.errorSummary.trim().slice(0, MAX_ERROR_LENGTH) || "判题未通过",
    input.sourceCode.slice(0, MAX_SOURCE_LENGTH),
  );
  await database.batch([mastery, wrongAnswer]);
}

async function markDue(database: D1Database, userKey: string): Promise<void> {
  await database.prepare(`
    UPDATE learning_mastery
    SET state = 'review_due', updated_at = CURRENT_TIMESTAMP
    WHERE user_key = ?
      AND state = 'mastered'
      AND review_due_at IS NOT NULL
      AND review_due_at <= CURRENT_TIMESTAMP
  `).bind(userKey).run();
}

type WrongAnswerRow = {
  id: number;
  language: string;
  topic_index: number;
  run_id: number | null;
  error_summary: string;
  status: string;
  retry_count: number;
  reviewed_at: string | null;
  last_retried_at: string | null;
  created_at: string;
  updated_at: string;
};

function wrongAnswerJson(row: WrongAnswerRow) {
  return {
    id: row.id,
    language: row.language,
    topicIndex: row.topic_index,
    runId: row.run_id,
    errorSummary: row.error_summary,
    status: row.status,
    retryCount: row.retry_count,
    reviewedAt: row.reviewed_at,
    lastRetriedAt: row.last_retried_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listReview(request: Request, env: ReviewEnv, principal: RequestPrincipal): Promise<Response> {
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") || "20");
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 50) {
    return reviewJson({ error: "limit 必须是 1 至 50 的整数" }, 400);
  }
  const cursorParam = url.searchParams.get("cursor");
  const cursor = cursorParam === null ? null : asPositiveInteger(cursorParam);
  if (cursorParam !== null && cursor === null) {
    return reviewJson({ error: "cursor 无效" }, 400);
  }
  const stateParam = url.searchParams.get("state");
  if (stateParam && !VALID_STATES.has(stateParam as MasteryState)) {
    return reviewJson({ error: "掌握状态无效" }, 400);
  }

  await markDue(env.DB, principal.userKey);
  const queueQuery = cursor
    ? `
      SELECT id, language, topic_index, run_id, error_summary, status, retry_count,
        reviewed_at, last_retried_at, created_at, updated_at
      FROM wrong_answers
      WHERE user_key = ? AND status = 'pending' AND id < ?
      ORDER BY id DESC LIMIT ?
    `
    : `
      SELECT id, language, topic_index, run_id, error_summary, status, retry_count,
        reviewed_at, last_retried_at, created_at, updated_at
      FROM wrong_answers
      WHERE user_key = ? AND status = 'pending'
      ORDER BY id DESC LIMIT ?
    `;
  const queueStatement = env.DB.prepare(queueQuery).bind(
    principal.userKey,
    ...(cursor ? [cursor] : []),
    requestedLimit + 1,
  );
  const masteryConditions = ["user_key = ?"];
  const masteryValues: Array<string> = [principal.userKey];
  if (stateParam) {
    masteryConditions.push("state = ?");
    masteryValues.push(stateParam);
  }
  const [queueResult, masteryResult, stats] = await Promise.all([
    queueStatement.all<WrongAnswerRow>(),
    env.DB.prepare(`
      SELECT language, topic_index, state, successful_judges, failed_judges,
        consecutive_passes, last_attempt_at, last_passed_at, review_due_at, updated_at
      FROM learning_mastery
      WHERE ${masteryConditions.join(" AND ")}
      ORDER BY CASE state WHEN 'review_due' THEN 0 WHEN 'learning' THEN 1 ELSE 2 END,
        updated_at DESC
      LIMIT 100
    `).bind(...masteryValues).all<{
      language: string;
      topic_index: number;
      state: MasteryState;
      successful_judges: number;
      failed_judges: number;
      consecutive_passes: number;
      last_attempt_at: string | null;
      last_passed_at: string | null;
      review_due_at: string | null;
      updated_at: string;
    }>(),
    env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM wrong_answers WHERE user_key = ? AND status = 'pending') AS pending,
        SUM(CASE WHEN state = 'mastered' THEN 1 ELSE 0 END) AS mastered,
        SUM(CASE WHEN state = 'review_due' THEN 1 ELSE 0 END) AS review_due,
        SUM(CASE WHEN state = 'learning' THEN 1 ELSE 0 END) AS learning
      FROM learning_mastery WHERE user_key = ?
    `).bind(principal.userKey, principal.userKey).first<{
      pending: number | null;
      mastered: number | null;
      review_due: number | null;
      learning: number | null;
    }>(),
  ]);
  const hasMore = queueResult.results.length > requestedLimit;
  const queue = queueResult.results.slice(0, requestedLimit);
  return reviewJson({
    queue: queue.map(wrongAnswerJson),
    mastery: masteryResult.results.map((row) => ({
      language: row.language,
      topicIndex: row.topic_index,
      state: row.state,
      successfulJudges: row.successful_judges,
      failedJudges: row.failed_judges,
      consecutivePasses: row.consecutive_passes,
      lastAttemptAt: row.last_attempt_at,
      lastPassedAt: row.last_passed_at,
      reviewDueAt: row.review_due_at,
      updatedAt: row.updated_at,
    })),
    stats: {
      pending: Number(stats?.pending || 0),
      mastered: Number(stats?.mastered || 0),
      reviewDue: Number(stats?.review_due || 0),
      learning: Number(stats?.learning || 0),
    },
    nextCursor: hasMore ? queue[queue.length - 1]?.id ?? null : null,
  });
}

async function reviewDetail(id: number, env: ReviewEnv, principal: RequestPrincipal): Promise<Response> {
  const row = await env.DB.prepare(`
    SELECT id, language, topic_index, run_id, error_summary, source_code,
      status, retry_count, reviewed_at, last_retried_at, created_at, updated_at
    FROM wrong_answers
    WHERE id = ? AND user_key = ?
  `).bind(id, principal.userKey).first<WrongAnswerRow & { source_code: string }>();
  if (!row) return reviewJson({ error: "没有找到这条错题记录" }, 404);
  return reviewJson({ item: { ...wrongAnswerJson(row), sourceCode: row.source_code } });
}

async function mutateReview(
  request: Request,
  id: number,
  env: ReviewEnv,
  principal: RequestPrincipal,
): Promise<Response> {
  if (!sameOrigin(request)) return reviewJson({ error: "请求来源无效" }, 403);
  const contentLength = Number(request.headers.get("Content-Length") || "0");
  if (contentLength > MAX_MUTATION_BYTES) return reviewJson({ error: "请求内容过大" }, 413);
  let body: { action?: unknown };
  try {
    body = await request.json();
  } catch {
    return reviewJson({ error: "请求格式无效" }, 400);
  }
  const action = String(body.action || "");
  if (action !== "reviewed" && action !== "retry") {
    return reviewJson({ error: "复习操作无效" }, 400);
  }
  const result = action === "reviewed"
    ? await env.DB.prepare(`
        UPDATE wrong_answers
        SET status = 'reviewed', reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_key = ?
      `).bind(id, principal.userKey).run()
    : await env.DB.prepare(`
        UPDATE wrong_answers
        SET retry_count = retry_count + 1,
          last_retried_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_key = ?
      `).bind(id, principal.userKey).run();
  if (Number(result.meta.changes || 0) === 0) {
    return reviewJson({ error: "没有找到这条错题记录" }, 404);
  }
  if (action === "retry") return reviewDetail(id, env, principal);
  return reviewJson({ updated: true, id, status: "reviewed" });
}

export async function handleReviewRequest(
  request: Request,
  env: ReviewEnv,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/review" && !url.pathname.startsWith("/api/review/")) return null;
  const principal = await resolvePrincipal(request, env);
  if (!principal) return reviewJson({ error: "请先登录后使用复习系统" }, 401);

  try {
    if (url.pathname === "/api/review") {
      if (request.method !== "GET") return reviewJson({ error: "仅支持 GET 请求" }, 405);
      return await listReview(request, env, principal);
    }
    const id = asPositiveInteger(url.pathname.slice("/api/review/".length));
    if (id === null || url.pathname.slice("/api/review/".length).includes("/")) {
      return reviewJson({ error: "错题记录标识无效" }, 400);
    }
    if (request.method === "GET") return await reviewDetail(id, env, principal);
    if (request.method === "PATCH") return await mutateReview(request, id, env, principal);
    return reviewJson({ error: "仅支持 GET 或 PATCH 请求" }, 405);
  } catch (error) {
    if (isMissingSchema(error)) return schemaNotReady();
    console.error("Review request failed", error);
    return reviewJson({ error: "复习数据暂时无法读取" }, 500);
  }
}
