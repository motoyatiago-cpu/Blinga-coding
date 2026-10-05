"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ProjectBlueprint, ProjectProgressStatus } from "../../data/project-blueprints";
import { emptyMilestoneProgress } from "../../data/project-blueprints";
import { buildCourseUrl } from "../course-links";

type AuthState = "loading" | "guest" | "authenticated";
type RunState = { kind: "idle" | "running" | "passed" | "failed" | "error"; output: string };

const STATUS_LABEL: Record<ProjectProgressStatus, string> = {
  not_started: "未开始",
  in_progress: "进行中",
  completed: "已完成",
};

function nextStatus(status: ProjectProgressStatus): ProjectProgressStatus {
  if (status === "not_started") return "in_progress";
  if (status === "in_progress") return "completed";
  return "in_progress";
}

function normalizeOutput(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").trim();
}

export default function ProjectWorkflow({ project }: { project: ProjectBlueprint }) {
  const [auth, setAuth] = useState<AuthState>("loading");
  const [milestones, setMilestones] = useState<Record<string, ProjectProgressStatus>>(() => emptyMilestoneProgress(project));
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("正在确认登录状态…");
  const [code, setCode] = useState(project.starterCode);
  const [run, setRun] = useState<RunState>({ kind: "idle", output: "运行结果会显示在这里。" });

  useEffect(() => {
    const controller = new AbortController();
    async function loadProgress() {
      try {
        const sessionResponse = await fetch("/api/auth/session", { signal: controller.signal, cache: "no-store" });
        const session = await sessionResponse.json() as { authenticated?: boolean };
        if (!session.authenticated) {
          setAuth("guest");
          setMessage("游客可以查看项目和运行代码；登录后才能保存里程碑。");
          return;
        }
        setAuth("authenticated");
        const response = await fetch(`/api/projects/progress?language=${encodeURIComponent(project.language)}&project=${encodeURIComponent(project.slug)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("progress");
        const result = await response.json() as { progress?: { milestones?: Record<string, ProjectProgressStatus> } };
        if (result.progress?.milestones) setMilestones(result.progress.milestones);
        setMessage("项目进度已同步。");
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setMessage("暂时无法同步进度，你仍可继续浏览和运行代码。");
      }
    }
    void loadProgress();
    return () => controller.abort();
  }, [project.language, project.slug]);

  const completedCount = useMemo(
    () => Object.values(milestones).filter((status) => status === "completed").length,
    [milestones],
  );
  const completionPercent = Math.round((completedCount / project.milestones.length) * 100);

  async function updateMilestone(milestoneId: string) {
    if (auth !== "authenticated" || savingId) return;
    const status = nextStatus(milestones[milestoneId] || "not_started");
    setSavingId(milestoneId);
    setMessage("正在保存里程碑…");
    try {
      const response = await fetch(`/api/projects/progress?language=${encodeURIComponent(project.language)}&project=${encodeURIComponent(project.slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId, status }),
      });
      const result = await response.json() as { error?: string; progress?: { milestones?: Record<string, ProjectProgressStatus> } };
      if (!response.ok || !result.progress?.milestones) throw new Error(result.error || "保存失败");
      setMilestones(result.progress.milestones);
      setMessage(`已更新为“${STATUS_LABEL[status]}”。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "进度保存失败，请稍后再试。");
    } finally {
      setSavingId(null);
    }
  }

  async function runCode() {
    if (!project.runnable || run.kind === "running") return;
    setRun({ kind: "running", output: "正在安全沙箱中运行…" });
    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: project.runnerLanguage, code, stdin: project.stdin || "" }),
      });
      const result = await response.json() as { error?: string; stdout?: string; stderr?: string; compileOutput?: string };
      if (!response.ok) throw new Error(result.error || "运行失败");
      const output = [result.stdout, result.stderr, result.compileOutput].filter(Boolean).join("\n").trim() || "程序没有输出。";
      const passed = Boolean(project.expectedOutput) && normalizeOutput(result.stdout || "") === normalizeOutput(project.expectedOutput || "");
      setRun({ kind: passed ? "passed" : "failed", output });
    } catch (error) {
      setRun({ kind: "error", output: error instanceof Error ? error.message : "运行失败，请稍后再试。" });
    }
  }

  return <div className="project-workflow">
    <section className="project-milestone-panel" aria-labelledby="milestone-title">
      <header>
        <div><p>PROJECT PLAN</p><h2 id="milestone-title">项目里程碑</h2></div>
        <span>{completedCount} / {project.milestones.length} 完成</span>
      </header>
      <progress max={project.milestones.length} value={completedCount} aria-label={`已完成 ${completionPercent}%`} />
      <p className="project-sync-message" aria-live="polite">{message}
        {auth === "guest" ? <Link href={`/login?returnTo=${encodeURIComponent(`/projects/${project.language}/${project.slug}`)}`}>前往登录</Link> : null}
      </p>
      <ol className="project-milestones">
        {project.milestones.map((milestone, index) => {
          const status = milestones[milestone.id] || "not_started";
          return <li key={milestone.id} data-status={status}>
            <span className="project-step-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div><div className="project-milestone-heading"><h3>{milestone.title}</h3><span>{STATUS_LABEL[status]}</span></div>
              <p>{milestone.description}</p><b>交付物：{milestone.deliverable}</b>
              <Link href={buildCourseUrl(project.languageName, milestone.topicIndex)}>复习对应课程：第 {milestone.topicIndex + 1} 节</Link>
            </div>
            <button type="button" disabled={auth !== "authenticated" || savingId !== null} onClick={() => void updateMilestone(milestone.id)} aria-label={`${milestone.title}，当前${STATUS_LABEL[status]}，切换为${STATUS_LABEL[nextStatus(status)]}`}>
              {savingId === milestone.id ? "保存中…" : status === "completed" ? "重新进行" : status === "in_progress" ? "标记完成" : "开始这一步"}
            </button>
          </li>;
        })}
      </ol>
    </section>

    <aside className="project-brief" aria-labelledby="brief-title">
      <h2 id="brief-title">验收标准</h2>
      <ul>{project.successCriteria.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul>
      <h3>本项目会用到</h3><div>{project.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
    </aside>

    <section className="project-code-lab" aria-labelledby="code-lab-title">
      <header><div><p>ONLINE LAB</p><h2 id="code-lab-title">{project.runnable ? "完成代码并运行" : "项目路线预告"}</h2></div>
        {project.runnable ? <button type="button" onClick={() => { setCode(project.starterCode); setRun({ kind: "idle", output: "已恢复起始代码。" }); }}>恢复起始代码</button> : null}
      </header>
      {project.runnable ? <div className="project-code-grid">
        <div><label htmlFor="project-code">{project.runnerLanguage} 代码</label><textarea id="project-code" value={code} onChange={(event) => setCode(event.target.value)} maxLength={12_000} spellCheck={false} /></div>
        <div className="project-output"><span>运行输出</span><pre aria-live="polite" aria-busy={run.kind === "running"} data-result={run.kind}>{run.output}</pre>
          {run.kind === "passed" ? <p>输出符合验收样例，可以继续核对其余标准。</p> : null}
          {run.kind === "failed" ? <p>程序已运行，但输出尚未匹配验收样例。</p> : null}
        </div>
        <button className="project-run-button" type="button" onClick={() => void runCode()} disabled={run.kind === "running" || !code.trim()}>{run.kind === "running" ? "运行中…" : "运行代码"}</button>
      </div> : <div className="project-coming-soon"><p>这个进阶蓝图已经给出完整里程碑和验收标准。完成相关课程后，再进入在线编码阶段。</p><Link href={`/courses/${project.language}`}>继续学习 {project.languageName} 课程 →</Link></div>}
    </section>
  </div>;
}
