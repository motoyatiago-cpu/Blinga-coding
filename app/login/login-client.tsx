"use client";

import ThemeToggle from "../theme-toggle";

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
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
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
        body: JSON.stringify({ loginIdentifier, password, remember }),
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
      <ThemeToggle className="theme-toggle-float" />
      <section className="login-panel" aria-labelledby="login-title">
        <header><h1 id="login-title">欢迎回来</h1><p>请输入你的账号信息。</p></header>
        {message && <div className="login-message" role="status">{message}</div>}
        <form className="password-login-form" onSubmit={login}>
          <label><span>账号或邮箱</span><input type="text" autoCapitalize="none" spellCheck={false} autoComplete="username" placeholder="请输入账号或邮箱" value={loginIdentifier} onChange={(event) => setLoginIdentifier(event.target.value)} required /></label>
          <label><span>密码</span><div className="password-input"><input type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="请输入密码" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "隐藏" : "显示"}</button></div></label>
          <div className="login-options"><label><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>30 天内保持登录</span></label><button type="button" onClick={() => setMessage(configuredProviders.length ? "请使用已绑定的第三方账号登录，再到密码与安全中重设密码。" : "请联系站点管理员核验账号后恢复密码。") }>忘记密码？</button></div>
          <button type="submit" disabled={busy}>{busy ? "登录中" : "登录"}</button>
        </form>
        {configuredProviders.length > 0 && <div className="login-providers">
          <span>其他登录方式</span>
          {configuredProviders.map(([provider]) => <a key={provider} href={`/api/auth/${provider}/start?returnTo=${encodeURIComponent(safeReturnTo())}`}>{providerLabels[provider]}</a>)}
        </div>}
        <p className="register-entry">还没有账号？ <a href="/register">立即注册</a></p>
        <a className="guest-entry" href="/"><span>访客浏览</span><small>无需登录，仅浏览公开课程</small></a>
      </section>
    </main>
  );
}
