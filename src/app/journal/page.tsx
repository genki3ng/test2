import type { Metadata } from "next";
import { getJournal } from "@/lib/data";
import { renderInline, renderMarkdown } from "@/lib/markdown";

export const metadata: Metadata = { title: "日志" };

export default function JournalPage() {
  const entries = getJournal();
  return (
    <>
      <h1 className="page-title">📰 日志</h1>
      <p className="page-sub">历史流水（log/journal.md），倒序：发生过什么、拍板了什么。</p>
      <div className="card">
        {entries.map((e, i) => (
          <div className="timeline-entry" key={i}>
            <h3 dangerouslySetInnerHTML={{ __html: renderInline(e.title, "log") }} />
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(e.body, "log") }}
            />
          </div>
        ))}
      </div>
    </>
  );
}
