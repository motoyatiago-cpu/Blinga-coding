"use client";

import { useCallback, useEffect, useState } from "react";
import { CODE_IMPORT_STORAGE_KEY } from "../code-viewer-dialog";
import { buildCourseUrl } from "../course-links";
import ThemeToggle from "../theme-toggle";

type MasteryState = "not_started" | "learning" | "mastered" | "review_due";

type QueueItem = {
  id: number;
  language: string;
  topicIndex: number;
  runId: number | null;
  errorSummary: string;
  status: "pending" | "reviewed";
  retryCount: number;
  reviewedAt: string | null;
  lastRetriedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type MasteryItem = {
  language: string;
  topicIndex: number;
  state: MasteryState;
  successfulJudges: number;
  failedJudges: number;
  consecutivePasses: number;
  lastAttemptAt: string | null;
  lastPassedAt: string | null;
  reviewDueAt: string | null;
  updatedAt: string;
};

type ReviewPayload = {
  queue: QueueItem[];
  mastery: MasteryItem[];
  stats: { pending: number; mastered: number; reviewDue: number; learning: number };
  nextCursor: number | null;
};

type DetailPayload = { item: QueueItem & { sourceCode: string } };

const stateLabels: Record<MasteryState, string> = {
  not_started: "未开始",
  learning: "学习中",
  mastered: "已掌握",
  review_due: "待复习",
};

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as (T & { error?: string }) | null;
  if (!response.ok) throw new Error(payload?.error || "复习数据读取失败");
  if (!payload) throw new Error("复习服务返回了无效数据");
  return payload;
}

function formatDate(value: string | null): string {
  if (!value) return "尚未安排";
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("zh-CN", { hour12: false, month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ReviewClient() {
  const [data, setData] = useState<ReviewPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const next = await readJson<ReviewPayload>(await fetch("/api/review?limit=50", {
        credentials: "same-origin",
        signal,
      }));
      setData(next);
      setError("");
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") return;
      setError(loadError instanceof Error ? loadError.message : "复习数据读取失败");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function mutate(id: number, action: "reviewed" | "retry") {
    setBusyId(id);
    setMessage("");
    try {
      const response = await fetch(`/api/review/${id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (action === "retry") {
        const detail = await readJson<DetailPayload>(response);
        const { language, topicIndex, sourceCode } = detail.item;
        window.sessionStorage.setItem(CODE_IMPORT_STORAGE_KEY, JSON.stringify({
          language,
          topicIndex,
          code: sourceCode,
          createdAt: Date.parse(`${detail.item.updatedAt.replace(" ", "T")}Z`),
        }));
        window.location.assign(buildCourseUrl(language, topicIndex, "lab"));
        return;
      }
      await readJson<{ updated: boolean }>(response);
      setData((current) => current ? {
        ...current,
        queue: current.queue.filter((item) => item.id !== id),
        stats: { ...current.stats, pending: Math.max(0, current.stats.pending - 1) },
      } : current);
      setMessage("已从当前复习队列移除");
    } catch (mutationError) {
      setMessage(mutationError instanceof Error ? mutationError.message : "操作失败，请稍后重试");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="review-page">
      <header className="review-topbar">
        <a className="review-brand" href="/home" aria-label="返回 Blinga coding 学习中心">
          <i aria-hidden="true">&lt;/&gt;</i><span>Blinga <b>coding</b></span>
        </a>
        <nav aria-label="复习页导航">
          <a href="/profile">个人主页</a>
          <a href="/home#lab">代码实训</a>
          <ThemeToggle />
        </nav>
      </header>

      <div className="review-shell">
        <section className="review-hero" aria-labelledby="review-title">
          <div>
            <span className="review-eyebrow">REVIEW WORKSPACE</span>
            <h1 id="review-title">把错误变成下一次的把握</h1>
            <p>失败的判题会自动进入队列。重新载入当时代码、修正并通过判题，掌握度才会真正提升。</p>
          </div>
          <a className="review-secondary-link" href="/home#learn">继续学习</a>
        </section>

        {message ? <p className="review-message" role="status">{message}</p> : null}

        {loading ? (
          <section className="review-loading" aria-live="polite"><span /><p>正在整理你的复习队列…</p></section>
        ) : error ? (
          <section className="review-error" role="alert">
            <h2>暂时无法打开复习页</h2>
            <p>{error}</p>
            <div><button type="button" onClick={() => void load()}>重新加载</button><a href={`/login?returnTo=${encodeURIComponent("/review")}`}>前往登录</a></div>
          </section>
        ) : data ? (
          <>
            <section className="review-stats" aria-label="学习状态概览">
              <article><span>待处理错题</span><b>{data.stats.pending}</b><small>建议优先完成</small></article>
              <article><span>待复习知识点</span><b>{data.stats.reviewDue}</b><small>到期后自动提醒</small></article>
              <article><span>已掌握知识点</span><b>{data.stats.mastered}</b><small>通过判题后计入</small></article>
              <article><span>学习中</span><b>{data.stats.learning}</b><small>继续练习可提升</small></article>
            </section>

            <div className="review-grid">
              <section className="review-panel" aria-labelledby="wrong-answer-title">
                <header><div><span>优先行动</span><h2 id="wrong-answer-title">错题队列</h2></div><b>{data.queue.length}</b></header>
                {data.queue.length ? <ol className="review-queue">
                  {data.queue.map((item) => (
                    <li key={item.id}>
                      <div className="review-item-head">
                        <div><span>{item.language}</span><b>第 {item.topicIndex + 1} 节</b></div>
                        <time dateTime={`${item.createdAt.replace(" ", "T")}Z`}>{formatDate(item.createdAt)}</time>
                      </div>
                      <p>{item.errorSummary}</p>
                      <small>已重试 {item.retryCount} 次{item.runId ? ` · 运行记录 #${item.runId}` : ""}</small>
                      <div className="review-actions">
                        <button type="button" disabled={busyId !== null} onClick={() => void mutate(item.id, "retry")}>
                          {busyId === item.id ? "正在准备…" : "载入代码重试"}
                        </button>
                        <button className="quiet" type="button" disabled={busyId !== null} onClick={() => void mutate(item.id, "reviewed")}>标记已回顾</button>
                      </div>
                    </li>
                  ))}
                </ol> : <div className="review-empty"><b>当前没有待处理错题</b><p>提交一次自动判题后，未通过的代码会出现在这里。</p><a href="/home#lab">前往代码实训</a></div>}
              </section>

              <section className="review-panel mastery" aria-labelledby="mastery-title">
                <header><div><span>学习信号</span><h2 id="mastery-title">知识掌握度</h2></div><b>{data.mastery.length}</b></header>
                {data.mastery.length ? <ul className="mastery-list">
                  {data.mastery.map((item) => (
                    <li key={`${item.language}:${item.topicIndex}`}>
                      <div><span>{item.language} · 第 {item.topicIndex + 1} 节</span><b>{stateLabels[item.state]}</b></div>
                      <span className={`mastery-state ${item.state}`}>{stateLabels[item.state]}</span>
                      <dl>
                        <div><dt>通过</dt><dd>{item.successfulJudges}</dd></div>
                        <div><dt>失败</dt><dd>{item.failedJudges}</dd></div>
                        <div><dt>{item.state === "mastered" ? "下次复习" : "最近练习"}</dt><dd>{formatDate(item.state === "mastered" ? item.reviewDueAt : item.lastAttemptAt)}</dd></div>
                      </dl>
                    </li>
                  ))}
                </ul> : <div className="review-empty"><b>尚未产生掌握度记录</b><p>运行代码会进入“学习中”，通过自动判题后会变为“已掌握”。</p></div>}
              </section>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
