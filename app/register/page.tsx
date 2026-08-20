import type { Metadata } from "next";
import RegisterClient from "./register-client";
import "../login/login.css";

export const metadata: Metadata = {
  title: "注册 · Blinga coding",
  description: "创建 Blinga coding 账号并同步学习进度。",
};

export default function RegisterPage() {
  return <RegisterClient />;
}
