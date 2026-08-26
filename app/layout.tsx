import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "lenis/dist/lenis.css";
import "./refined-dark-ui.css";
import "./theme.css";
import HoverBounceMotion from "./hover-bounce";
import SmoothScrollMotion from "./smooth-scroll";
import { WebDesktopPet } from "./web-pet";

const geistSans = Geist({
  variable: "--font-geist-sans",
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
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("blinga-color-theme");document.documentElement.dataset.theme=t==="light"?"light":"dark";document.documentElement.style.colorScheme=document.documentElement.dataset.theme}catch(e){document.documentElement.dataset.theme="dark"}` }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SmoothScrollMotion />
        <HoverBounceMotion />
        {children}
        <WebDesktopPet />
      </body>
    </html>
  );
}
