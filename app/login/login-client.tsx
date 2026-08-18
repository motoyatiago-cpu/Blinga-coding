"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type Provider = "microsoft" | "qq" | "wechat-open" | "wechat-oa";

type SessionPayload = {
  authenticated: boolean;
  providers: Record<Provider, boolean>;
};

const providerLabels: Record<Provider, string> = {
  microsoft: "Microsoft",
  qq: "QQ",
  "wechat-open": "微信扫码",
  "wechat-oa": "微信授权",
};

async function readJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("Content-Type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null) as (T & { error?: string }) | null
    : null;
  if (!response.ok || !payload) throw new Error(payload?.error || "登录服务暂时不可用");
  return payload;
}

function safeReturnTo(): string {
  const value = new URLSearchParams(window.location.search).get("returnTo");
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : "/profile";
}

export default function LoginClient() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const configuredProviders = useMemo(
    () => session
      ? (Object.entries(session.providers) as Array<[Provider, boolean]>).filter(([, enabled]) => enabled)
      : [],
    [session],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/session", { credentials: "same-origin", signal: controller.signal })
      .then((response) => readJson<SessionPayload>(response))
      .then((payload) => {
        if (payload.authenticated) {
          window.location.replace(safeReturnTo());
          return;
        }
        setSession(payload);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSession({
          authenticated: false,
          providers: { microsoft: false, qq: false, "wechat-open": false, "wechat-oa": false },
        });
        setMessage(error instanceof Error ? error.message : "无法读取登录状态");
      });
    return () => controller.abort();
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await readJson(await fetch("/api/auth/password/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginIdentifier, password }),
      }));
      window.location.replace(safeReturnTo());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <a className="login-brand" href="/"><i>&lt;/&gt;</i><span>Blinga <b>coding</b></span></a>
      <section className="login-panel" aria-labelledby="login-title">
        <header><h1 id="login-title">登录</h1><p>继续你的课程、代码草稿和学习记录。</p></header>
        {message && <div className="login-message" role="status">{message}</div>}
        <form className="password-login-form" onSubmit={login}>
          <label><span>邮箱</span><input type="email" autoComplete="username" value={loginIdentifier} onChange={(event) => setLoginIdentifier(event.target.value)} required /></label>
          <label><span>密码</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          <button type="submit" disabled={busy}>{busy ? "登录中" : "登录"}</button>
        </form>
        {configuredProviders.length > 0 && <div className="login-providers">
          <span>其他登录方式</span>
          {configuredProviders.map(([provider]) => <a key={provider} href={`/api/auth/${provider}/start?returnTo=${encodeURIComponent(safeReturnTo())}`}>{providerLabels[provider]}</a>)}
        </div>}
        <a className="guest-entry" href="/"><span>访客模式</span><small>无需登录，仅浏览公开课程</small></a>
      </section>
    </main>
  );
}
