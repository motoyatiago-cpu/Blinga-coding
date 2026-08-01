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
  const [activating, setActivating] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [avatarRevision, setAvatarRevision] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const activationAttemptedRef = useRef(false);

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
    if (!open || session?.authenticated || !session?.transition?.active || activationAttemptedRef.current) {
      return;
    }
    activationAttemptedRef.current = true;
    const activate = async () => {
      setActivating(true);
      setFeedback("");
      try {
        const response = await fetch("/api/auth/transition/activate", {
          method: "POST",
          credentials: "same-origin",
        });
        const payload = await response.json() as { error?: string };
        if (!response.ok) throw new Error(payload.error || "个人账号激活失败");
        const nextSession = await fetch("/api/auth/session", { credentials: "same-origin" });
        const nextPayload = await nextSession.json() as SessionPayload & { error?: string };
        if (!nextSession.ok) throw new Error(nextPayload.error || "无法读取账户状态");
        setSession(nextPayload);
        setFeedback("个人账户已就绪");
      } catch (error) {
        activationAttemptedRef.current = false;
        setFeedback(error instanceof Error ? error.message : "个人账号激活失败");
      } finally {
        setActivating(false);
      }
    };
    void activate();
  }, [open, session]);

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

  async function uploadAvatar(file: File | undefined) {
    if (!file) return;
    if (![/^image\/png$/, /^image\/jpeg$/, /^image\/webp$/].some((pattern) => pattern.test(file.type))) {
      setFeedback("请选择 JPEG、PNG 或 WebP 图片");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFeedback("头像文件不能超过 2MB");
      return;
    }

    setAvatarBusy(true);
    setFeedback("");
    try {
      const body = new FormData();
      body.set("avatar", file);
      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        credentials: "same-origin",
        body,
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "头像上传失败");
      const nextSession = await fetch("/api/auth/session", { credentials: "same-origin" });
      const nextPayload = await nextSession.json() as SessionPayload & { error?: string };
      if (!nextSession.ok) throw new Error(nextPayload.error || "无法更新头像状态");
      setSession(nextPayload);
      setAvatarRevision(Date.now());
      setFeedback("头像已更新");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "头像上传失败");
    } finally {
      setAvatarBusy(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  const avatarSrc = session?.user?.avatarType === "upload"
    ? `/api/profile/avatar?v=${avatarRevision}`
    : null;

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
        {avatarSrc
          ? <img src={avatarSrc} alt="" />
          : initials(displayName)}
        <span aria-hidden="true" />
      </button>
      <input
        ref={avatarInputRef}
        className="account-avatar-input"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-label="选择新的头像图片"
        onChange={(event) => void uploadAvatar(event.target.files?.[0])}
      />

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
            {avatarSrc
              ? <img src={avatarSrc} alt="" />
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

        {activating ? (
          <p className="account-menu-status" role="status">正在准备个人账户…</p>
        ) : session?.authenticated ? (
          <>
            <button
              type="button"
              role="menuitem"
              disabled={avatarBusy}
              onClick={() => avatarInputRef.current?.click()}
            >
              <span>{avatarBusy ? "正在上传" : "更换头像"}</span><i>↗</i>
            </button>
            <a href="/profile" role="menuitem"><span>个人主页</span><i>→</i></a>
            <a href="/profile?tab=history" role="menuitem"><span>学习历史</span><i>⌁</i></a>
            <a href="/profile?tab=settings" role="menuitem"><span>偏好设置</span><i>⌘</i></a>
            <a href="/profile?tab=security" role="menuitem"><span>密码与安全</span><i>◇</i></a>
            <button type="button" role="menuitem" onClick={signOut}><span>退出当前会话</span><i>↗</i></button>
            {feedback && <p className="account-menu-feedback" role="status">{feedback}</p>}
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
        {!activating && !session?.authenticated && feedback && (
          <p className="account-menu-feedback" role="status">{feedback}</p>
        )}
      </div>
    </div>
  );
}
