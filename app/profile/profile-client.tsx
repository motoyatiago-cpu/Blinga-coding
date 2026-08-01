"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type Provider = "microsoft" | "qq" | "wechat-open" | "wechat-oa";
type Tab = "overview" | "history" | "content" | "settings" | "security" | "data";

type SessionPayload = {
  authenticated: boolean;
  providers: Record<Provider, boolean>;
  transition?: { active: boolean; displayName: string } | null;
  user?: { displayName: string; email: string | null };
};

type ProfilePayload = {
  user: {
    displayName: string;
    email: string | null;
    avatarType: string;
    avatarValue: string | null;
    avatarUrl: string | null;
  };
  preferences: {
    defaultLanguage: string;
    editorFontSize: number;
    reduceMotion: boolean;
    aiDetail: string;
  };
  links: Array<{ provider: Provider; name: string | null; email: string | null; lastUsedAt: string }>;
  sessions: Array<{
    id: string;
    current: boolean;
    device: string;
    ipHint: string | null;
    lastSeenAt: string;
  }>;
  drafts: Array<{ language: string; topicIndex: number; preview: string; updatedAt: string }>;
  notes: Array<{ language: string; topicIndex: number; preview: string; updatedAt: string }>;
};

type OverviewPayload = {
  stats: { completed: number; runs: number; drafts: number; notes: number };
  continueLearning: { language: string; topicIndex: number; updatedAt: string } | null;
};

type HistoryPayload = {
  runs: Array<{
    id: number;
    language: string;
    topicIndex: number;
    mode: string;
    statusId: number;
    statusDescription: string;
    durationMs: number | null;
    passedTests: number | null;
    totalTests: number | null;
    createdAt: string;
  }>;
  activities: Array<{
    id: number;
    language: string;
    topicIndex: number;
    action: string;
    createdAt: string;
  }>;
};

const tabs: Array<{ id: Tab; label: string; symbol: string }> = [
  { id: "overview", label: "概览", symbol: "⌂" },
  { id: "history", label: "历史", symbol: "↺" },
  { id: "content", label: "我的内容", symbol: "◇" },
  { id: "settings", label: "偏好设置", symbol: "⌘" },
  { id: "security", label: "密码与安全", symbol: "◎" },
  { id: "data", label: "数据管理", symbol: "⇩" },
];

const providerLabels: Record<Provider, string> = {
  microsoft: "Microsoft",
  qq: "QQ",
  "wechat-open": "微信扫码",
  "wechat-oa": "微信内授权",
};

const avatarPresets = ["#7182ff", "#58e6ba", "#b27cff", "#ff8b76", "#f2c94c", "#4da3ff"];

function initial(name: string): string {
  return Array.from(name.trim() || "访")[0].toUpperCase();
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("zh-CN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

async function readJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("Content-Type") || "";
  const text = await response.text();
  let payload: (T & { error?: string }) | null = null;
  if (contentType.includes("application/json")) {
    try {
      payload = JSON.parse(text) as T & { error?: string };
    } catch {
      payload = null;
    }
  }
  if (!payload || !response.ok) {
    throw new Error(payload?.error || "服务暂时不可用，请稍后重试");
  }
  return payload;
}

export default function ProfileClient() {
  const [tab, setTab] = useState<Tab>("overview");
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [history, setHistory] = useState<HistoryPayload | null>(null);
  const [historyLanguage, setHistoryLanguage] = useState("");
  const [historyStatus, setHistoryStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [form, setForm] = useState({
    displayName: "",
    defaultLanguage: "Python",
    editorFontSize: 14,
    reduceMotion: false,
    aiDetail: "balanced",
  });

  const configuredProviders = useMemo(
    () => session
      ? (Object.entries(session.providers) as Array<[Provider, boolean]>).filter(([, configured]) => configured)
      : [],
    [session],
  );

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab") as Tab | null;
    if (requested && tabs.some((item) => item.id === requested)) setTab(requested);
    const authError = new URLSearchParams(window.location.search).get("authError");
    if (authError) setMessage(`登录未完成：${authError}`);
    loadSession();
  }, []);

  async function loadSession() {
    try {
      let nextSession = await readJson<SessionPayload>(
        await fetch("/api/auth/session", { credentials: "same-origin" }),
      );
      if (!nextSession.authenticated && nextSession.transition?.active) {
        await readJson(await fetch("/api/auth/transition/activate", {
          method: "POST",
          credentials: "same-origin",
        }));
        nextSession = await readJson<SessionPayload>(
          await fetch("/api/auth/session", { credentials: "same-origin" }),
        );
      }
      setSession(nextSession);
      if (nextSession.authenticated) await loadPrivateData();
    } catch (error) {
      setSession({
        authenticated: false,
        providers: { microsoft: false, qq: false, "wechat-open": false, "wechat-oa": false },
      });
      setMessage(error instanceof Error ? error.message : "无法读取登录状态");
    }
  }

  async function loadPrivateData() {
    const [nextProfile, nextOverview, nextHistory] = await Promise.all([
      readJson<ProfilePayload>(await fetch("/api/profile", { credentials: "same-origin" })),
      readJson<OverviewPayload>(await fetch("/api/profile/overview", { credentials: "same-origin" })),
      readJson<HistoryPayload>(await fetch("/api/profile/history", { credentials: "same-origin" })),
    ]);
    setProfile(nextProfile);
    setOverview(nextOverview);
    setHistory(nextHistory);
    setForm({
      displayName: nextProfile.user.displayName,
      defaultLanguage: nextProfile.preferences.defaultLanguage,
      editorFontSize: nextProfile.preferences.editorFontSize,
      reduceMotion: nextProfile.preferences.reduceMotion,
      aiDetail: nextProfile.preferences.aiDetail,
    });
  }

  function changeTab(nextTab: Tab) {
    setTab(nextTab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", nextTab);
    window.history.replaceState({}, "", url);
  }

  async function reloadHistory() {
    const params = new URLSearchParams();
    if (historyLanguage) params.set("language", historyLanguage);
    if (historyStatus) params.set("status", historyStatus);
    setBusy(true);
    try {
      const next = await readJson<HistoryPayload>(
        await fetch(`/api/profile/history?${params}`, { credentials: "same-origin" }),
      );
      setHistory(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "历史记录读取失败");
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await readJson(await fetch("/api/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          preferences: {
            defaultLanguage: form.defaultLanguage,
            editorFontSize: form.editorFontSize,
            reduceMotion: form.reduceMotion,
            aiDetail: form.aiDetail,
          },
        }),
      }));
      await loadPrivateData();
      setMessage("个人设置已保存");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function setAvatarPreset(color: string) {
    setBusy(true);
    try {
      await readJson(await fetch("/api/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarPreset: color }),
      }));
      await loadPrivateData();
      setMessage("头像配色已更新");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "头像更新失败");
    } finally {
      setBusy(false);
    }
  }

  async function uploadAvatar(file: File | undefined) {
    if (!file) return;
    const data = new FormData();
    data.set("avatar", file);
    setBusy(true);
    try {
      await readJson(await fetch("/api/profile/avatar", {
        method: "POST",
        credentials: "same-origin",
        body: data,
      }));
      await loadPrivateData();
      setMessage("头像已更新");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "头像上传失败");
    } finally {
      setBusy(false);
    }
  }

  async function signOut(all = false) {
    await fetch(all ? "/api/auth/logout-all" : "/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    window.location.href = "/";
  }

  async function unlink(provider: Provider) {
    setBusy(true);
    try {
      await readJson(await fetch("/api/auth/links", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      }));
      await loadPrivateData();
      setMessage("登录方式已解绑");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "无法解绑该登录方式");
    } finally {
      setBusy(false);
    }
  }

  async function clearLearningData() {
    setBusy(true);
    try {
      await readJson(await fetch("/api/profile/data", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      }));
      setDeleteConfirmation("");
      await loadPrivateData();
      setMessage("学习数据已清除，账号和登录方式仍然保留");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "数据清除失败");
    } finally {
      setBusy(false);
    }
  }

  if (!session) {
    return <main className="profile-loading"><span /><p>正在读取个人空间</p></main>;
  }

  if (!session.authenticated) {
    return (
      <main className="profile-gate">
        <div className="profile-orb one" /><div className="profile-orb two" />
        <a className="profile-brand" href="/"><i>&lt;/&gt;</i><span>Blinga <b>coding</b></span></a>
        <section className="profile-gate-card glass">
          <span className="profile-kicker">PERSONAL WORKSPACE</span>
          <h1>你的学习，归于一个账号</h1>
          <p>登录后可同步课程进度、运行历史、代码草稿、学习笔记和个人偏好。</p>
          {message && <div className="profile-message error" role="status">{message}</div>}
          {configuredProviders.length ? (
            <div className="profile-login-list">
              {configuredProviders.map(([provider]) => (
                <a key={provider} href={`/api/auth/${provider}/start?returnTo=${encodeURIComponent("/profile")}`}>
                  <i>{provider === "microsoft" ? "M" : provider === "qq" ? "Q" : "微"}</i>
                  <span>使用 {providerLabels[provider]} 登录</span><b>→</b>
                </a>
              ))}
            </div>
          ) : null}
          <a className="profile-back" href="/">← 返回学习中心</a>
        </section>
      </main>
    );
  }

  if (!profile || !overview || !history) {
    return <main className="profile-loading"><span /><p>正在整理学习记录</p></main>;
  }

  return (
    <main className="profile-page">
      <div className="profile-orb one" /><div className="profile-orb two" />
      <header className="profile-topbar glass">
        <a className="profile-brand" href="/"><i>&lt;/&gt;</i><span>Blinga <b>coding</b></span></a>
        <a href="/">返回学习中心 <span>→</span></a>
      </header>

      <div className="profile-layout">
        <aside className="profile-sidebar glass" data-lenis-prevent>
          <div className="profile-identity">
            <div
              className="profile-avatar"
              style={profile.user.avatarType === "preset" && profile.user.avatarValue ? { background: profile.user.avatarValue } : undefined}
            >
              {profile.user.avatarType === "upload" ? <img src="/api/profile/avatar" alt="当前头像" /> : initial(profile.user.displayName)}
              <span />
            </div>
            <b>{profile.user.displayName}</b>
            <small>{profile.user.email || "已通过外部账号验证"}</small>
          </div>
          <nav aria-label="个人主页导航">
            {tabs.map((item) => (
              <button className={tab === item.id ? "active" : ""} key={item.id} onClick={() => changeTab(item.id)}>
                <i>{item.symbol}</i><span>{item.label}</span><b>›</b>
              </button>
            ))}
          </nav>
          <button className="profile-signout" onClick={() => signOut(false)}>退出登录 <span>↗</span></button>
        </aside>

        <section className="profile-main">
          <header className="profile-section-head">
            <div><span>PERSONAL WORKSPACE</span><h1>{tabs.find((item) => item.id === tab)?.label}</h1></div>
            <div className="profile-mini-avatar">{initial(profile.user.displayName)}</div>
          </header>
          {message && <div className="profile-message" role="status">{message}<button onClick={() => setMessage("")}>×</button></div>}

          {tab === "overview" && <div className="profile-overview">
            <section className="profile-hero-card glass">
              <div><span>欢迎回来</span><h2>{profile.user.displayName}</h2><p>从上次停下的位置继续，学习记录会自动同步到你的账号。</p></div>
              {overview.continueLearning
                ? <a href={`/?lang=${encodeURIComponent(overview.continueLearning.language)}&topic=${overview.continueLearning.topicIndex}#learn`}>继续 {overview.continueLearning.language}<b>→</b></a>
                : <a href="/#learn">开始第一节课<b>→</b></a>}
            </section>
            <div className="profile-stats">
              {[
                ["完成课程", overview.stats.completed, "节"],
                ["代码运行", overview.stats.runs, "次"],
                ["代码草稿", overview.stats.drafts, "份"],
                ["学习笔记", overview.stats.notes, "篇"],
              ].map(([label, value, unit]) => <article className="glass" key={String(label)}><span>{label}</span><b>{value}<small>{unit}</small></b></article>)}
            </div>
            <section className="profile-panel glass">
              <header><div><span>RECENT CONTENT</span><h2>最近编辑</h2></div><button onClick={() => changeTab("content")}>查看全部</button></header>
              <div className="profile-recent-grid">
                {[...profile.drafts.slice(0, 2).map((item) => ({ ...item, type: "代码草稿" })), ...profile.notes.slice(0, 2).map((item) => ({ ...item, type: "学习笔记" }))].map((item, index) => (
                  <article key={`${item.type}-${item.language}-${item.topicIndex}-${index}`}><i>{item.type === "代码草稿" ? "{}" : "Aa"}</i><div><small>{item.type} · {item.language}</small><b>第 {item.topicIndex + 1} 节</b><p>{item.preview || "暂无内容"}</p></div><time>{formatDate(item.updatedAt)}</time></article>
                ))}
                {!profile.drafts.length && !profile.notes.length && <p className="profile-empty">完成一次练习或写下笔记后，最近内容会出现在这里。</p>}
              </div>
            </section>
          </div>}

          {tab === "history" && <section className="profile-panel glass">
            <header className="profile-history-head"><div><span>ACTIVITY</span><h2>学习与运行记录</h2></div><div>
              <select value={historyLanguage} onChange={(event) => setHistoryLanguage(event.target.value)}><option value="">全部语言</option><option>Python</option><option>C/C++</option><option>JavaScript</option><option>Java</option></select>
              <select value={historyStatus} onChange={(event) => setHistoryStatus(event.target.value)}><option value="">全部状态</option><option value="passed">成功</option><option value="failed">失败</option></select>
              <button disabled={busy} onClick={reloadHistory}>筛选</button>
            </div></header>
            <div className="profile-history-list">
              {history.runs.map((item) => <article key={item.id}><i className={item.statusId === 3 ? "success" : "failed"}>{item.statusId === 3 ? "✓" : "!"}</i><div><small>{item.language} · 第 {item.topicIndex + 1} 节</small><b>{item.mode === "judge" ? "自动判题" : "运行代码"}</b><p>{item.statusDescription}{item.passedTests !== null ? ` · ${item.passedTests}/${item.totalTests} 测试` : ""}</p></div><span>{item.durationMs === null ? "—" : `${item.durationMs}ms`}<time>{formatDate(item.createdAt)}</time></span></article>)}
              {!history.runs.length && <p className="profile-empty">当前筛选条件下没有运行记录。</p>}
            </div>
          </section>}

          {tab === "content" && <div className="profile-content-columns">
            <section className="profile-panel glass"><header><div><span>DRAFTS</span><h2>代码草稿</h2></div><b>{profile.drafts.length}</b></header><div className="profile-content-list">{profile.drafts.map((item, index) => <a href={`/?lang=${encodeURIComponent(item.language)}&topic=${item.topicIndex}#lab`} key={`${item.language}-${item.topicIndex}-${index}`}><small>{item.language} · 第 {item.topicIndex + 1} 节</small><pre>{item.preview || "// 空草稿"}</pre><time>{formatDate(item.updatedAt)}</time></a>)}{!profile.drafts.length && <p className="profile-empty">还没有云端代码草稿。</p>}</div></section>
            <section className="profile-panel glass"><header><div><span>NOTES</span><h2>学习笔记</h2></div><b>{profile.notes.length}</b></header><div className="profile-content-list notes">{profile.notes.map((item, index) => <a href={`/?lang=${encodeURIComponent(item.language)}&topic=${item.topicIndex}#notes`} key={`${item.language}-${item.topicIndex}-${index}`}><small>{item.language} · 第 {item.topicIndex + 1} 节</small><p>{item.preview || "空笔记"}</p><time>{formatDate(item.updatedAt)}</time></a>)}{!profile.notes.length && <p className="profile-empty">还没有云端学习笔记。</p>}</div></section>
          </div>}

          {tab === "settings" && <form className="profile-settings" onSubmit={saveSettings}>
            <section className="profile-panel glass" id="avatar-settings"><header><div><span>PROFILE</span><h2>头像与昵称</h2></div></header><div className="profile-avatar-settings"><div className="profile-avatar large" style={profile.user.avatarType === "preset" && profile.user.avatarValue ? { background: profile.user.avatarValue } : undefined}>{profile.user.avatarType === "upload" ? <img src="/api/profile/avatar" alt="当前头像" /> : initial(profile.user.displayName)}</div><div><label className="profile-upload"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadAvatar(event.target.files?.[0])} disabled={busy} /><span>上传新头像</span></label><small>JPEG、PNG 或 WebP，最大 2MB</small><div className="profile-preset-list">{avatarPresets.map((color) => <button type="button" aria-label={`使用 ${color} 头像配色`} style={{ background: color }} key={color} onClick={() => setAvatarPreset(color)} disabled={busy} />)}</div></div></div><label className="profile-field"><span>显示昵称</span><input value={form.displayName} maxLength={40} onChange={(event) => setForm({ ...form, displayName: event.target.value })} /></label></section>
            <section className="profile-panel glass"><header><div><span>PREFERENCES</span><h2>学习体验</h2></div></header><div className="profile-form-grid"><label className="profile-field"><span>默认编程语言</span><select value={form.defaultLanguage} onChange={(event) => setForm({ ...form, defaultLanguage: event.target.value })}><option>Python</option><option>C/C++</option><option>JavaScript</option><option>Java</option></select></label><label className="profile-field"><span>编辑器字号</span><input type="number" min={12} max={20} value={form.editorFontSize} onChange={(event) => setForm({ ...form, editorFontSize: Number(event.target.value) })} /></label><label className="profile-field"><span>AI 回答详细程度</span><select value={form.aiDetail} onChange={(event) => setForm({ ...form, aiDetail: event.target.value })}><option value="concise">简洁</option><option value="balanced">均衡</option><option value="detailed">详细</option></select></label><label className="profile-toggle"><input type="checkbox" checked={form.reduceMotion} onChange={(event) => setForm({ ...form, reduceMotion: event.target.checked })} /><span><b>减少动画</b><small>降低弹跳与页面过渡效果</small></span></label></div><button className="profile-primary" disabled={busy} type="submit">{busy ? "保存中" : "保存个人设置"}</button></section>
          </form>}

          {tab === "security" && <div className="profile-security">
            <section className="profile-panel glass"><header><div><span>CONNECTED ACCOUNTS</span><h2>登录方式</h2></div></header><div className="profile-link-list">{profile.links.map((link) => <article key={link.provider}><i>{link.provider === "microsoft" ? "M" : link.provider === "qq" ? "Q" : "微"}</i><div><b>{providerLabels[link.provider]}</b><small>{link.email || link.name || "已验证账号"}</small></div><span>已绑定</span><button disabled={busy || profile.links.length <= 1} onClick={() => unlink(link.provider)}>解绑</button></article>)}{configuredProviders.filter(([provider]) => !profile.links.some((link) => link.provider === provider)).map(([provider]) => <article key={provider}><i>{provider === "microsoft" ? "M" : provider === "qq" ? "Q" : "微"}</i><div><b>{providerLabels[provider]}</b><small>绑定后可使用该方式登录同一账号</small></div><a href={`/api/auth/${provider}/start?intent=link&returnTo=${encodeURIComponent("/profile?tab=security")}`}>绑定</a></article>)}</div></section>
            <section className="profile-panel profile-password-card glass">
              <header><div><span>PASSWORD &amp; RECOVERY</span><h2>密码与账号恢复</h2></div></header>
              <div className="profile-password-summary">
                <i>⌁</i>
                <div><b>密码由登录平台管理</b><p>Blinga coding 不保存独立密码。修改密码、找回账号和多因素认证请在对应登录平台完成。</p></div>
              </div>
              <ul className="profile-password-list">
                {profile.links.length ? profile.links.map((link) => (
                  <li key={link.provider}><b>{providerLabels[link.provider]}</b><span>请前往该平台的“账号与安全”完成密码或恢复设置</span></li>
                )) : (
                  <li><b>当前受保护账号</b><span>目前由站点访问保护；绑定微信、QQ 或 Microsoft 后由对应平台管理密码</span></li>
                )}
              </ul>
            </section>
            <section className="profile-panel glass"><header><div><span>ACTIVE SESSIONS</span><h2>活跃设备</h2></div><button onClick={() => signOut(true)}>退出全部设备</button></header><div className="profile-session-list">{profile.sessions.map((item) => <article key={item.id}><i>{item.current ? "●" : "○"}</i><div><b>{item.current ? "当前设备" : "其他设备"}</b><p>{item.device}</p><small>{item.ipHint || "未知网络"} · {formatDate(item.lastSeenAt)}</small></div></article>)}</div></section>
          </div>}

          {tab === "data" && <div className="profile-data-grid">
            <section className="profile-panel glass"><header><div><span>EXPORT</span><h2>导出学习数据</h2></div></header><p>下载课程进度、代码草稿、运行记录和学习笔记的 JSON 副本。</p><a className="profile-primary" href="/api/profile/export">下载数据副本</a></section>
            <section className="profile-panel danger glass"><header><div><span>DANGER ZONE</span><h2>清除学习数据</h2></div></header><p>该操作会删除本站进度、历史、草稿和笔记，但保留账号、头像和已绑定登录方式。</p><label className="profile-field"><span>输入“清除我的学习数据”进行确认</span><input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} /></label><button disabled={busy || deleteConfirmation !== "清除我的学习数据"} onClick={clearLearningData}>永久清除学习数据</button></section>
          </div>}
        </section>
      </div>
    </main>
  );
}
