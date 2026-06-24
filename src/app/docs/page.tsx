import type { Metadata } from "next";
import Link from "next/link";
import { getDocIndex, getResumeExports } from "@/lib/data";

export const metadata: Metadata = { title: "文档" };

export default function DocsIndexPage() {
  const groups = getDocIndex();
  const exports = new Map(getResumeExports().map((e) => [e.source.replace(/\.md$/, ""), e]));
  return (
    <>
      <h1 className="page-title">🗃 全部文档</h1>
      <p className="page-sub">
        仓库里所有功课的入口（公司档案见 <Link href="/pipeline">Pipeline</Link>）。
        简历类文档带 ⬇️ 最新导出件（构建时自动生成）。
      </p>
      <div className="grid grid-2">
        {groups.map((g) => (
          <div className="card doc-group" key={g.label}>
            <div className="card-title">{g.label}</div>
            <ul>
              {g.files.map((f) => {
                const exp = exports.get(f.rel);
                return (
                  <li key={f.rel}>
                    <Link href={`/docs/${f.rel}`}>{f.title}</Link>
                    {exp && (
                      <span className="small muted">
                        {" "}· <a href={exp.docx} download>⬇️docx</a> ·{" "}
                        <a href={exp.html} target="_blank" rel="noreferrer">html</a>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
