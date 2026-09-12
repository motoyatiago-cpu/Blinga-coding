const PROVIDERS = ["microsoft", "qq", "wechat-open", "wechat-oa"] as const;
type Provider = typeof PROVIDERS[number];
type Result = { ok: boolean; message: string; redirectTo: string };

export function safeReturnTo(search: string): string {
  const value = new URLSearchParams(search).get("returnTo");
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) return "/home";
  const parsed = new URL(value, "https://blinga.invalid");
  if (parsed.origin !== "https://blinga.invalid" || ["/", "/login", "/register"].includes(parsed.pathname) || parsed.pathname.startsWith("/api/")) return "/home";
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

async function readJson(response: Response) {
  const payload = response.headers.get("content-type")?.includes("application/json")
    ? await response.json().catch(() => null) : null;
  if (!response.ok || !payload) throw new Error(payload?.error || "账户服务暂时不可用，请稍后重试。");
  return payload;
}

/** Reuse existing APIs and HttpOnly cookies. No passwords enter browser storage. */
export function createAuthHandlers(root: ShadowRoot, signal: AbortSignal) {
  const returnTo = safeReturnTo(window.location.search);
  const configured = new Set<Provider>();
  async function submit(kind: "login" | "register", body: Record<string, string | boolean>): Promise<Result> {
    try {
      const payload = await readJson(await fetch(`/api/auth/password/${kind}`, {
        method: "POST", credentials: "same-origin", signal,
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      }));
      if (payload.authenticated !== true) throw new Error("未能建立登录会话，请重试。");
      return { ok: true, message: kind === "login" ? "登录成功，欢迎回来。" : "账号创建成功。", redirectTo: returnTo };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : "连接中断，请稍后重试。", redirectTo: "" };
    }
  }
  void fetch("/api/auth/session", { credentials: "same-origin", signal, cache: "no-store" })
    .then(readJson).then((payload) => {
      if (signal.aborted) return;
      for (const provider of PROVIDERS) {
        if (payload.providers?.[provider] === true) {
          configured.add(provider);
          const button = root.querySelector<HTMLButtonElement>(`[data-social-provider="${provider}"]`);
          if (button) button.hidden = false;
        }
      }
      const heading = root.getElementById("social-heading");
      if (heading) heading.textContent = configured.size ? "其他进入方式" : "访客浏览";
    }).catch(() => { /* Password and guest entry remain usable during discovery errors. */ });
  return {
    login: ({ identifier, password, remember }: { identifier: string; password: string; remember: boolean }) =>
      submit("login", { loginIdentifier: identifier, password, remember }),
    register: (body: Record<string, string>) => submit("register", body),
    social: async ({ provider }: { provider: Provider }): Promise<Result> => configured.has(provider)
      ? { ok: true, message: "正在前往登录平台…", redirectTo: `/api/auth/${provider}/start?returnTo=${encodeURIComponent(returnTo)}` }
      : { ok: false, message: "该登录方式暂未开放。", redirectTo: "" },
  };
}
