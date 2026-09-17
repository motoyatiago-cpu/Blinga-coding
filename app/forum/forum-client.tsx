"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForumReplies from "./forum-replies";

type ForumPost = {
  id: string;
  category: "help" | "share";
  resolved: boolean;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string;
    avatarType: string;
    avatarValue: string | null;
    avatarUrl: string | null;
  };
  mine: boolean;
  replyCount: number;
};

type ForumPayload = {
  posts: ForumPost[];
  nextCursor: string | null;
  stats: {
    posts: number;
    contributors: number;
    mine: { posts: number; firstPostAt: string | null; lastPostAt: string | null } | null;
  };
  viewer: { authenticated: boolean; name: string | null };
};

const MAX_LENGTH = 1_000;

async function readJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("Content-Type") || "";
  if (!contentType.includes("application/json")) throw new Error("论坛暂时无法连接");
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "论坛暂时无法连接");
  return data;
}

function initial(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() || "B";
}

function relativeTime(value: string): string {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "";
  const seconds = Math.round((time - Date.now()) / 1_000);
  const formatter = new Intl.RelativeTimeFormat("zh-CN", { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return formatter.format(days, "day");
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "short", day: "numeric" }).format(time);
}

function ForumAvatar({ post }: { post: ForumPost }) {
  const [imageFailed, setImageFailed] = useState(false);
  const background = post.author.avatarType === "preset" && post.author.avatarValue
    ? post.author.avatarValue
    : "#5965d8";
  return (
    <div className="forum-avatar" style={{ background }} aria-hidden="true">
      {post.author.avatarUrl && !imageFailed
        ? <img src={post.author.avatarUrl} alt="" onError={() => setImageFailed(true)} />
        : initial(post.author.name)}
    </div>
  );
}

export default function ForumClient() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [viewer, setViewer] = useState<ForumPayload["viewer"]>({ authenticated: false, name: null });
  const [stats, setStats] = useState<ForumPayload["stats"]>({ posts: 0, contributors: 0, mine: null });
  const [cursor, setCursor] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"help" | "share">("help");
  const [view, setView] = useState("latest");
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const visiblePosts = posts.filter(post => view === "latest" || (view === "resolved" ? post.resolved : post.category === view));
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(crypto.randomUUID());

  const load = useCallback(async (nextCursor?: string) => {
    const params = new URLSearchParams({ limit: "20" });
    if (nextCursor) params.set("cursor", nextCursor);
    const response = await fetch(`/api/forum/posts?${params}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const data = await readJson<ForumPayload>(response);
    setPosts((current) => nextCursor ? [...current, ...data.posts] : data.posts);
    setCursor(data.nextCursor);
    setStats(data.stats);
    setViewer(data.viewer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/forum/posts?limit=20", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    }).then(readJson<ForumPayload>).then((data) => {
      setPosts(data.posts);
      setCursor(data.nextCursor);
      setStats(data.stats);
      setViewer(data.viewer);
    }).catch((reason) => {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError(reason instanceof Error ? reason.message : "论坛暂时无法连接");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, []);

  const canPublish = viewer.authenticated && content.trim().length > 0 && !publishing;
  const countText = useMemo(
    () => `${stats.posts} 条留言 · ${stats.contributors} 位参与者`,
    [stats.contributors, stats.posts],
  );

  async function publish() {
    if (!canPublish) return;
    setPublishing(true);
    setError("");
    const wasFirstPost = !stats.mine?.posts;
    try {
      const response = await fetch("/api/forum/posts", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ content, category, requestId: requestIdRef.current }),
      });
      const data = await readJson<{ post: ForumPost }>(response);
      setPosts((current) => [data.post, ...current]);
      setContent("");
      setView("latest");
      requestIdRef.current = crypto.randomUUID();
      setStats((current) => ({
        posts: current.posts + 1,
        contributors: current.contributors + (wasFirstPost ? 1 : 0),
        mine: {
          posts: (current.mine?.posts || 0) + 1,
          firstPostAt: current.mine?.firstPostAt || data.post.createdAt,
          lastPostAt: data.post.createdAt,
        },
      }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "留言暂时无法发布");
    } finally {
      setPublishing(false);
    }
  }

  async function remove(post: ForumPost) {
    if (!post.mine || !window.confirm("删除这条留言吗？")) return;
    setError("");
    try {
      await readJson(await fetch(`/api/forum/posts?id=${encodeURIComponent(post.id)}`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      }));
      setPosts((current) => current.filter((item) => item.id !== post.id));
      setStats((current) => ({
        posts: Math.max(0, current.posts - 1),
        contributors: current.contributors - (current.mine?.posts === 1 ? 1 : 0),
        mine: current.mine ? { ...current.mine, posts: Math.max(0, current.mine.posts - 1) } : null,
      }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "留言暂时无法删除");
    }
  }

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      await load(cursor);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "更多留言暂时无法读取");
    } finally {
      setLoadingMore(false);
    }
  }

  async function resolvePost(post: ForumPost) {
    try {
      await readJson(await fetch(`/api/forum/posts?id=${encodeURIComponent(post.id)}`, { method: "PATCH", credentials: "same-origin" }));
      setPosts(current => current.map(item => item.id === post.id ? { ...item, resolved: true } : item));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "暂时无法更新"); }
  }
  return (
    <div className="forum-content">
      <header className="forum-heading">
        <h1>用户论坛</h1>
        {!loading && <span>{countText}</span>}
      </header>

      <nav className="forum-tabs" aria-label="讨论分类">
        {[["latest","最新讨论"],["help","编程求助"],["share","网站建议"],["resolved","已解决"]].map(([id,label]) => <button type="button" key={id} aria-pressed={view===id} className={view===id?"is-active":""} onClick={()=>setView(id)}>{label}</button>)}
      </nav>
      <div className="forum-layout"><div className="forum-primary">
      <section className="forum-composer" aria-label="发表留言">
        <div className="forum-composer-head"><h2>发布讨论</h2><select aria-label="选择分类" value={category} onChange={event=>setCategory(event.target.value as "help"|"share")}><option value="help">编程求助</option><option value="share">网站建议</option></select></div>
        {viewer.authenticated ? (
          <div className="forum-editor">
            <label htmlFor="forum-message">{viewer.name}</label>
            <textarea
              ref={composerRef}
              id="forum-message"
              value={content}
              maxLength={MAX_LENGTH}
              rows={4}
              placeholder="写下问题、代码思路或学习记录"
              onChange={(event) => setContent(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                  event.preventDefault();
                  void publish();
                }
              }}
            />
            <div className="forum-composer-actions">
              <span>{content.length} / {MAX_LENGTH}</span>
              <button type="button" disabled={!canPublish} onClick={() => void publish()}>
                {publishing ? "发布中" : "发布"}
              </button>
            </div>
          </div>
        ) : (
          <p>登录后可以留言。<a href="/login?returnTo=%2Fforum">登录</a></p>
        )}
      </section>

      {error && <p className="forum-error" role="status">{error}</p>}

      <section className="forum-feed" aria-label="论坛留言" aria-busy={loading}>
        {loading && <p className="forum-state">正在读取留言</p>}
        {!loading && !visiblePosts.length && <div className="forum-empty"><svg viewBox="0 0 64 56" aria-hidden="true"><path d="M18 5h28a13 13 0 0 1 13 13v14a13 13 0 0 1-13 13h-9l-8 8-8-8h-3A13 13 0 0 1 5 32V18A13 13 0 0 1 18 5Z"/><circle cx="20" cy="25" r="2"/><circle cx="32" cy="25" r="2"/><circle cx="44" cy="25" r="2"/></svg><h2>暂无讨论</h2><p>成为第一个发起讨论的人吧</p><button type="button" onClick={()=>{composerRef.current?.focus();composerRef.current?.scrollIntoView({block:"center",behavior:"smooth"});}}>写下第一条讨论</button></div>}
        {visiblePosts.map((post) => (
          <article className="forum-post" key={post.id}>
            <ForumAvatar post={post} />
            <div>
              <header>
                <b>{post.author.name}</b>
                <time dateTime={post.createdAt} title={new Date(post.createdAt).toLocaleString("zh-CN")}>
                  {relativeTime(post.createdAt)}
                </time>
                <span className="forum-post-category">{post.category === "share" ? "网站建议" : "编程求助"}{post.resolved ? " · 已解决" : ""}</span>
                {post.mine && !post.resolved && post.category !== "share" && <button type="button" onClick={()=>void resolvePost(post)}>标记已解决</button>}
                {post.mine && <button type="button" onClick={() => void remove(post)}>删除</button>}
              </header>
              <p>{post.content}</p>
              <ForumReplies postId={post.id} authorName={post.author.name} authenticated={viewer.authenticated} initialCount={post.replyCount || 0} />
            </div>
          </article>
        ))}
        {cursor && (
          <button className="forum-load-more" type="button" disabled={loadingMore} onClick={() => void loadMore()}>
            {loadingMore ? "读取中" : "查看更多"}
          </button>
        )}
      </section>
      </div><aside className="forum-aside"><section><h2>社区指南</h2><ol><li><b>1</b><span>友善交流，尊重每一位成员</span></li><li><b>2</b><span>提问请清晰描述问题和复现步骤</span></li><li><b>3</b><span>分享有价值的内容，帮助他人成长</span></li></ol></section><section><h2>热门标签</h2><div className="forum-tags">{["Python","C/C++","JavaScript","Java"].map(tag=><span key={tag}>{tag}</span>)}</div></section></aside></div>
    </div>
  );
}
