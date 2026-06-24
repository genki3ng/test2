"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AgendaItem } from "@/lib/data";

/** 日程时间轴（客户端算"几天后"，避免静态页日期过期） */
export default function AgendaList({
  items,
  limit,
  compact = false,
}: {
  items: AgendaItem[];
  limit?: number;
  compact?: boolean;
}) {
  const [today, setToday] = useState("");
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);
  if (!today) return null;

  const overdue = items.filter((i) => i.date < today);
  const upcoming = items.filter((i) => i.date >= today);
  const show = limit ? upcoming.slice(0, limit) : upcoming;
  const days = (d: string) =>
    Math.round((new Date(d).getTime() - new Date(today).getTime()) / 86400000);

  if (!items.length)
    return compact ? (
      <p className="muted small">
        近期无带日期的事项（面试/截止日期录入后自动聚合到这里）。
      </p>
    ) : (
      <p className="muted">
        暂无带日期的事项。约定：公司文件「关键日期」表填 <code>YYYY-MM-DD</code>，或
        tracker「下一步」用 <code>⏰MM-DD</code> 开头，这里就会自动聚合。
      </p>
    );

  const row = (i: AgendaItem, od = false) => (
    <li key={i.date + i.label + i.company} className="agenda-row">
      <span className={`agenda-date ${od ? "overdue" : days(i.date) <= 3 ? "soon" : ""}`}>
        {i.date.slice(5)}
        <em>{od ? `逾期 ${-days(i.date)} 天` : days(i.date) === 0 ? "今天" : `${days(i.date)} 天后`}</em>
      </span>
      <span>
        {i.slug ? <Link href={`/companies/${i.slug}`}>{i.company}</Link> : i.company}{" "}
        {i.label}
      </span>
    </li>
  );

  return (
    <ul className="agenda-list">
      {(compact ? overdue.slice(-3) : overdue).map((i) => row(i, true))}
      {show.map((i) => row(i))}
    </ul>
  );
}
