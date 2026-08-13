import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import "./light-ui.css";
import "lenis/dist/lenis.css";
import HoverBounceMotion from "./hover-bounce";
import SmoothScrollMotion from "./smooth-scroll";
import { WebDesktopPet } from "./web-pet";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blinga coding · AI 编程学习平台",
  description: "集知识学习、AI 问答、思维导图与在线实训于一体的编程学习平台。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased light-ui`}
      >
        <SmoothScrollMotion />
        <HoverBounceMotion />
        {children}
        <WebDesktopPet />
      </body>
    </html>
  );
}
