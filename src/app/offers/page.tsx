import type { Metadata } from "next";
import Link from "next/link";
import { getTracker, readDoc, getSiteConfig } from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";
import Prose from "@/components/Prose";

export const metadata: Metadata = { title: "Offers" };

const CHECKLIST = [
  { t: "签证 / sponsorship（如适用）", d: "如需 sponsorship 或绿卡，把时间线白纸黑字写进 offer 或邮件。" },
  { t: "级别确认", d: "确认 leveling（如 Senior / Staff）；级别决定 comp 区间与未来空间。" },
  { t: "总包拆解", d: "base · 股票 vesting 节奏 · 签字费 · 年度 refresh。" },
  { t: "截止日期（防爆单）", d: "争取对齐各家时间线，别被单个 exploding offer 逼单。" },
  { t: "竞争 offer 杠杆", d: "有第二家在手再谈；先别报数字（don't name a number first）。" },
];

export default function OffersPage() {
  const tracker = getTracker();
  const hasOffer = tracker.some((r) => /offer|入职/i.test(r.status));
  const playbook = readDoc("negotiation/README.md");
  const comp = readDoc("negotiation/comp-research.md");
  const cfg = getSiteConfig();

  return (
    <>
      <h1 className="page-title">💼 Offers · 谈判</h1>
      <p className="page-sub">
        offer 到来时的作战中心：多 offer 对比、谈判话术、comp 调研 —— 现在先备好计划。
      </p>

      <div className="grid grid-2 section">
        <section className="tile hero empty">
          <span className="hero-eyebrow">谈判阶段</span>
          <h2 style={{ marginTop: 14 }}>
            {hasOffer ? "你有 offer 了 —— 来把它谈成对的那一个。" : "还没有 offer —— 这是 offer 到来时的作战计划。"}
          </h2>
          <p className="sub" style={{ display: "block" }}>
            北极星：<b>{cfg.northStar}</b>。offer 一来，这页会变成对比 + 谈判主场。
          </p>
          <div className="actions">
            <Link className="btn-primary" href="/docs/negotiation/README">
              看谈判 playbook
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            {comp !== null && (
              <Link className="btn-ghost" href="/docs/negotiation/comp-research">
                comp 调研
              </Link>
            )}
          </div>
        </section>

        <section className="tile">
          <div className="tile-head">
            <span className="tile-title">offer 到手核对清单</span>
          </div>
          <ul className="checklist">
            {CHECKLIST.map((c) => (
              <li key={c.t} style={{ alignItems: "flex-start" }}>
                <span className="txt" style={{ fontWeight: 600 }}>
                  {c.t}
                  <div className="muted small" style={{ fontWeight: 400, marginTop: 2 }}>{c.d}</div>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {playbook !== null && (
        <div className="card section">
          <div className="card-title">📖 谈判 playbook</div>
          <Prose html={renderMarkdown(playbook, "negotiation")} />
        </div>
      )}
    </>
  );
}
