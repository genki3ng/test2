import type { Metadata } from "next";
import Link from "next/link";
import { getTracker, getOpenings, pillClass } from "@/lib/data";
import { renderInline } from "@/lib/markdown";
import StatusCell from "./StatusCell";
import PipelineCompanyJobs, { PipelineJob } from "./PipelineCompanyJobs";
import LivePipeline, { LiveBadge, StatusHint } from "./LivePipeline";

export const metadata: Metadata = { title: "公司" };

// 按求职旅程的「阶段」分组（比按数据类型的表格更贴 pipeline 的心智 = 推进/移动）。
// 顺序 = 越靠后越深，最深的（Offer）在最上，给士气。每家落入第一个匹配的阶段。
const STAGES = [
  { key: "offer", label: "Offer · 谈判", color: "var(--sage)", test: (s: string) => /offer|negotiation|decision|入职/i.test(s) },
  { key: "interview", label: "面试中", color: "var(--coral)", test: (s: string) => /phone|onsite|panel|首轮|终面|interview/i.test(s) },
  { key: "recruiter", label: "招聘电话 / Screen", color: "var(--amber)", test: (s: string) => /recruiter|screen/i.test(s) },
  { key: "submitted", label: "已投 · 内推", color: "var(--plum)", test: (s: string) => /applied|referral|已投|内推/i.test(s) },
  { key: "watching", label: "在追 · 观察", color: "var(--ink-faint)", test: () => true },
];
const stageOf = (status: string) => STAGES.find((st) => st.test(status))?.key ?? "watching";

const GRADS = [
  "linear-gradient(150deg,#25303B,#3A4854)",
  "linear-gradient(150deg,#5E9A78,#7CB893)",
  "linear-gradient(150deg,#6A5AC2,#8678D8)",
  "linear-gradient(150deg,#C8392F,#E05044)",
  "linear-gradient(150deg,#3A6EA5,#5B8FD0)",
  "linear-gradient(150deg,#E8674C,#F08A5D)",
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

export default function PipelinePage() {
  const tracker = getTracker();
  const slugs = tracker.map((r) => r.slug).filter((s): s is string => !!s);

  // 各公司「会投的岗」= 📌 投递清单（来自 /jobs 的 pin），按 slug 聚合
  const pinnedBySlug = new Map<string, PipelineJob[]>();
  for (const o of getOpenings()) {
    if (!o.pinned || o.excluded) continue;
    const arr = pinnedBySlug.get(o.slug) ?? [];
    arr.push({
      anchor: o.anchor,
      title: o.title,
      location: o.location,
      stars: o.stars,
      hot: o.hot,
      attitude: o.attitude,
      appStatus: o.appStatus,
    });
    pinnedBySlug.set(o.slug, arr);
  }

  const tierName = ["", "一", "二", "三"];

  return (
    <LivePipeline slugs={slugs}>
      <h1 className="page-title">🏢 公司</h1>
      <p className="page-sub">
        按<b>旅程阶段</b>看每家公司（不再是一张表）——一眼知道谁在推进、谁卡住、球在谁手里。卡内可直接改状态、标投递进度。源文件：
        <Link href="/docs/pipeline/tracker"> pipeline/tracker.md</Link>。徽章 <span className="tier-badge tier-1">一</span>
        <span className="tier-badge tier-2">二</span><span className="tier-badge tier-3">三</span> = 想去程度。
      </p>

      <div className="board">
        {STAGES.map((st) => {
          const rows = tracker
            .filter((r) => stageOf(r.status) === st.key)
            .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
          if (!rows.length) return null;
          return (
            <section className="stage-group" key={st.key}>
              <div className="stage-head" style={{ color: st.color }}>
                <span className="st-dot" style={{ background: st.color }} />
                <h2 style={{ color: "var(--ink)" }}>{st.label}</h2>
                <span className="st-count">{rows.length} 家</span>
              </div>
              <div className="cmd-grid">
                {rows.map((r) => {
                  const pinned = (r.slug && pinnedBySlug.get(r.slug)) || [];
                  return (
                    <div className="cmd-card" key={r.name}>
                      <div className="cmd-head">
                        <span className="logo" style={{ backgroundImage: gradFor(r.name) }}>
                          {initials(r.name)}
                        </span>
                        <div className="cmd-id">
                          <span className="nm">
                            {r.slug ? <Link href={`/companies/${r.slug}`}>{r.name}</Link> : r.name}
                            <span className={`tier-badge tier-${r.tier}`}>{tierName[r.tier]}</span>
                          </span>
                          <span className="role">{r.role}</span>
                        </div>
                        {r.careers && (
                          <a className="cmd-careers" href={r.careers} target="_blank" rel="noopener noreferrer" title="官方招聘页">
                            💼
                          </a>
                        )}
                      </div>

                      <div className="cmd-meta">
                        <StatusCell companyCell={r.company} companyName={r.name} status={r.status} />
                        <span
                          className={pillClass(r.perm)}
                          style={{ whiteSpace: "normal" }}
                          dangerouslySetInnerHTML={{ __html: renderInline(r.perm, "pipeline") }}
                        />
                        <StatusHint slug={r.slug ?? ""} initial={pinned} />
                      </div>

                      {r.referral && (
                        <div className="cmd-ref">
                          <span className="lbl">内推</span>
                          <span
                            className={pillClass(r.referral)}
                            style={{ whiteSpace: "normal" }}
                            dangerouslySetInnerHTML={{ __html: renderInline(r.referral, "pipeline") }}
                          />
                        </div>
                      )}

                      {r.next && (
                        <div className="cmd-next" dangerouslySetInnerHTML={{ __html: renderInline(r.next, "pipeline") }} />
                      )}

                      {r.slug && <PipelineCompanyJobs slug={r.slug} companyName={r.name} jobs={pinned} />}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <p className="muted small" style={{ marginTop: 22 }}>
        符号：🟢 友好 · 🟡 待核/有保留 · 🔴 风险 · 👑 day-1 PERM · ✅ 已确认。卡片按状态自动归入阶段（改状态后下次重建重新归位）。
      </p>
      <LiveBadge />
    </LivePipeline>
  );
}
