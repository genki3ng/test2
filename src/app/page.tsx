import Link from "next/link";
import Countdown from "./Countdown";
import Greeting from "@/components/Greeting";
import OnboardingBanner from "@/components/OnboardingBanner";
import {
  getTracker,
  getOpenings,
  getReferrals,
  getJds,
  getSprintProgress,
  getAgenda,
  getHandoffPending,
  getSiteConfig,
  isUnconfigured,
} from "@/lib/data";

const DOW = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const stripMd = (s: string) =>
  s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*`~]/g, "").trim();
const cleanEvt = (s: string) =>
  stripMd(s).replace(/^[\s⏰✅🗓️📅🔔➡️→]+/u, "").trim();

/** 公司在管道里的进度档位（0=观察 … 5=offer） */
function stage(status: string): number {
  const s = status.toLowerCase();
  if (/offer|入职/.test(s)) return 5;
  if (/onsite|panel|终面|onsite/.test(s)) return 4;
  if (/phone|首轮|1st|interview|面试/.test(s)) return 3;
  if (/recruiter|screen|招聘|电话/.test(s)) return 2;
  if (/applied|referral|已投|内推/.test(s)) return 1;
  return 0;
}

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
function dateBlock(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return { dow: DOW[dt.getDay()], dnum: String(d), mon: `${m}月` };
}
function whenLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DOW[dt.getDay()]} · ${m}/${d}`;
}

const PHASES = ["定位", "铺管道", "备战", "谈判", "收尾"];
const ICON = {
  clock: "M12 7v5l3 2",
  check: "M9 11l3 3L22 4",
  cal: "M3 9h18M8 2v4M16 2v4",
  bolt: "m13 2-1 9h7l-8 11 1-9H5z",
};

export default function Today() {
  const tracker = getTracker();
  const openings = getOpenings();
  const referrals = getReferrals();
  const jds = getJds();
  const sprint = getSprintProgress();
  const agenda = getAgenda();
  const pending = getHandoffPending();

  const t = new Date();
  const todayStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(
    t.getDate()
  ).padStart(2, "0")}`;
  const upcoming = agenda.filter((a) => a.date >= todayStr);

  // —— 阶段 ——
  const maxStage = tracker.reduce((m, r) => Math.max(m, stage(r.status)), 0);
  const current = maxStage >= 5 ? 4 : maxStage >= 2 ? 3 : maxStage >= 1 ? 2 : 1; // 1..5

  // —— 漏斗（进入管道后走多远，累计） ——
  const ranks = tracker.map((r) => stage(r.status));
  const fc = (min: number) => ranks.filter((r) => r >= min).length;
  const funnel = [
    { l: "投递", v: fc(1) },
    { l: "招聘电话", v: fc(2) },
    { l: "首轮", v: fc(3) },
    { l: "onsite", v: fc(4) },
    { l: "offer", v: fc(5) },
  ];
  const interviewing = fc(2);

  // —— 真正的「事件」（面试 / 截止），过滤掉已完成的动作日志 ——
  const EVENT_RE =
    /screen|电话|面试|面谈|首轮|终面|1st\s*round|onsite|panel|interview|codepair|case|assessment|coding|hackerrank|谈判|deadline|截止|offer\b/i;
  const LOG_RE = /网申|已投|已发|已交|已提交|已联系|现刷|nudge|无音|内推已|materials?\s*sent|applied|发出|发材料/i;
  const events = upcoming.filter((a) => EVENT_RE.test(a.label) && !LOG_RE.test(a.label));

  // —— 唯一下一步 ——
  const next = events[0];
  const nextCo = next ? tracker.find((r) => r.slug === next.slug) : undefined;
  const isInterview = !!next;
  const nextJd = nextCo ? jds.find((j) => j.title.toLowerCase().includes(nextCo.name.toLowerCase())) : undefined;

  // —— 该你出手了 ——
  const active = tracker.filter((r) => stage(r.status) >= 1 && r.slug !== next?.slug);
  const dateForSlug = (slug: string | null) => (slug ? upcoming.find((x) => x.slug === slug)?.date ?? "" : "");
  active.sort((a, b) => {
    const da = dateForSlug(a.slug);
    const db = dateForSlug(b.slug);
    if (da && db) return da.localeCompare(db);
    if (da !== db) return da ? -1 : 1;
    return stage(b.status) - stage(a.status);
  });
  const moves = active.slice(0, 5).map((r) => {
    const nx = r.next;
    const ball = /安排中|待发|待回|availability|待提供|该你|球在你|待用户|未发/.test(nx);
    let tag = { cls: "wait", txt: "等回复" };
    let label = r.status.toLowerCase().includes("referral") ? "等内推回复" : "等 recruiter";
    if (ball) {
      tag = { cls: "yours", txt: "球在你这边" };
      label = "该你回应";
    } else if (stage(r.status) >= 3) {
      tag = { cls: "prep", txt: "备战中" };
      label = "首轮面试";
    } else if (stage(r.status) === 2) {
      tag = { cls: "week", txt: "进行中" };
      label = "招聘电话";
    }
    const dm = nx.match(/(\d{1,2})\/(\d{1,2})/);
    if (dm) label += ` · ${dm[1]}/${dm[2]}`;
    return { r, tag, label, perm: /👑/.test(r.perm) };
  });

  // —— 本周战绩 ——
  const refSent = referrals.rows.filter((row) => /已发|已联系|已提交|已投|已推|确认/.test(row.join(" "))).length;
  const pins = openings.filter((o) => !o.excluded && o.pinned);
  const wins = [
    interviewing > 0 ? `${interviewing} 家进面试 / 电话` : "",
    "简历已定稿",
    refSent > 0 ? `${refSent} 条内推已发` : "",
    pins.length > 0 ? `${pins.length} 个岗已锁定` : "",
  ].filter(Boolean).slice(0, 4);

  // —— 也在今天 ——
  const waits = active.filter((r) => /applied|referral/.test(r.status.toLowerCase()));
  const todayList: { t: string; href: string; tag?: string }[] = [
    { t: "练 1 道题（15 分钟）", href: "/practice", tag: "SQL" },
  ];
  if (pending.open.length) todayList.push({ t: "拍板：" + stripMd(pending.open[0]).slice(0, 16) + "…", href: "/pipeline" });
  if (waits[0]) todayList.push({ t: `跟进 ${waits[0].name} 的进展`, href: `/companies/${waits[0].slug}` });

  // —— 统计 ——
  const activeOpenings = openings.filter((o) => !o.excluded).length;
  const pct = sprint.total ? Math.round((sprint.done / sprint.total) * 100) : 0;
  const greetSub =
    interviewing > 0
      ? `${interviewing} 家在面试中，势头正好 — 把下面那一件做掉，今天就赢了。`
      : "把下面那一件做掉，今天就有进展。";
  const cfg = getSiteConfig();

  return (
    <>
      <header className="head">
        <Greeting sub={greetSub} owner={cfg.ownerName} motto={cfg.motto} />
        <div className="today-pill">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="3" />
            <path d={ICON.cal} />
          </svg>
          {`${t.getFullYear()}年${t.getMonth() + 1}月${t.getDate()}日`}
        </div>
      </header>

      <OnboardingBanner unconfigured={isUnconfigured()} />

      {/* 阶段轨 */}
      <div className="rail">
        <span className="rail-label">你在这里</span>
        <div className="steps">
          {PHASES.map((p, i) => {
            const idx = i + 1;
            const cls =
              idx < current ? (idx === current - 1 ? "filled" : "done") : idx === current ? "active" : "";
            const small = cls === "done" ? "已完成" : cls === "filled" ? "进行中" : cls === "active" ? "你在这" : "未开始";
            return (
              <div className={`step ${cls}`} key={p}>
                <span className="dot">
                  {cls === "done" ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5L20 6" />
                    </svg>
                  ) : null}
                </span>
                <span className="txt">
                  <b>{p}</b>
                  <small>{small}</small>
                </span>
                {idx < PHASES.length && <span className="sbar" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* BENTO */}
      <div className="bento">
        {/* 唯一下一步 */}
        {next ? (
          <section className="tile hero c8">
            <div className="toprow">
              <span className="hero-eyebrow">
                <span className="pulse" />
                现在就做
              </span>
              <span className="when">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4l3 2" />
                </svg>
                {whenLabel(next.date)}
              </span>
            </div>
            <h2>{next.company ? `${next.company} · ${cleanEvt(next.label)}` : cleanEvt(next.label)}</h2>
            <div className="sub">
              {nextCo?.role && (
                <span className="chip">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  {stripMd(nextCo.role)}
                </span>
              )}
              {nextCo && /👑/.test(nextCo.perm) && (
                <span className="chip">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7l4 4 5-7 5 7 4-4v11H3z" />
                  </svg>
                  PERM day-1
                </span>
              )}
            </div>

            {isInterview && (
              <div className="mustask">
                <span className="lbl">三必问</span>
                <div className="qs">
                  <span>sub-team / 方向</span>
                  <span>sponsorship / 签证（如适用）</span>
                  <span>级别 + comp</span>
                </div>
              </div>
            )}

            <div className="actions">
              <Link className="btn-primary" href={next.slug ? `/companies/${next.slug}` : "/agenda"}>
                {isInterview ? "打开速备包" : "查看详情"}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link className="btn-ghost" href={nextJd ? `/intel` : "/pipeline"}>
                {nextJd ? "看 JD" : "看 pipeline"}
              </Link>
            </div>
          </section>
        ) : (
          <section className="tile hero c8 empty">
            <span className="hero-eyebrow">今日</span>
            <h2 style={{ marginTop: 14 }}>今天没有硬日程 — 做一道练习题，保持手感。</h2>
            <div className="actions">
              <Link className="btn-primary" href="/practice">
                去练习台
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </section>
        )}

        {/* 倒计时环 */}
        <Countdown interviews={interviewing} />

        {/* 也在今天 */}
        <section className="tile c4">
          <div className="tile-head">
            <span className="tile-title">
              <span className="ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </span>
              也在今天
            </span>
          </div>
          <ul className="checklist">
            {todayList.map((it, i) => (
              <li key={i}>
                <span className="txt">
                  <Link href={it.href}>{it.t}</Link>
                </span>
                {it.tag && <span className="tag-mini">{it.tag}</span>}
              </li>
            ))}
          </ul>
        </section>

        {/* 本周面试与截止 */}
        <section className="tile c5">
          <div className="tile-head">
            <span className="tile-title">
              <span className="ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="3" />
                  <path d={ICON.cal} />
                </svg>
              </span>
              本周面试与截止
            </span>
            <span className="tile-count">{events.length} 项</span>
          </div>
          {events.length ? (
            <ul className="events">
              {events.slice(0, 4).map((ev, i) => {
                const b = dateBlock(ev.date);
                return (
                  <li key={i} className={i === 0 ? "soonest" : ""}>
                    <div className="date">
                      <div className="dow">{b.dow}</div>
                      <div className="dnum">{b.dnum}</div>
                      <div className="mon">{b.mon}</div>
                    </div>
                    <div className="body">
                      <div className="ttl">
                        {ev.slug ? <Link href={`/companies/${ev.slug}`}>{ev.company || ev.label}</Link> : ev.company || ev.label}
                      </div>
                      <div className="desc">{cleanEvt(ev.label)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted">本周暂无硬日程 — 多铺管道、多练题。</p>
          )}
        </section>

        {/* 该你出手了 */}
        <section className="tile c7">
          <div className="tile-head">
            <span className="tile-title">
              <span className="ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={ICON.bolt} />
                </svg>
              </span>
              该你出手了
            </span>
            <Link className="more" href="/pipeline">
              全部公司 →
            </Link>
          </div>
          <ul className="moves">
            {moves.map(({ r, tag, label, perm }) => (
              <li key={r.slug || r.name}>
                <span className="logo" style={{ backgroundImage: gradFor(r.name) }}>
                  {initials(r.name)}
                </span>
                <div className="info">
                  <b>{r.slug ? <Link href={`/companies/${r.slug}`}>{r.name}</Link> : r.name}</b>
                  <span>{label}</span>
                </div>
                {perm && <span className="perm">PERM day-1</span>}
                <span className={`tag ${tag.cls}`}>
                  <span className="pip" />
                  {tag.txt}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* 本周战绩 */}
        <section className="tile wins c5">
          <span className="eyebrow">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
              <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 17h6M10 17v-3M14 17v-3M8 21h8" />
            </svg>
            本周战绩
          </span>
          <ul className="win-list">
            {wins.map((w, i) => (
              <li key={i}>
                <span className="tick">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12 5 5L20 6" />
                  </svg>
                </span>
                {w}
              </li>
            ))}
          </ul>
          <div className="cheer">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
            </svg>
            这一周很扎实 — 保持住。
          </div>
        </section>

        {/* 管道漏斗 */}
        <section className="tile c12">
          <div className="tile-head">
            <span className="tile-title">
              <span className="ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 4h18l-7 8v7l-4 2v-9z" />
                </svg>
              </span>
              管道漏斗
            </span>
            <Link className="more" href="/pipeline">
              进 pipeline →
            </Link>
          </div>
          <div className="funnel">
            {funnel.map((f, i) => (
              <div className={"fstep" + (f.v > 0 && i >= 2 ? " on" : "")} key={f.l}>
                <div className="fv">{f.v}</div>
                <div className="fl">{f.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 统计条 */}
        <section className="tile c12" style={{ padding: 0, background: "transparent", border: "none", boxShadow: "none" }}>
          <div className="grid grid-stats">
            <Link href="/pipeline" className="stat row">
              <span className="si">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21V8l6-4 6 4v13M15 21V11l6 4v6M3 21h18" />
                </svg>
              </span>
              <div>
                <div className="num">{tracker.length}</div>
                <div className="label">家在追</div>
              </div>
            </Link>
            <Link href="/jobs" className="stat row">
              <span className="si amber">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M2 13h20" />
                </svg>
              </span>
              <div>
                <div className="num">{activeOpenings}</div>
                <div className="label">个在招岗</div>
              </div>
            </Link>
            <Link href="/prep" className="stat row">
              <span className="si sage">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 17l6-6 4 4 8-8M21 7v6h-6" />
                </svg>
              </span>
              <div style={{ flex: 1 }}>
                <div className="num">{pct}%</div>
                <div className="label">冲刺进度</div>
                <div className="bar slim" style={{ marginTop: 6 }}>
                  <i style={{ width: `${pct}%` }} />
                </div>
              </div>
            </Link>
            <Link href="/referrals" className="stat row">
              <span className="si plum">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="7" r="3" />
                  <path d="M2 21v-1a6 6 0 0 1 12 0v1M16 4a3 3 0 0 1 0 6M22 21v-1a6 6 0 0 0-4-5.6" />
                </svg>
              </span>
              <div>
                <div className="num">{referrals.rows.length}</div>
                <div className="label">条内推渠道</div>
              </div>
            </Link>
          </div>
        </section>
      </div>

      <p className="muted small" style={{ marginTop: 18 }}>
        北极星：{cfg.northStar}。
        <Link href="/docs/profile/target"> 详情 →</Link>
      </p>
    </>
  );
}
