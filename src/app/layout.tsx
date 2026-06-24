import type { Metadata } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import AskClaude from "@/components/AskClaude";
import ThemeToggle from "@/components/ThemeToggle";
import { getSiteConfig } from "@/lib/data";
import "./globals.css";

/** 构建时检测仓库壁纸（设置页上传后 commit 到 public/wallpaper.jpg）→ 全设备生效；内容 hash 做缓存戳 */
function repoWallpaper(): string {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public/wallpaper.jpg"));
    const v = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8);
    return `/wallpaper.jpg?v=${v}`;
  } catch {
    return "";
  }
}

export function generateMetadata(): Metadata {
  const cfg = getSiteConfig();
  return {
    title: { default: `${cfg.appName} · 求职指挥台`, template: `%s · ${cfg.appName}` },
    description: `${cfg.ownerName} 的求职 end-to-end 指挥台：今日、公司、备战、Offers、时间线`,
    robots: { index: false, follow: false },
  };
}

type NavItem = { href: string; label: string; icon: React.ReactNode };
const I = (d: string, extra?: React.ReactNode) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
    {extra}
  </svg>
);
const NAV: NavItem[] = [
  { href: "/", label: "今日", icon: I("M12 7v5l3 2", <circle cx="12" cy="12" r="9" />) },
  { href: "/pipeline", label: "公司", icon: I("M3 21V8l6-4 6 4v13M15 21V11l6 4v6M3 21h18M7 9v.01M7 13v.01M7 17v.01") },
  { href: "/prep", label: "备战", icon: I("M12 2 9 9l-7 .5 5.5 4.5L5.5 21 12 17l6.5 4-2-7L22 9.5 15 9z") },
  { href: "/offers", label: "Offers", icon: I("M3 7l3-4h12l3 4M9 12h6", <rect x="3" y="7" width="18" height="12" rx="1.5" />) },
  { href: "/timeline", label: "时间线", icon: I("M4 6h16M4 12h16M4 18h10", <circle cx="18" cy="18" r="1.6" fill="currentColor" stroke="none" />) },
];

// 预绘制时定主题与壁纸，避免闪烁：jh_theme = light|dark（旧 glass/classic 值视为无效，回落到系统深浅）。
const THEME_INIT = `(function(){var d=document.documentElement;try{var t=localStorage.getItem("jh_theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}d.dataset.theme=t;var repo=d.dataset.repoWallpaper||"";var w=localStorage.getItem("jh_wallpaper");if(w&&repo&&localStorage.getItem("jh_wallpaper_synced")==="1"){localStorage.removeItem("jh_wallpaper");localStorage.removeItem("jh_wallpaper_synced");w=null;}var u=w||(localStorage.getItem("jh_wallpaper_off")==="1"?"":repo);if(u){d.style.setProperty("--wallpaper",'url("'+u.replace(/"/g,'\\\\"')+'")');d.dataset.wallpaper="1";}}catch(e){d.dataset.theme="light";}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const wp = repoWallpaper();
  const cfg = getSiteConfig();
  return (
    <html lang="zh-CN" suppressHydrationWarning data-repo-wallpaper={wp || undefined}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <div className="wallpaper-layer" aria-hidden />
        <header className="topbar">
          <div className="topbar-inner">
            <Link href="/" className="brand">
              <span className="mark" aria-hidden>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </span>
              {cfg.appName}
            </Link>
            <nav className="nav">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href}>
                  {n.icon}
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="nav-spacer" />
            <ThemeToggle />
            <Link href="/settings" className="avatar" aria-label="设置" title="设置">
              {cfg.ownerInitials}
            </Link>
          </div>
        </header>
        <main className="container">{children}</main>
        <AskClaude />
        <footer className="footer">
          数据源 = 本仓库 markdown · push 到 main 后自动重建 ·{" "}
          <Link href="/start">上手指南</Link> ·{" "}
          <a href={`https://github.com/${cfg.githubRepo}`} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </footer>
      </body>
    </html>
  );
}
