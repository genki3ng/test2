import { Marked } from "marked";
import path from "path";
import { siteConfig } from "@/site.config";

const GITHUB_BLOB = `https://github.com/${siteConfig.githubRepo}/blob/main/`;

// 站内可浏览的目录/文件白名单（/docs/... 路由与链接改写共用）
export const DOC_DIRS = [
  "pipeline",
  "prep",
  "strategy",
  "intel",
  "profile",
  "log",
  "negotiation",
  "summary",
];
export const DOC_ROOT_FILES = ["HANDOFF.md", "README.md", "CLAUDE.md", "GETTING-STARTED.md", "SETUP.md", "AGENTS.md"];

export function isAllowedDoc(relPath: string): boolean {
  const norm = path.posix.normalize(relPath);
  if (norm.startsWith("..") || path.posix.isAbsolute(norm)) return false;
  if (DOC_ROOT_FILES.includes(norm)) return true;
  return DOC_DIRS.some((d) => norm.startsWith(d + "/")) && norm.endsWith(".md");
}

/** 把仓库内 .md 相对链接映射成站内路由；映射不了的返回 GitHub 链接 */
export function resolveMdHref(href: string, baseDir: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#")) return href; // 外链/锚点
  const [p, hash] = href.split("#");
  if (!p.endsWith(".md")) {
    // 仓库内非 md 资源（截图等）→ GitHub
    const norm = path.posix.normalize(path.posix.join(baseDir, p));
    return norm.startsWith("..") ? href : GITHUB_BLOB + norm;
  }
  const norm = path.posix.normalize(path.posix.join(baseDir, p));
  const suffix = hash ? "#" + hash : "";
  const company = norm.match(/^pipeline\/companies\/([^/]+)\.md$/);
  if (company && !company[1].startsWith("_")) {
    return `/companies/${company[1]}${suffix}`;
  }
  if (isAllowedDoc(norm)) return `/docs/${norm.replace(/\.md$/, "")}${suffix}`;
  return GITHUB_BLOB + norm;
}

const m = new Marked({ gfm: true });

/** 整篇 markdown → HTML，并把仓库内链接改写为站内路由 */
export function renderMarkdown(md: string, baseDir: string): string {
  const html = m.parse(md) as string;
  return rewriteLinks(html, baseDir);
}

/** 单行/单元格 markdown → 行内 HTML */
export function renderInline(md: string, baseDir = ""): string {
  const html = m.parseInline(md) as string;
  return rewriteLinks(html, baseDir);
}

function rewriteLinks(html: string, baseDir: string): string {
  return html
    .replace(/(<a[^>]*\shref=")([^"]+)(")/g, (_, pre, href, post) => {
      return pre + escapeAttr(resolveMdHref(decodeEntities(href), baseDir)) + post;
    })
    .replace(/(<img[^>]*\ssrc=")([^"]+)(")/g, (_, pre, src, post) => {
      const s = decodeEntities(src);
      if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return pre + src + post;
      const norm = path.posix.normalize(path.posix.join(baseDir, s));
      // 仓库内图片走 GitHub raw（站点不打包仓库图片）
      return (
        pre +
        escapeAttr(
          `https://raw.githubusercontent.com/${siteConfig.githubRepo}/main/` + norm
        ) +
        post
      );
    });
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
