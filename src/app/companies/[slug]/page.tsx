import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCompanySlugs,
  getTracker,
  getAgenda,
  getCompanyNotes,
  listDocs,
  readDoc,
  getTaskLines,
  pillClass,
} from "@/lib/data";
import { renderMarkdown, renderInline } from "@/lib/markdown";
import Prose from "@/components/Prose";
import QuickPanel from "@/components/QuickPanel";

export function generateStaticParams() {
  return getCompanySlugs().map((slug) => ({ slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug };
}

const stripMd = (s: string) => s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*`~]/g, "").trim();
const cleanEvt = (s: string) => stripMd(s).replace(/^[\s⏰✅🗓️📅🔔➡️→]+/u, "").trim();
const GRADS = [
  "linear-gradient(150deg,#25303B,#3A4854)", "linear-gradient(150deg,#5E9A78,#7CB893)",
  "linear-gradient(150deg,#6A5AC2,#8678D8)", "linear-gradient(150deg,#C8392F,#E05044)",
  "linear-gradient(150deg,#3A6EA5,#5B8FD0)", "linear-gradient(150deg,#E8674C,#F08A5D)",
];
function gradFor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return GRADS[h % GRADS.length];
}
function initials(name: string) {
  const letters = name.replace(/[^A-Za-z]/g, "");
  return (letters.slice(0, 2) || name.slice(0, 2)).replace(/^./, (c) => c.toUpperCase());
}

const ARROW = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const md = readDoc(`pipeline/companies/${slug}.md`);
  if (!md) notFound();

  const row = getTracker().find((r) => r.slug === slug);
  const name = row?.name ?? slug;

  // 关键日期：本公司的 agenda 项（未来在前 + 最近 2 条过去）
  const t = new Date();
  const todayStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  const co = getAgenda().filter((a) => a.slug === slug);
  const future = co.filter((a) => a.date >= todayStr);
  const past = co.filter((a) => a.date < todayStr).slice(-2);
  const dates = [...future, ...past].slice(0, 6);
  const daysTo = (d: string) => Math.round((new Date(d).getTime() - new Date(todayStr).getTime()) / 86400000);

  // 速备包 / 面经笔记
  const briefs = listDocs("prep/briefs")
    .map((f) => f.replace(/\.md$/, ""))
    .filter((f) => f.toLowerCase().includes(slug.toLowerCase()))
    .map((f) => {
      const short = f
        .replace(/^\d{4}-\d{2}-\d{2}-/, "")
        .replace(new RegExp(slug + "-?", "i"), "")
        .replace(/-/g, " ")
        .trim();
      return { id: f, label: short ? `速备包 · ${short}` : "速备包" };
    });
  const hasNote = getCompanyNotes().includes(slug);

  return (
    <>
      <p className="small">
        <Link href="/pipeline">← 公司</Link>
      </p>

      <section className="tile co-hero section">
        <div className="cmd-head">
          <span className="logo" style={{ backgroundImage: gradFor(name) }}>{initials(name)}</span>
          <div className="cmd-id">
            <span className="nm">
              {name}
              {row && <span className={`tier-badge tier-${row.tier}`}>{["", "一", "二", "三"][row.tier]}</span>}
            </span>
            {row?.role && <span className="role">{row.role}</span>}
          </div>
          {row?.careers && (
            <a className="cmd-careers" href={row.careers} target="_blank" rel="noopener noreferrer" title="官方招聘页">
              💼
            </a>
          )}
        </div>

        {row && (
          <div className="cmd-meta">
            <span className="pill blue">{row.status}</span>
            <span className={pillClass(row.perm)} style={{ whiteSpace: "normal" }}
              dangerouslySetInnerHTML={{ __html: "PERM " + renderInline(row.perm, "pipeline") }} />
            {row.referral && (
              <span className={pillClass(row.referral)} style={{ whiteSpace: "normal" }}
                dangerouslySetInnerHTML={{ __html: "内推 " + renderInline(row.referral, "pipeline") }} />
            )}
          </div>
        )}

        {row?.next && (
          <div className="co-next">
            <span className="lbl">下一步</span>
            <span className="val" dangerouslySetInnerHTML={{ __html: renderInline(row.next, "pipeline") }} />
          </div>
        )}

        {dates.length > 0 && (
          <div className="co-dates">
            <span className="dlabel">关键日期</span>
            {dates.map((d, i) => {
              const dd = daysTo(d.date);
              const cls = dd < 0 ? "past" : dd <= 3 ? "soon" : "";
              const rel = dd < 0 ? `${-dd} 天前` : dd === 0 ? "今天" : `${dd} 天后`;
              return (
                <div className="co-date-row" key={i}>
                  <span className={`d ${cls}`}>{d.date.slice(5)} <span className="muted" style={{ fontWeight: 500 }}>· {rel}</span></span>
                  <span className="lab">{cleanEvt(d.label)}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="co-links">
          {briefs.map((b) => (
            <Link key={b.id} className="co-link primary" href={`/docs/prep/briefs/${b.id}`}>
              {ARROW} {b.label}
            </Link>
          ))}
          {hasNote && (
            <Link className="co-link" href={`/docs/prep/company-notes/${slug}`}>
              面经笔记
            </Link>
          )}
          {row?.careers && (
            <a className="co-link" href={row.careers} target="_blank" rel="noopener noreferrer">
              官方招聘页 ↗
            </a>
          )}
          <Link className="co-link" href="/pipeline">看全部公司</Link>
        </div>
      </section>

      {row && (
        <QuickPanel slug={slug} companyCell={row.company} companyName={name} status={row.status} next={row.next} />
      )}

      <div className="card">
        <Prose
          html={renderMarkdown(md, "pipeline/companies")}
          path={`pipeline/companies/${slug}.md`}
          tasks={getTaskLines(md).map((t) => ({ text: t.text, checked: t.checked }))}
        />
      </div>
    </>
  );
}
