import type { Metadata } from "next";
import ReviewClient from "./review-client";
import "./review.css";

export const metadata: Metadata = {
  title: "错题复习 · Blinga coding",
  description: "回顾判题错误、重试代码并查看各知识点的掌握状态。",
};

export default function ReviewPage() {
  return <ReviewClient />;
}
