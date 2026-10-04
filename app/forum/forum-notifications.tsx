"use client";

import { useEffect, useId, useRef, useState } from "react";

type Notification = {
  id: string;
  postId: string;
  replyId: string | null;
  kind: "post_reply" | "reply_reply" | "mention" | "resolved";
  message: string;
  read: boolean;
  createdAt: string;
  actor: { name: string };
};
type Page = { notifications: Notification[]; nextCursor: string | null; unreadCount: number };

async function read<T>(response: Response): Promise<T> {
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "通知暂时无法读取");
  return data;
}

function merge(current: Notification[], incoming: Notification[]): Notification[] {
  return [...new Map([...current, ...incoming].map((item) => [item.id, item])).values()];
}

function formattedTime(value: string): string {
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("zh-CN");
}

export default function ForumNotifications({ authenticated }: { authenticated: boolean }) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [rows, setRows] = useState<Notification[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!authenticated) return;
    const controller = new AbortController();
    void fetch("/api/forum/notifications/count", {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    }).then(read<{ unreadCount: number }>).then((data) => setUnread(data.unreadCount)).catch(() => {});
    return () => controller.abort();
  }, [authenticated]);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  if (!authenticated) return null;

  async function load(next?: string) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "12" });
      if (next) params.set("cursor", next);
      const page = await read<Page>(await fetch(`/api/forum/notifications?${params}`, {
        credentials: "same-origin",
        cache: "no-store",
      }));
      setRows((current) => next ? merge(current, page.notifications) : page.notifications);
      setCursor(page.nextCursor);
      setUnread(page.unreadCount);
      setLoaded(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "通知暂时无法读取");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  async function markRead(item: Notification) {
    if (item.read) return;
    try {
      const data = await read<{ unreadCount: number }>(await fetch("/api/forum/notifications/read", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      }));
      setRows((current) => current.map((row) => row.id === item.id ? { ...row, read: true } : row));
      setUnread(data.unreadCount);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "通知暂时无法更新");
    }
  }

  async function markAllRead() {
    if (!unread) return;
    setError("");
    try {
      await read(await fetch("/api/forum/notifications/read", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      }));
      setRows((current) => current.map((row) => ({ ...row, read: true })));
      setUnread(0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "通知暂时无法更新");
    }
  }

  return <div className="forum-notifications">
    <button
      ref={trigger}
      type="button"
      className="forum-notification-trigger"
      aria-expanded={open}
      aria-controls={panelId}
      aria-label={unread ? `通知，${unread} 条未读` : "通知"}
      onClick={() => {
        const next = !open;
        setOpen(next);
        if (next && !loaded) void load();
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
      <span>通知</span>
      {unread > 0 ? <span className="forum-notification-badge" aria-hidden="true">{unread > 99 ? "99+" : unread}</span> : null}
      <span className="forum-sr-only" role="status" aria-atomic="true">{unread ? `${unread} 条通知未读` : "没有未读通知"}</span>
    </button>
    {open ? <section id={panelId} className="forum-notification-panel" aria-label="论坛通知">
      <header><h2>通知</h2><button type="button" disabled={!unread} onClick={() => void markAllRead()}>全部已读</button></header>
      {loading && !loaded ? <p className="forum-notification-state" role="status">正在读取通知</p> : null}
      {!loading && loaded && !rows.length ? <p className="forum-notification-state">暂时没有通知</p> : null}
      {rows.length ? <ol className="forum-notification-list">
        {rows.map((item) => <li key={item.id} className={item.read ? "" : "is-unread"}>
          <a href={`/forum#forum-post-${encodeURIComponent(item.postId)}`} onClick={() => { setOpen(false); void markRead(item); }}>
            <span className="forum-notification-avatar" aria-hidden="true">{Array.from(item.actor.name)[0]}</span>
            <span><b>{item.message}</b><time dateTime={item.createdAt.replace(" ", "T") + "Z"}>{formattedTime(item.createdAt)}</time></span>
          </a>
        </li>)}
      </ol> : null}
      {cursor && !loading ? <button type="button" className="forum-notification-more" onClick={() => void load(cursor)}>查看更多</button> : null}
      {error ? <p className="forum-error" role="status">{error}</p> : null}
    </section> : null}
  </div>;
}
