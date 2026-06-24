"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export interface GuideWeek {
  start: string;
  end: string;
  label: string;
  open: number;
  first: string;
}

/**
 * 今日 SOP 步骤条：固定四步（学习→练习→内推→收尾），每步按仓库数据自动算完成态，
 * 👉 指向第一个未完成步骤。规则全文 → prep/daily-routine.md。
 */
export default function DailyGuide({
  weeks,
  practiceDates,
  referralStatuses,
  pendingOpen,
  inboxCount,
  pinnedJobs,
}: {
  weeks: GuideWeek[];
  practiceDates: string[];
  referralStatuses: string[];
  pendingOpen: number;
  inboxCount: number;
  pinnedJobs: number; // 📌 投递清单岗位数
}) {
  const [today, setToday] = useState("");
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);
  if (!today) return null;

  const week =
    weeks.find((w) => today >= w.start && today <= w.end) ??
    weeks.find((w) => today < w.start) ??
    weeks[weeks.length - 1];
  const practicedToday = practiceDates.filter((d) => d === today).length;
  const stale = referralStatuses.filter((s) => {
    const d = s.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    if (!d || s.startsWith("已投递")) return false;
    return (new Date(today).getTime() - new Date(d).getTime()) / 86400000 >= 3;
  }).length;

  const steps = [
    {
      icon: "🧠",
      title: "冲刺学习",
      time: "60–90 分钟",
      done: !week || week.open === 0,
      detail:
        week && week.open > 0
          ? `本周剩 ${week.open} 项 · 下一项：${week.first}`
          : "本周任务已清空 🎉",
      href: "#today",
      cta: "去今日聚焦",
    },
    {
      icon: "🎤",
      title: "练习台 1 题",
      time: "15 分钟",
      done: practicedToday > 0,
      detail:
        practicedToday > 0
          ? `今天已练 ${practicedToday} 题 ✓`
          : "抽 1 题 → 先口述 → 对要点自评",
      href: "/practice",
      cta: "去抽题",
    },
    pinnedJobs === 0
      ? {
          icon: "🤝",
          title: "定投递清单",
          time: "15 分钟",
          done: false,
          detail: "清单还是空的——把想投的岗 📌 起来，内推邮件才有的放矢",
          href: "/jobs?pinned",
          cta: "去岗位库选岗",
        }
      : {
          icon: "🤝",
          title: "内推推进",
          time: "10 分钟",
          done: stale === 0,
          detail:
            stale > 0
              ? `${stale} 条渠道超 3 天没动静 → 催 / 换`
              : `清单 📌${pinnedJobs} 岗 · 没有要催的渠道，按渠道发邮件即可`,
          href: "/referrals",
          cta: "去发内推邮件",
        },
    {
      icon: "📨",
      title: "收尾巡检",
      time: "5 分钟",
      done: pendingOpen === 0 && inboxCount === 0,
      detail:
        [
          pendingOpen ? `${pendingOpen} 项待拍板` : "",
          inboxCount ? `收件箱 ${inboxCount} 条` : "",
        ]
          .filter(Boolean)
          .join(" · ") || "没有挂起事项；有新面经/JD 用扩展收进 inbox",
      href: "#decide",
      cta: "去拍板",
    },
  ];
  const current = steps.findIndex((s) => !s.done);

  return (
    <div className="card section">
      <div className="card-title">
        🤖 今日 SOP · 照着做就行
        <Link className="more" href="/docs/prep/daily-routine">
          规则与例外 →
        </Link>
      </div>
      <ol className="sop-steps">
        {steps.map((s, i) => (
          <li key={s.title} className={s.done ? "done" : i === current ? "now" : ""}>
            <div className="sop-head">
              <span className="sop-num">{s.done ? "✓" : i + 1}</span>
              <b>
                {s.icon} {s.title}
              </b>
              <span className="muted small">{s.time}</span>
            </div>
            <div className="sop-detail small">{s.detail}</div>
            {!s.done && (
              <Link className="sop-go small" href={s.href}>
                {i === current ? "👉 " : ""}
                {s.cta} →
              </Link>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
