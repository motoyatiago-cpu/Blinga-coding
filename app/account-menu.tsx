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

async function readJsonResponse<T>(response: Response, fallback: string): Promise<T> {
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
    throw new Error(payload?.error || fallback);
  }
  return payload;
}

let transitionActivationPromise: Promise<SessionPayload> | null = null;

function activateTransitionAccount(): Promise<SessionPayload> {
  if (!transitionActivationPromise) {
    transitionActivationPromise = (async () => {
      await readJsonResponse(
        await fetch("/api/auth/transition/activate", {
          method: "POST",
          credentials: "same-origin",
        }),
        "账户暂时无法打开，请稍后重试",
      );
      const session = await readJsonResponse<SessionPayload>(
        await fetch("/api/auth/session", { credentials: "same-origin" }),
        "无法读取账户状态",
      );
      if (!session.authenticated) throw new Error("账户暂时无法打开，请稍后重试");
      return session;
    })().catch((error) => {
      transitionActivationPromise = null;
      throw error;
    });
  }
  return transitionActivationPromise;
}

export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [avatarRevision, setAvatarRevision] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const prepareAccount = async () => {
      try {
        const payload = await readJsonResponse<SessionPayload>(
          await fetch("/api/auth/session", { signal: controller.signal, credentials: "same-origin" }),
          "无法读取账户状态",
        );
        if (cancelled) return;
        setSession(payload);
        if (!payload.authenticated && payload.transition?.active) {
          try {
            const activated = await activateTransitionAccount();
            if (!cancelled) setSession(activated);
          } catch {
            // 后台准备失败时保持菜单可用，具体操作会再次尝试并给出中文反馈。
          }
        }
      } catch {
        if (!cancelled) {
          setSession({
            authenticated: false,
            providers: {
              microsoft: false,
              qq: false,
              "wechat-open": false,
              "wechat-oa": false,
            },
          });
        }
      }
    };
    void prepareAccount();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

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
      if (!session?.authenticated) {
        const activated = await activateTransitionAccount();
        setSession(activated);
      }
      const body = new FormData();
      body.set("avatar", file);
      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        credentials: "same-origin",
        body,
      });
      await readJsonResponse(response, "头像上传失败，请稍后重试");
      const nextPayload = await readJsonResponse<SessionPayload>(
        await fetch("/api/auth/session", { credentials: "same-origin" }),
        "无法更新头像状态",
      );
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
  const showAccountActions = session === null || session.authenticated || Boolean(session.transition?.active);

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
                  ? "个人账户"
                  : "尚未登录"}
            </small>
          </span>
        </header>

        {showAccountActions ? (
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
        ) : null}
      </div>
    </div>
  );
}
