"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "blinga-color-theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const activeTheme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    setTheme(activeTheme);
  }, []);

  const nextTheme = theme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      className={`theme-toggle hover-bounce ${className}`.trim()}
      aria-label={theme === "light" ? "切换到深色模式" : "切换到浅色模式"}
      title={theme === "light" ? "深色模式" : "浅色模式"}
      onClick={() => {
        applyTheme(nextTheme);
        setTheme(nextTheme);
      }}
    >
      <span aria-hidden="true">{theme === "light" ? "☾" : theme === "dark" ? "☼" : "◐"}</span>
    </button>
  );
}
