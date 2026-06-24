import type { Metadata } from "next";
import Link from "next/link";
import { getAgenda, getPinnedOpenings } from "@/lib/data";
import AgendaList from "@/components/AgendaList";

export const metadata: Metadata = { title: "日程" };

export default function AgendaPage() {
  const items = getAgenda();
  const pins = getPinnedOpenings();
  const todo = pins.filter((o) => o.appStatus === "");
  const interview = pins.filter((o) => o.appStatus === "interview");
  return (
    <>
      <h1 className="page-title">🗓 日程 / Deadline</h1>
      <p className="page-sub">
        自动聚合：各公司文件「关键日期」表（<code>YYYY-MM-DD</code>）+ tracker「下一步」的{" "}
        <code>⏰MM-DD</code> 前缀 + offers.md 截止日。面试季的"什么时候该干什么"都在这。
      </p>
      {(todo.length > 0 || interview.length > 0) && (
        <div className="card section">
          <div className="card-title">
            📌 投递待办（无固定日期，跟着 pipeline 进度走）
            <Link className="more" href="/pipeline">
              去 pipeline 标进度 →
            </Link>
          </div>
          <ul className="next-list">
            {todo.map((o) => (
              <li key={o.slug + o.anchor}>
                待投：<Link href={`/companies/${o.slug}`}>{o.company}</Link> · {o.title}
              </li>
            ))}
            {interview.map((o) => (
              <li key={o.slug + o.anchor}>
                🗣️ 面试中：<Link href={`/companies/${o.slug}`}>{o.company}</Link> · {o.title} — 建/查面前速备包
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="card">
        <AgendaList items={items} />
      </div>
      <p className="muted small">
        录入入口：公司页「⚡ 快改」写 <code>⏰MM-DD …</code> 到下一步；或 📨 派活（面试日程）让
        Claude 记进「关键日期」表并生成<b>面前速备包</b>（prep/briefs/）。模板见{" "}
        <Link href="/docs/pipeline/companies/_TEMPLATE">_TEMPLATE</Link>。
      </p>
    </>
  );
}
