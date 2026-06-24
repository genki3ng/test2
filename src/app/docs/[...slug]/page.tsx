import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import path from "path";
import { getAllDocPaths, readDoc, getTaskLines, getResumeExports } from "@/lib/data";
import { isAllowedDoc, renderMarkdown } from "@/lib/markdown";
import Prose from "@/components/Prose";
import { siteConfig } from "@/site.config";

export function generateStaticParams() {
  return getAllDocPaths().map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug[slug.length - 1] };
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const rel = slug.map(decodeURIComponent).join("/") + ".md";
  if (!isAllowedDoc(rel)) notFound();
  const md = readDoc(rel);
  if (md === null) notFound();
  const baseDir = path.posix.dirname(rel);
  const exp = getResumeExports().find((e) => e.source === rel);

  return (
    <>
      <p className="small">
        <Link href="/docs">← 文档</Link>{" "}
        <span className="muted">
          · {rel} ·{" "}
          <a
            href={`https://github.com/${siteConfig.githubRepo}/blob/main/${rel}`}
            target="_blank"
            rel="noreferrer"
          >
            在 GitHub 编辑
          </a>
        </span>
      </p>
      {exp && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-title">📄 导出件 — 每次 push 自动重建，始终与本页同步</div>
          <p className="small" style={{ margin: "6px 0" }}>
            <a className="btn mini" href={exp.docx} download>
              ⬇️ docx — 传 Google Drive 双击即转 Google Doc
            </a>{" "}
            <a className="btn mini ghost" href={exp.html} target="_blank" rel="noreferrer">
              🌐 HTML — 贴 gdoc 保格式 / Ctrl+P 直接存 PDF
            </a>
          </p>
          <p className="small muted" style={{ margin: 0 }}>
            〔工作区注记〕节已自动剔除；最终 PDF 重命名 <code>你的名字_Resume.pdf</code>（勿带公司名）。
          </p>
        </div>
      )}
      <div className="card">
        <Prose
          html={renderMarkdown(md, baseDir === "." ? "" : baseDir)}
          path={rel}
          tasks={getTaskLines(md).map((t) => ({ text: t.text, checked: t.checked }))}
        />
      </div>
    </>
  );
}
