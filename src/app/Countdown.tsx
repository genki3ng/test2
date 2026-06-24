"use client";

import { useEffect, useState } from "react";

const TARGET = new Date(2026, 8, 1); // 2026-09-01 offer 目标
const START = new Date(2026, 5, 2); // 2026-06-02 冲刺起点
const R = 54;
const C = 2 * Math.PI * R;

/** 倒计时环 + on-track 判定。interviews = 当前在面试中的家数（用于 on-track 文案）。 */
export default function Countdown({ interviews = 0 }: { interviews?: number }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const ph = now == null; // 预渲染占位，避免水合闪烁
  const ms = 86400000;
  const daysLeft = ph ? 0 : Math.max(0, Math.ceil((TARGET.getTime() - now!.getTime()) / ms));
  const total = Math.round((TARGET.getTime() - START.getTime()) / ms);
  const elapsed = Math.min(Math.max(total - daysLeft, 0), total);
  const pct = total > 0 ? elapsed / total : 0;
  const weeks = Math.max(1, Math.ceil(daysLeft / 7));
  const onTrack = interviews >= 2 || daysLeft > 35;

  return (
    <section className="tile countdown c4">
      <div className="ring-wrap">
        <div className="ring">
          <svg width="122" height="122" viewBox="0 0 122 122">
            <circle cx="61" cy="61" r={R} fill="none" stroke="var(--line)" strokeWidth="12" />
            <circle
              cx="61"
              cy="61"
              r={R}
              fill="none"
              stroke="url(#cg)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={ph ? C : C * (1 - pct)}
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
            <defs>
              <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f08a5d" />
                <stop offset="1" stopColor="#e8674c" />
              </linearGradient>
            </defs>
          </svg>
          <div className="ring-center">
            <span className="num">{ph ? "·" : daysLeft}</span>
            <span className="unit">天</span>
          </div>
        </div>
        <div className="meta">
          <h3>
            距 9/1<br />offer 目标
          </h3>
          <p>
            {weeks} 周冲刺
            <br />已走 {Math.round(pct * 100)}%
          </p>
          <div className="goalrow">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 3v18M5 4h13l-3 4 3 4H5" />
            </svg>
            {onTrack ? "准时可达" : "时间偏紧"}
          </div>
        </div>
      </div>

      <div className={"ontrack" + (onTrack ? "" : " warn")}>
        <span className="badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d={onTrack ? "m5 12 5 5L20 6" : "M12 8v5M12 17v.01"} />
          </svg>
        </span>
        <div className="t">
          <b>{onTrack ? "进度正常" : "抓紧节奏"}</b>
          <span>{interviews > 0 ? `${interviews} 家在面试中` : "把下一步推进起来"}</span>
        </div>
      </div>
    </section>
  );
}
