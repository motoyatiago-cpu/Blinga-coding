"use client";

import { useEffect, useId, useRef, useState } from "react";

type Reply = {
  id: string; postId: string; content: string; deleted: boolean; createdAt: string; mine: boolean;
  author: { name: string; avatarType: string; avatarValue: string | null; avatarUrl: string | null } | null;
  replyTo: { id: string; name: string | null; deleted: boolean } | null;
};
type Page = { replies: Reply[]; nextCursor: string | null; replyCount: number };
type Target = { id: string | null; name: string };
async function read<T>(response: Response): Promise<T> {
  if (!response.headers.get("Content-Type")?.includes("application/json")) throw new Error("回复暂时无法连接，请重试");
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "操作失败，请重试");
  return data;
}
function merge(current: Reply[], incoming: Reply[]) {
  return [...new Map([...current, ...incoming].map(row => [row.id, row])).values()]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}
function Avatar({ author }: { author: NonNullable<Reply["author"]> }) {
  const [failed, setFailed] = useState(false);
  return <span className="forum-reply-avatar" aria-hidden="true" style={{ background: author.avatarType === "preset" ? author.avatarValue || undefined : undefined }}>
    {author.avatarUrl && !failed ? <img src={author.avatarUrl} alt="" onError={() => setFailed(true)} /> : Array.from(author.name)[0]}
  </span>;
}

export default function ForumReplies({ postId, authorName, authenticated, initialCount }: {
  postId: string; authorName: string; authenticated: boolean; initialCount: number;
}) {
  const regionId = useId(), inputId = useId();
  const [open, setOpen] = useState(false), [loaded, setLoaded] = useState(false);
  const [rows, setRows] = useState<Reply[]>([]), [cursor, setCursor] = useState<string | null>(null);
  const [count, setCount] = useState(initialCount), [target, setTarget] = useState<Target | null>(null);
  const [content, setContent] = useState(""), [error, setError] = useState("");
  const [loading, setLoading] = useState(false), [sending, setSending] = useState(false), [deleting, setDeleting] = useState<string | null>(null);
  const input = useRef<HTMLTextAreaElement>(null), opener = useRef<HTMLButtonElement>(null);
  const loadingRef = useRef(false), sendingRef = useRef(false), deletingRef = useRef(false);
  const revision = useRef(0);
  const controller = useRef<AbortController | null>(null), alive = useRef(true);
  const attempt = useRef<{ key: string; id: string } | null>(null);
  useEffect(() => { alive.current = true; return () => { alive.current = false; controller.current?.abort(); }; }, []);
  useEffect(() => { if (target) input.current?.focus(); }, [target]);
  useEffect(() => { setCount(initialCount); }, [initialCount]);

  async function load(next?: string) {
    if (loadingRef.current) return;
    loadingRef.current = true; setLoading(true); setError("");
    controller.current = new AbortController();
    const version = revision.current;
    try {
      const params = new URLSearchParams({ postId });
      if (next) params.set("cursor", next);
      const page = await read<Page>(await fetch(`/api/forum/replies?${params}`, { credentials: "same-origin", cache: "no-store", signal: controller.current.signal }));
      if (!alive.current) return;
      if (version === revision.current) setCount(page.replyCount);
      setRows(current => version === revision.current ? merge(current, page.replies) : merge(page.replies, current)); setCursor(page.nextCursor); setLoaded(true);
    } catch (reason) {
      if (alive.current && !(reason instanceof DOMException && reason.name === "AbortError")) setError(reason instanceof Error ? reason.message : "回复读取失败");
    } finally { loadingRef.current = false; if (alive.current) setLoading(false); }
  }
  function reply(to: Target) {
    if (!authenticated) { window.location.assign("/login?returnTo=%2Fforum"); return; }
    if (sendingRef.current) return;
    setOpen(true); setTarget(to); setError("");
    if (!loaded) void load();
  }
  async function send() {
    if (!target || !content.trim() || sendingRef.current) return;
    sendingRef.current = true; setSending(true); setError("");
    const key = JSON.stringify([postId, target.id, content]);
    if (attempt.current?.key !== key) attempt.current = { key, id: crypto.randomUUID() };
    try {
      const data = await read<{ reply: Reply; replayed: boolean; replyCount: number }>(await fetch("/api/forum/replies", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, replyToId: target.id, content, requestId: attempt.current.id }),
      }));
      if (!alive.current) return;
      revision.current++; setCount(data.replyCount);
      setRows(current => merge(current, [data.reply])); setContent(""); setTarget(null); attempt.current = null;
      opener.current?.focus();
    } catch (reason) { if (alive.current) setError(reason instanceof Error ? reason.message : "回复发送失败"); }
    finally { sendingRef.current = false; if (alive.current) setSending(false); }
  }
  async function remove(row: Reply) {
    if (deletingRef.current || !window.confirm("删除这条回复吗？")) return;
    deletingRef.current = true; setDeleting(row.id); setError("");
    try {
      await read(await fetch(`/api/forum/replies?id=${encodeURIComponent(row.id)}`, { method: "DELETE", credentials: "same-origin" }));
      if (!alive.current) return;
      revision.current++;
      setRows(current => current.map(item => item.id === row.id ? { ...item, deleted: true, content: "", author: null } :
        item.replyTo?.id === row.id ? { ...item, replyTo: { ...item.replyTo, name: null, deleted: true } } : item));
      setCount(value => Math.max(0, value - 1));
      if (target?.id === row.id) setTarget(null);
      opener.current?.focus();
    } catch (reason) { if (alive.current) setError(reason instanceof Error ? reason.message : "回复删除失败"); }
    finally { deletingRef.current = false; if (alive.current) setDeleting(null); }
  }
  return <div className="forum-replies">
    <div className="forum-reply-actions">
      <button ref={opener} type="button" onClick={() => reply({ id: null, name: authorName })}>回复</button>
      <button type="button" aria-expanded={open} aria-controls={regionId} onClick={() => { setOpen(!open); if (!open && !loaded) void load(); }}>{open ? "收起回复" : "查看回复"}（{count}）</button>
    </div>
    <section id={regionId} hidden={!open} aria-label="帖子回复">
      <div className="forum-reply-list" aria-busy={loading}>
        {rows.map(row => <article className="forum-reply" key={row.id}>
          {row.deleted ? <p className="forum-reply-deleted">该回复已删除</p> : <>
            {row.author && <Avatar author={row.author} />}
            <div className="forum-reply-body"><header><b>{row.author?.name}</b><time dateTime={row.createdAt.replace(" ", "T") + "Z"}>{new Date(row.createdAt.replace(" ", "T") + "Z").toLocaleString("zh-CN")}</time></header>
              {row.replyTo && <span className="forum-reply-target">回复 {row.replyTo.deleted ? "已删除的回复" : row.replyTo.name}</span>}
              <p>{row.content}</p>
              <div className="forum-reply-actions"><button type="button" disabled={sending} onClick={() => reply({ id: row.id, name: row.author?.name || "用户" })}>回复</button>
                {row.mine && <button type="button" disabled={deleting !== null} onClick={() => void remove(row)}>{deleting === row.id ? "删除中" : "删除"}</button>}</div>
            </div></>}
        </article>)}
      </div>
      {loading && <p role="status">正在读取回复</p>}
      {loaded && !rows.length && !loading && <p className="forum-reply-empty">暂无回复</p>}
      {!loading && (!loaded || cursor) && <button type="button" className="forum-reply-more" onClick={() => void load(cursor || undefined)}>{loaded ? "查看更多回复" : "读取回复"}</button>}
      {target && <form className="forum-reply-composer" onSubmit={event => { event.preventDefault(); void send(); }}>
        <label htmlFor={inputId}>回复 {target.name}</label>
        <textarea id={inputId} ref={input} rows={3} maxLength={1000} value={content} disabled={sending} onChange={event => setContent(event.target.value)}
          onKeyDown={event => { if (!event.nativeEvent.isComposing && (event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); void send(); } }} />
        <div className="forum-reply-actions"><span>{content.length} / 1000</span><button type="button" disabled={sending} onClick={() => { setTarget(null); opener.current?.focus(); }}>取消</button><button type="submit" disabled={sending || !content.trim()}>{sending ? "发送中" : "发送"}</button></div>
      </form>}
      {error && <p className="forum-error" role="status">{error}</p>}
    </section>
  </div>;
}
