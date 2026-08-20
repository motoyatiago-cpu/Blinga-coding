import type { Metadata } from "next";
import LoginClient from "./login-client";
import "./login.css";

export const metadata: Metadata = {
  title: "登录 · Blinga coding",
  description: "使用账号、邮箱或已绑定平台登录 Blinga coding。",
};

export default function LoginPage() {
  return <LoginClient />;
}
