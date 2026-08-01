import type { Metadata } from "next";
import ProfileClient from "./profile-client";
import "./profile.css";

export const metadata: Metadata = {
  title: "个人主页 · Blinga coding",
  description: "管理学习记录、代码草稿、账号绑定与个人偏好。",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
