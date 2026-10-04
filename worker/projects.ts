import { emptyMilestoneProgress, getProjectBlueprint, type ProjectProgressStatus } from "../data/project-blueprints";
import { resolvePrincipal, type AuthEnv } from "./auth";

const MAX_REQUEST_BYTES = 2_048;
const MAX_WRITES_PER_MINUTE = 20;
const VALID_STATUSES = new Set<ProjectProgressStatus>(["not_started", "in_progress", "completed"]);

type ProjectProgressRecord = {
  milestone_json: string;
  status: ProjectProgressStatus;
  write_window_started_at: string;
  write_count: number;
  updated_at: string;
};

function projectJson(data: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      ...extraHeaders,
    },
  });
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

async function ensureProjectProgressSchema(database: D1Database): Promise<void> {
  await database.batch([
    database.prepare(`
      CREATE TABLE IF NOT EXISTS project_progress (
        owner_key TEXT NOT NULL,
        user_id TEXT,
        language TEXT NOT NULL,
        project_slug TEXT NOT NULL,
        milestone_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'not_started',
        write_window_started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        write_count INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (owner_key, language, project_slug)
      )
    `),
    database.prepare(
      "CREATE INDEX IF NOT EXISTS project_progress_owner_updated_idx ON project_progress (owner_key, updated_at DESC)",
    ),
  ]);
}

function normalizeSavedProgress(raw: string, milestoneIds: string[]): Record<string, ProjectProgressStatus> {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    value = null;
  }
  const candidate = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(milestoneIds.map((id) => {
    const status = String(candidate[id] || "not_started") as ProjectProgressStatus;
    return [id, VALID_STATUSES.has(status) ? status : "not_started"];
  }));
}

function deriveProjectStatus(progress: Record<string, ProjectProgressStatus>): ProjectProgressStatus {
  const statuses = Object.values(progress);
  if (statuses.length > 0 && statuses.every((status) => status === "completed")) return "completed";
  if (statuses.some((status) => status !== "not_started")) return "in_progress";
  return "not_started";
}

function withinRateWindow(value: string): boolean {
  const timestamp = Date.parse(value.endsWith("Z") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isFinite(timestamp) && Date.now() - timestamp < 60_000;
}

export async function handleProjectRequest(
  request: Request,
  env: AuthEnv,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/projects/progress") return null;

  if (request.method !== "GET" && request.method !== "PUT") {
    return projectJson({ error: "仅支持 GET 或 PUT 请求" }, 405, { Allow: "GET, PUT" });
  }

  const principal = await resolvePrincipal(request, env);
  if (!principal) return projectJson({ error: "请先登录后再同步项目进度" }, 401);

  const language = String(url.searchParams.get("language") || "");
  const projectSlug = String(url.searchParams.get("project") || "");
  const project = getProjectBlueprint(language, projectSlug);
  if (!project) return projectJson({ error: "项目标识无效" }, 404);

  await ensureProjectProgressSchema(env.DB);
  const milestoneIds = project.milestones.map((milestone) => milestone.id);
  const existing = await env.DB.prepare(`
    SELECT milestone_json, status, write_window_started_at, write_count, updated_at
    FROM project_progress
    WHERE owner_key = ? AND language = ? AND project_slug = ?
  `).bind(principal.userKey, language, projectSlug).first<ProjectProgressRecord>();

  if (request.method === "GET") {
    const milestones = existing
      ? normalizeSavedProgress(existing.milestone_json, milestoneIds)
      : emptyMilestoneProgress(project);
    return projectJson({
      progress: {
        status: deriveProjectStatus(milestones),
        milestones,
        updatedAt: existing?.updated_at || null,
      },
    });
  }

  if (!sameOrigin(request)) return projectJson({ error: "请求来源无效" }, 403);
  const contentLength = Number(request.headers.get("Content-Length") || "0");
  if (!Number.isFinite(contentLength) || contentLength > MAX_REQUEST_BYTES) {
    return projectJson({ error: "请求内容过大" }, 413);
  }
  if (existing && withinRateWindow(existing.write_window_started_at) && existing.write_count >= MAX_WRITES_PER_MINUTE) {
    return projectJson({ error: "更新过于频繁，请稍后再试" }, 429, { "Retry-After": "60" });
  }

  let body: { milestoneId?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return projectJson({ error: "请求格式无效" }, 400);
  }
  const milestoneId = String(body.milestoneId || "");
  const status = String(body.status || "") as ProjectProgressStatus;
  if (!milestoneIds.includes(milestoneId) || !VALID_STATUSES.has(status)) {
    return projectJson({ error: "里程碑进度无效" }, 400);
  }

  const milestones = existing
    ? normalizeSavedProgress(existing.milestone_json, milestoneIds)
    : emptyMilestoneProgress(project);
  milestones[milestoneId] = status;
  const projectStatus = deriveProjectStatus(milestones);
  const resetWindow = !existing || !withinRateWindow(existing.write_window_started_at);

  await env.DB.prepare(`
    INSERT INTO project_progress (
      owner_key, user_id, language, project_slug, milestone_json, status,
      write_window_started_at, write_count, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(owner_key, language, project_slug) DO UPDATE SET
      user_id = excluded.user_id,
      milestone_json = excluded.milestone_json,
      status = excluded.status,
      write_window_started_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE write_window_started_at END,
      write_count = CASE WHEN ? THEN 1 ELSE write_count + 1 END,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    principal.userKey,
    principal.userId,
    language,
    projectSlug,
    JSON.stringify(milestones),
    projectStatus,
    resetWindow ? 1 : 0,
    resetWindow ? 1 : 0,
  ).run();

  return projectJson({ saved: true, progress: { status: projectStatus, milestones } });
}
