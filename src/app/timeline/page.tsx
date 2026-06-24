import type { Metadata } from "next";
import Link from "next/link";
import { getAgenda, getJournal } from "@/lib/data";
import { renderInline } from "@/lib/markdown";
import AgendaList from "@/components/AgendaList";

export const metadata: Metadata = { title: "时间线" };

export default function TimelinePage() {
  const agenda = getAgenda();
  const journal = getJournal().slice(0, 18);

  return (
    <>
      <h1 className="page-title">🗓️ 时间线</h1>
      <p className="page-sub">即将发生（面试 / 截止）＋ 一路走来（动态记录）。</p>

      <div className="grid grid-2 section">
        <div className="card">
          <div className="card-title">
            即将发生
            <Link className="more" href="/agenda">
              完整日程 →
            </Link>
          </div>
          <AgendaList items={agenda} />
        </div>

        <div className="card">
          <div className="card-title">
            一路走来
            <Link className="more" href="/journal">
              全部日志 →
            </Link>
          </div>
          {journal.map((e) => (
            <div className="timeline-entry" key={e.title}>
              <h3 dangerouslySetInnerHTML={{ __html: renderInline(e.title, "log") }} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
