"use client";

import { useEffect, useRef, useState } from "react";

type Provider = "microsoft" | "qq" | "wechat-open" | "wechat-oa";

type SessionPayload = {
  authenticated: boolean;
  providers: Record<Provider, boolean>;
  transition?: { active: boolean; displayName: string } | null;
  user?: {
    displayName: string;
    email: string | null;
    avatarType: string;
    avatarValue: string | null;
    avatarUrl: string | null;
  };
};

const providerLabels: Record<Provider, string> = {
  microsoft: "Microsoft",
  qq: "QQ",
  "wechat-open": "微信扫码",
  "wechat-oa": "微信授权",
};

function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "访";
  return Array.from(trimmed)[0].toUpperCase();
}

export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/session", { signal: controller.signal, credentials: "same-origin" })
      .then((response) => response.json())
      .then((payload: SessionPayload) => setSession(payload))
      .catch(() => setSession({
        authenticated: false,
        providers: {
          microsoft: false,
          qq: false,
          "wechat-open": false,
          "wechat-oa": false,
        },
      }));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const displayName =
    session?.user?.displayName ||
    session?.transition?.displayName ||
    "访客";
  const configured = session
    ? (Object.entries(session.providers) as Array<[Provider, boolean]>).filter(([, value]) => value)
    : [];

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    window.location.href = "/";
  }

  return (
    <div className="account-menu" ref={rootRef}>
      <button
        className="avatar account-avatar hover-bounce"
        type="button"
        aria-label="打开个人账户菜单"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        style={
          session?.user?.avatarType === "preset" && session.user.avatarValue
            ? { background: session.user.avatarValue }
            : undefined
        }
      >
        {session?.user?.avatarType === "upload"
          ? <img src="/api/profile/avatar" alt="" />
          : initials(displayName)}
        <span aria-hidden="true" />
      </button>

      <div className={`account-popover glass ${open ? "open" : ""}`} role="menu" aria-hidden={!open}>
        <header>
          <div
            className="account-popover-avatar"
            style={
              session?.user?.avatarType === "preset" && session.user.avatarValue
                ? { background: session.user.avatarValue }
                : undefined
            }
          >
            {session?.user?.avatarType === "upload"
              ? <img src="/api/profile/avatar" alt="" />
              : initials(displayName)}
          </div>
          <span>
            <b>{displayName}</b>
            <small>
              {session?.authenticated
                ? session.user?.email || "已安全登录"
                : session?.transition
                  ? "旧学习数据已安全保留"
                  : "尚未登录"}
            </small>
          </span>
        </header>

        {session?.authenticated ? (
          <>
            <a href="/profile" role="menuitem"><span>个人主页</span><i>→</i></a>
            <a href="/profile?tab=history" role="menuitem"><span>学习历史</span><i>⌁</i></a>
            <a href="/profile?tab=security" role="menuitem"><span>登录方式与安全</span><i>◇</i></a>
            <button type="button" role="menuitem" onClick={signOut}><span>退出登录</span><i>↗</i></button>
          </>
        ) : configured.length ? (
          <section className="account-provider-list" aria-label="可用登录方式">
            <p>{session?.transition ? "绑定外部账号以迁移现有学习数据" : "选择登录方式"}</p>
            {configured.map(([provider]) => (
              <a
                key={provider}
                href={`/api/auth/${provider}/start?returnTo=${encodeURIComponent("/profile")}`}
                role="menuitem"
              >
                <span>{providerLabels[provider]}</span><i>→</i>
              </a>
            ))}
          </section>
        ) : (
          <p className="account-config-note">
            微信、QQ 与 Microsoft 登录将在平台应用审核和密钥配置完成后自动开放。
          </p>
        )}
      </div>
    </div>
  );
}
