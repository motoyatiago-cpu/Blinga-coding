"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import CodeViewerDialog, { type CodeRecordRequest } from "../code-viewer-dialog";
import { buildCourseUrl } from "../course-links";

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
    username: string | null;
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
  drafts: Array<{ language: string; topicIndex: number; preview: string; codeAvailable: boolean; updatedAt: string }>;
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
    codeAvailable: boolean;
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

type PasswordStatus = {
  enabled: boolean;
  loginIdentifier: string;
  username: string | null;
  email: string | null;
  passwordChangedAt: string | null;
};

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "概览" },
  { id: "history", label: "历史" },
  { id: "content", label: "我的内容" },
  { id: "settings", label: "偏好设置" },
  { id: "security", label: "密码与安全" },
  { id: "data", label: "数据管理" },
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
  const [passwordStatus, setPasswordStatus] = useState<PasswordStatus | null>(null);
  const [historyLanguage, setHistoryLanguage] = useState("");
  const [historyStatus, setHistoryStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    loginIdentifier: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [accountUsername, setAccountUsername] = useState("");
  const [codeViewerRequest, setCodeViewerRequest] = useState<CodeRecordRequest | null>(null);
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
    const [nextProfile, nextOverview, nextHistory, nextPasswordStatus] = await Promise.all([
      readJson<ProfilePayload>(await fetch("/api/profile", { credentials: "same-origin" })),
      readJson<OverviewPayload>(await fetch("/api/profile/overview", { credentials: "same-origin" })),
      readJson<HistoryPayload>(await fetch("/api/profile/history", { credentials: "same-origin" })),
      readJson<PasswordStatus>(await fetch("/api/auth/password", { credentials: "same-origin" })),
    ]);
    setProfile(nextProfile);
    setOverview(nextOverview);
    setHistory(nextHistory);
    setPasswordStatus(nextPasswordStatus);
    setAccountUsername(nextProfile.user.username || "");
    setPasswordForm((current) => ({
      ...current,
      loginIdentifier: nextPasswordStatus.loginIdentifier || nextProfile.user.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
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

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage("两次输入的新密码不一致");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const nextStatus = await readJson<PasswordStatus>(await fetch("/api/auth/password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      }));
      setPasswordStatus(nextStatus);
      setPasswordForm({
        loginIdentifier: nextStatus.loginIdentifier,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage(passwordStatus?.enabled ? "密码已更新，其他设备已退出" : "独立登录密码已启用");
      await loadPrivateData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "密码保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function saveAccount(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await readJson(await fetch("/api/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: accountUsername }),
      }));
      await loadPrivateData();
      setMessage("登录账号已更新");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "账号保存失败");
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
          <h1>你的学习，归于一个账号</h1>
          <p>登录后可同步课程进度、运行历史、代码草稿、学习笔记和个人偏好。</p>
          {message && <div className="profile-message error" role="status">{message}</div>}
          <a className="profile-password-login" href={`/login?returnTo=${encodeURIComponent("/profile")}`}>
            <span>使用邮箱和密码登录</span><b>→</b>
          </a>
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
        <a href="/">返回学习中心</a>
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
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <button className="profile-signout" onClick={() => signOut(false)}>退出登录</button>
        </aside>

        <section className="profile-main">
          <header className="profile-section-head">
            <div><h1>{tabs.find((item) => item.id === tab)?.label}</h1></div>
          </header>
          {message && <div className="profile-message" role="status">{message}<button onClick={() => setMessage("")}>×</button></div>}

          {tab === "overview" && <div className="profile-overview">
            <section className="profile-hero-card glass">
              <div><span>欢迎回来</span><h2>{profile.user.displayName}</h2><p>从上次停下的位置继续，学习记录会自动同步到你的账号。</p></div>
              {overview.continueLearning
                ? <a href={buildCourseUrl(overview.continueLearning.language, overview.continueLearning.topicIndex)}>继续 {overview.continueLearning.language}</a>
                : <a href="/#learn">开始第一节课</a>}
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
              <header><div><h2>最近编辑</h2></div><button onClick={() => changeTab("content")}>查看全部</button></header>
              <div className="profile-recent-grid">
                {[...profile.drafts.slice(0, 2).map((item) => ({ ...item, type: "代码草稿" })), ...profile.notes.slice(0, 2).map((item) => ({ ...item, type: "学习笔记" }))].map((item, index) => {
                  const isDraft = item.type === "代码草稿";
                  return <article
                    className={isDraft ? "code-record-trigger" : undefined}
                    key={`${item.type}-${item.language}-${item.topicIndex}-${index}`}
                    role={isDraft ? "button" : undefined}
                    tabIndex={isDraft ? 0 : undefined}
                    onClick={isDraft ? () => setCodeViewerRequest({ kind: "draft", language: item.language, topicIndex: item.topicIndex }) : undefined}
                    onKeyDown={isDraft ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setCodeViewerRequest({ kind: "draft", language: item.language, topicIndex: item.topicIndex });
                      }
                    } : undefined}
                  ><div><small>{item.type} · {item.language}</small><b>第 {item.topicIndex + 1} 节</b><p>{item.preview || "暂无内容"}</p></div><time>{formatDate(item.updatedAt)}</time></article>;
                })}
                {!profile.drafts.length && !profile.notes.length && <p className="profile-empty">完成一次练习或写下笔记后，最近内容会出现在这里。</p>}
              </div>
            </section>
          </div>}

          {tab === "history" && <section className="profile-panel glass">
            <header className="profile-history-head"><div><h2>学习与运行记录</h2></div><div>
              <select value={historyLanguage} onChange={(event) => setHistoryLanguage(event.target.value)}><option value="">全部语言</option><option>Python</option><option>C/C++</option><option>JavaScript</option><option>Java</option></select>
              <select value={historyStatus} onChange={(event) => setHistoryStatus(event.target.value)}><option value="">全部状态</option><option value="passed">成功</option><option value="failed">失败</option></select>
              <button disabled={busy} onClick={reloadHistory}>筛选</button>
            </div></header>
            <div className="profile-history-list">
              {history.runs.map((item) => <article
                className="code-record-trigger"
                key={item.id}
                role="button"
                tabIndex={0}
                aria-label={`查看 ${item.language} 第 ${item.topicIndex + 1} 节运行代码`}
                onClick={() => setCodeViewerRequest({ kind: "run", id: item.id, language: item.language, topicIndex: item.topicIndex })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setCodeViewerRequest({ kind: "run", id: item.id, language: item.language, topicIndex: item.topicIndex });
                  }
                }}
              ><i className={item.statusId === 3 ? "success" : "failed"}>{item.statusId === 3 ? "✓" : "!"}</i><div><small>{item.language} · 第 {item.topicIndex + 1} 节</small><b>{item.mode === "judge" ? "自动判题" : "运行代码"}</b><p>{item.statusDescription}{item.passedTests !== null ? ` · ${item.passedTests}/${item.totalTests} 测试` : ""}</p></div><span>{item.codeAvailable ? "查看源码" : "旧记录无源码"}<time>{formatDate(item.createdAt)}</time></span></article>)}
              {!history.runs.length && <p className="profile-empty">当前筛选条件下没有运行记录。</p>}
            </div>
          </section>}

          {tab === "content" && <div className="profile-content-columns">
            <section className="profile-panel glass"><header><div><h2>代码草稿</h2></div><b>{profile.drafts.length}</b></header><div className="profile-content-list">{profile.drafts.map((item, index) => <button type="button" className="code-record-trigger" onClick={() => setCodeViewerRequest({ kind: "draft", language: item.language, topicIndex: item.topicIndex })} key={`${item.language}-${item.topicIndex}-${index}`}><small>{item.language} · 第 {item.topicIndex + 1} 节</small><pre>{item.preview || "// 空草稿"}</pre><time>{formatDate(item.updatedAt)}</time><b>查看完整代码 →</b></button>)}{!profile.drafts.length && <p className="profile-empty">还没有云端代码草稿。</p>}</div></section>
            <section className="profile-panel glass"><header><div><h2>学习笔记</h2></div><b>{profile.notes.length}</b></header><div className="profile-content-list notes">{profile.notes.map((item, index) => <a href={buildCourseUrl(item.language, item.topicIndex, "notes")} key={`${item.language}-${item.topicIndex}-${index}`}><small>{item.language} · 第 {item.topicIndex + 1} 节</small><p>{item.preview || "空笔记"}</p><time>{formatDate(item.updatedAt)}</time></a>)}{!profile.notes.length && <p className="profile-empty">还没有云端学习笔记。</p>}</div></section>
          </div>}

          {tab === "settings" && <form className="profile-settings" onSubmit={saveSettings}>
            <section className="profile-panel glass" id="avatar-settings"><header><div><h2>头像与昵称</h2></div></header><div className="profile-avatar-settings"><div className="profile-avatar large" style={profile.user.avatarType === "preset" && profile.user.avatarValue ? { background: profile.user.avatarValue } : undefined}>{profile.user.avatarType === "upload" ? <img src="/api/profile/avatar" alt="当前头像" /> : initial(profile.user.displayName)}</div><div><label className="profile-upload"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadAvatar(event.target.files?.[0])} disabled={busy} /><span>上传新头像</span></label><small>JPEG、PNG 或 WebP，最大 2MB</small><div className="profile-preset-list">{avatarPresets.map((color) => <button type="button" aria-label={`使用 ${color} 头像配色`} style={{ background: color }} key={color} onClick={() => setAvatarPreset(color)} disabled={busy} />)}</div></div></div><label className="profile-field"><span>显示昵称</span><input value={form.displayName} maxLength={40} onChange={(event) => setForm({ ...form, displayName: event.target.value })} /></label></section>
            <section className="profile-panel glass"><header><div><h2>学习体验</h2></div></header><div className="profile-form-grid"><label className="profile-field"><span>默认编程语言</span><select value={form.defaultLanguage} onChange={(event) => setForm({ ...form, defaultLanguage: event.target.value })}><option>Python</option><option>C/C++</option><option>JavaScript</option><option>Java</option></select></label><label className="profile-field"><span>编辑器字号</span><input type="number" min={12} max={20} value={form.editorFontSize} onChange={(event) => setForm({ ...form, editorFontSize: Number(event.target.value) })} /></label><label className="profile-field"><span>AI 回答详细程度</span><select value={form.aiDetail} onChange={(event) => setForm({ ...form, aiDetail: event.target.value })}><option value="concise">简洁</option><option value="balanced">均衡</option><option value="detailed">详细</option></select></label><label className="profile-toggle"><input type="checkbox" checked={form.reduceMotion} onChange={(event) => setForm({ ...form, reduceMotion: event.target.checked })} /><span><b>减少动画</b><small>降低弹跳与页面过渡效果</small></span></label></div><button className="profile-primary" disabled={busy} type="submit">{busy ? "保存中" : "保存个人设置"}</button></section>
          </form>}

          {tab === "security" && <div className="profile-security">
            <section className="profile-panel glass"><header><div><h2>登录账号</h2></div></header><form className="profile-account-form" onSubmit={saveAccount}><label className="profile-field"><span>账号</span><input autoCapitalize="none" spellCheck={false} autoComplete="username" minLength={4} maxLength={20} pattern="[A-Za-z0-9_]{4,20}" placeholder="4–20 位字母、数字或下划线" value={accountUsername} onChange={(event) => setAccountUsername(event.target.value)} /></label><label className="profile-field"><span>邮箱</span><input type="email" value={profile.user.email || "尚未绑定邮箱"} readOnly aria-readonly="true" /></label><p>账号和邮箱都可用于登录。邮箱与第三方身份绑定，为避免账号丢失，暂不在此直接修改。</p><button className="profile-primary" type="submit" disabled={busy || !accountUsername}>{busy ? "保存中" : "保存账号"}</button></form></section>
            <section className="profile-panel glass"><header><div><h2>登录方式</h2></div></header><div className="profile-link-list">{profile.links.map((link) => <article key={link.provider}><i>{link.provider === "microsoft" ? "M" : link.provider === "qq" ? "Q" : "微"}</i><div><b>{providerLabels[link.provider]}</b><small>{link.email || link.name || "已验证账号"}</small></div><span>已绑定</span><button disabled={busy || (profile.links.length <= 1 && !passwordStatus?.enabled)} onClick={() => unlink(link.provider)}>解绑</button></article>)}{configuredProviders.filter(([provider]) => !profile.links.some((link) => link.provider === provider)).map(([provider]) => <article key={provider}><i>{provider === "microsoft" ? "M" : provider === "qq" ? "Q" : "微"}</i><div><b>{providerLabels[provider]}</b><small>绑定后可使用该方式登录同一账号</small></div><a href={`/api/auth/${provider}/start?intent=link&returnTo=${encodeURIComponent("/profile?tab=security")}`}>绑定</a></article>)}</div></section>
            <section className="profile-panel profile-password-card glass">
              <header><div><h2>独立密码</h2></div><b>{passwordStatus?.enabled ? "已启用" : "未设置"}</b></header>
              <form className="profile-password-form" onSubmit={savePassword}>
                <p>{passwordStatus?.enabled ? "修改后，除当前设备外的登录会话将自动退出。" : "设置后，可使用账号或邮箱与密码登录 Blinga coding。"}</p>
                <label className="profile-field"><span>登录标识</span><input type="text" autoComplete="username" value={passwordForm.loginIdentifier} disabled={Boolean(passwordStatus?.enabled)} onChange={(event) => setPasswordForm({ ...passwordForm, loginIdentifier: event.target.value })} /></label>
                {passwordStatus?.enabled && <label className="profile-field"><span>当前密码</span><input type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} /></label>}
                <label className="profile-field"><span>{passwordStatus?.enabled ? "新密码" : "设置密码"}</span><input type="password" minLength={10} maxLength={128} autoComplete="new-password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} /></label>
                <label className="profile-field"><span>确认新密码</span><input type="password" minLength={10} maxLength={128} autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} /></label>
                <small>至少 10 个字符，同时包含字母和数字。</small>
                <button className="profile-primary" disabled={busy || !passwordForm.newPassword || !passwordForm.confirmPassword || (Boolean(passwordStatus?.enabled) && !passwordForm.currentPassword)} type="submit">{busy ? "保存中" : passwordStatus?.enabled ? "更新密码" : "启用密码登录"}</button>
              </form>
            </section>
            <section className="profile-panel glass"><header><div><h2>活跃设备</h2></div><button onClick={() => signOut(true)}>退出全部设备</button></header><div className="profile-session-list">{profile.sessions.map((item) => <article key={item.id}><div><b>{item.current ? "当前设备" : "其他设备"}</b><p>{item.device}</p><small>{item.ipHint || "未知网络"} · {formatDate(item.lastSeenAt)}</small></div></article>)}</div></section>
          </div>}

          {tab === "data" && <div className="profile-data-grid">
            <section className="profile-panel glass"><header><div><h2>导出学习数据</h2></div></header><p>下载课程进度、代码草稿、运行记录和学习笔记的 JSON 副本。</p><a className="profile-primary" href="/api/profile/export">下载数据副本</a></section>
            <section className="profile-panel danger glass"><header><div><h2>清除学习数据</h2></div></header><p>该操作会删除本站进度、历史、草稿和笔记，但保留账号、头像和已绑定登录方式。</p><label className="profile-field"><span>输入“清除我的学习数据”进行确认</span><input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} /></label><button disabled={busy || deleteConfirmation !== "清除我的学习数据"} onClick={clearLearningData}>永久清除学习数据</button></section>
          </div>}
        </section>
        <CodeViewerDialog request={codeViewerRequest} onClose={() => setCodeViewerRequest(null)} />
      </div>
    </main>
  );
}
