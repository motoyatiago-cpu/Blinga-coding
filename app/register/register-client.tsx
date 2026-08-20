"use client";

import { useState, type FormEvent } from "react";

async function readJson(response: Response): Promise<{ authenticated?: boolean; error?: string }> {
  const contentType = response.headers.get("Content-Type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null) as { authenticated?: boolean; error?: string } | null
    : null;
  if (!response.ok || !payload) throw new Error(payload?.error || "注册服务暂时不可用");
  return payload;
}

export default function RegisterClient() {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function register(event: FormEvent) {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setMessage("两次输入的密码不一致");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await readJson(await fetch("/api/auth/password/register", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }));
      window.location.replace("/profile");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "注册失败");
    } finally {
      setBusy(false);
    }
  }

  return <main className="login-page">
    <a className="login-brand" href="/"><i>&lt;/&gt;</i><span>Blinga <b>coding</b></span></a>
    <section className="login-panel" aria-labelledby="register-title">
      <header><h1 id="register-title">创建账号</h1><p>注册后可以同步课程进度、代码草稿和学习记录。</p></header>
      {message && <div className="login-message" role="status">{message}</div>}
      <form className="password-login-form" onSubmit={register}>
        <label><span>账号</span><input autoCapitalize="none" spellCheck={false} autoComplete="username" minLength={4} maxLength={20} pattern="[A-Za-z0-9_]{4,20}" placeholder="4–20 位字母、数字或下划线" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required /></label>
        <label><span>邮箱</span><input type="email" autoComplete="email" placeholder="name@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
        <label><span>密码</span><div className="password-input"><input type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={10} maxLength={128} placeholder="至少 10 个字符，包含字母和数字" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "隐藏" : "显示"}</button></div></label>
        <label><span>确认密码</span><input type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={10} maxLength={128} value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} required /></label>
        <button type="submit" disabled={busy}>{busy ? "注册中" : "注册"}</button>
      </form>
      <p className="register-entry">已有账号？ <a href="/login">返回登录</a></p>
      <a className="guest-entry" href="/"><span>访客浏览</span><small>无需登录，仅浏览公开课程</small></a>
    </section>
  </main>;
}
