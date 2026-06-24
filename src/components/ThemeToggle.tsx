"use client";

import { useEffect, useState } from "react";

const SUN = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
const MOON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
  </svg>
);

/** 主题切换：暖光·浅 ⇄ 暖光·夜，存 localStorage（jh_theme） */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  if (!theme) return <button className="theme-toggle" aria-hidden>　</button>;

  const next = theme === "dark" ? "light" : "dark";
  const cycle = () => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("jh_theme", next);
    } catch {}
    setTheme(next);
  };

  return (
    <button
      className="theme-toggle"
      onClick={cycle}
      title={`当前：${theme === "dark" ? "暖光·夜" : "暖光·浅"}，点击切换`}
      aria-label="切换深浅主题"
    >
      {theme === "dark" ? MOON : SUN}
      {theme === "dark" ? "夜" : "浅"}
    </button>
  );
}
