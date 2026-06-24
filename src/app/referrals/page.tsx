import type { Metadata } from "next";
import Link from "next/link";
import {
  getReferrals,
  getTracker,
  getOpenings,
  getOutreachTemplates,
  readDoc,
} from "@/lib/data";
import { renderInline, renderMarkdown } from "@/lib/markdown";
import ReferralAdvance from "@/components/ReferralAdvance";
import ReferralKit, { type KitJob } from "@/components/ReferralKit";
import ColdOutreachKit from "@/components/ColdOutreachKit";

export const metadata: Metadata = { title: "内推渠道" };

/** 渠道第一列 → 公司基名（"Vertex Cloud/示例"→Vertex Cloud、"Northwind ①"→Northwind） */
const baseName = (cell: string) =>
  cell.replace(/[*_`①②③]/g, "").split(/[/／（(]/)[0].trim();

export default function ReferralsPage() {
  const { header, rows } = getReferrals();
  const tracker = getTracker();
  const md = readDoc("pipeline/referrals.md") ?? "";
  const openings = getOpenings();
  const templates = getOutreachTemplates();

  const templateFor = (cell: string) => {
    const clean = cell.replace(/[*_`]/g, "").trim();
    return (
      templates.find((t) => t.key === clean) ??
      templates.find((t) => baseName(t.key) === baseName(clean)) ??
      null
    );
  };
  const jobsFor = (cell: string): KitJob[] =>
    openings
      .filter(
        (o) => !o.excluded && o.company.toLowerCase() === baseName(cell).toLowerCase()
      )
      .map((o) => {
        const urls = o.raw.match(/https?:\/\/[^)\s]+/g) ?? [];
        const link = urls.length ? urls[urls.length - 1] : "";
        const id =
          o.raw.match(/\bR\d{5,}\b/)?.[0] ??
          link.match(/\/(\d{5,})(?:[/?#]|$)/)?.[1] ??
          "";
        return {
          title: o.title,
          location: o.location,
          link,
          id,
          stars: o.stars,
          hot: o.hot,
          pinned: o.pinned,
        };
      });
  // 主表以外的说明性内容（状态流/规矩等）原样渲染在表下方
  const covered = new Set(
    rows.map((r) => (r[0] ?? "").replace(/[*_`]/g, "").split(/[\/／(（]/)[0].trim().toLowerCase())
  );
  const missing = tracker.filter(
    (t) => ![...covered].some((c) => c && t.name.toLowerCase().includes(c.slice(0, 4)))
  );

  return (
    <>
      <h1 className="page-title">🤝 内推渠道</h1>
      <p className="page-sub">
        源文件：<Link href="/docs/pipeline/referrals">pipeline/referrals.md</Link> ·
        状态流：找到 → 已联系 → 已发材料 → 已提交内推 → 已投递
      </p>

      <div className="card section">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                {header.map((h, i) => (
                  <th key={i}>{h.replace(/\*\*/g, "")}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const statusCol = header.findIndex((h) => h.includes("状态"));
                return (
                  <tr key={i}>
                    {r.map((c, j) =>
                      j === statusCol ? (
                        <td key={j}>
                          <ReferralAdvance firstCell={r[0]} status={c} />
                        </td>
                      ) : j === 0 ? (
                        <td key={j} style={{ minWidth: 110, fontWeight: 650 }}>
                          <span dangerouslySetInnerHTML={{ __html: renderInline(c, "pipeline") }} />
                          <ReferralKit channel={c} template={templateFor(c)} jobs={jobsFor(c)} />
                        </td>
                      ) : (
                        <td
                          key={j}
                          dangerouslySetInnerHTML={{ __html: renderInline(c, "pipeline") }}
                        />
                      )
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {missing.length > 0 && (
        <div className="card section">
          <div className="card-title">
            🕳 还缺内推的公司（{missing.length} 家）
            <span className="more muted">点「🧭 解决」：LinkedIn 冷启动 / 找熟人 / 放弃直接网申</span>
          </div>
          <ul className="next-list">
            {missing.map((t) => (
              <li key={t.name}>
                <span className="who">
                  {t.slug ? <Link href={`/companies/${t.slug}`}>{t.name}</Link> : t.name}{" "}
                  <span className={`tier-badge tier-${t.tier}`}>{["", "一", "二", "三"][t.tier]}</span>
                </span>
                <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <ColdOutreachKit
                    companyCell={t.company}
                    name={t.name}
                    currentReferralCell={t.referral}
                    jobs={jobsFor(t.name)}
                    templates={{
                      connect: templates.find((x) => x.key === "LinkedIn 连接请求") ?? null,
                      dm: templates.find((x) => x.key === "LinkedIn 陌生人 DM") ?? null,
                      friend: templates.find((x) => x.key === "熟人内推请求") ?? null,
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
          <p className="muted small" style={{ marginBottom: 0 }}>
            话术全文（A 熟人 / B 陌生人，中英）：
            <Link href="/docs/pipeline/referral-outreach-templates">referral-outreach-templates.md</Link>
          </p>
        </div>
      )}

      <div className="card">
        <div className="card-title">📄 referrals.md 全文（含规矩与备注）</div>
        <article
          className="prose"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(md, "pipeline") }}
        />
      </div>
    </>
  );
}
