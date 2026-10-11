"use client";

import { useEffect, useId, useRef, useState } from "react";

type Notification = {
  id: string;
  postId: string;
  replyId: string | null;
  kind: "post_reply" | "reply_reply" | "mention" | "resolved";
  message: string;
  content: string;
  read: boolean;
  targetDeleted: boolean;
  createdAt: string;
  actor: { name: string; avatarType: string; avatarValue: string | null; avatarUrl: string | null };
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
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`;
  if (minutes < 2880) return "昨天";
  return date.toLocaleDateString("zh-CN");
}

function Avatar({ actor }: { actor: Notification["actor"] }) {
  const [failed, setFailed] = useState(false);
  return <span className="forum-notification-avatar" aria-hidden="true"
    style={{ background: actor.avatarType === "preset" ? actor.avatarValue || undefined : undefined }}>
    {actor.avatarUrl && !failed ? <img src={actor.avatarUrl} alt="" onError={() => setFailed(true)} /> : Array.from(actor.name)[0] || "用"}
  </span>;
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
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      void fetch("/api/notifications/unread-count", { credentials: "same-origin", cache: "no-store" })
        .then(read<{ count: number }>).then(data => { if (active) setUnread(data.count); }).catch(() => {});
    };
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh); window.removeEventListener("focus", refresh); };
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
      const page = await read<Page>(await fetch(`/api/notifications?${params}`, {
        credentials: "same-origin",
        cache: "no-store",
      }));
      if (!mounted.current) return;
      setRows((current) => next ? merge(current, page.notifications) : page.notifications);
      setCursor(page.nextCursor);
      setUnread(page.unreadCount);
      setLoaded(true);
    } catch (reason) {
      if (mounted.current) setError(reason instanceof Error ? reason.message : "通知暂时无法读取");
    } finally {
      loadingRef.current = false;
      if (mounted.current) setLoading(false);
    }
  }

  async function markRead(item: Notification): Promise<boolean> {
    if (item.read) return true;
    try {
      const data = await read<{ count: number }>(await fetch(`/api/notifications/${encodeURIComponent(item.id)}/read`, {
        method: "POST",
        credentials: "same-origin",
      }));
      setRows((current) => current.map((row) => row.id === item.id ? { ...row, read: true } : row));
      setUnread(data.count);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "通知暂时无法更新");
      return false;
    }
  }

  async function openNotification(item: Notification) {
    if (!await markRead(item)) return;
    if (item.targetDeleted) {
      setError("对应讨论或回复已删除，通知记录仍保留");
      return;
    }
    const params = new URLSearchParams({ post: item.postId });
    if (item.replyId) params.set("reply", item.replyId);
    window.location.assign(`/forum?${params}`);
  }

  async function markAllRead() {
    if (!unread) return;
    setError("");
    try {
      await read(await fetch("/api/notifications/read-all", {
        method: "POST",
        credentials: "same-origin",
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
        if (next) void load();
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
          <button type="button" className="forum-notification-item" onClick={() => void openNotification(item)}>
            <Avatar actor={item.actor} />
            <span className="forum-notification-copy"><b>{item.message}</b>
              {item.content && <span className="forum-notification-excerpt">“{item.content}”</span>}
              <time dateTime={item.createdAt.replace(" ", "T") + "Z"}>{formattedTime(item.createdAt)}</time>
            </span>
            {!item.read && <span className="forum-notification-unread" aria-label="未读" />}
          </button>
        </li>)}
      </ol> : null}
      {cursor && !loading ? <button type="button" className="forum-notification-more" onClick={() => void load(cursor)}>查看更多</button> : null}
      {error ? <p className="forum-error" role="status">{error}</p> : null}
    </section> : null}
  </div>;
}
