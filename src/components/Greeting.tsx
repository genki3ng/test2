"use client";

import { useEffect, useState } from "react";

const DOW = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/**
 * 时间感知问候语（客户端算，避免静态构建过期）。sub = 数据派生的一句鼓励。
 * owner / motto 由服务端（getSiteConfig）注入 —— 身份一律走配置，不写死（去标识化铁律）。
 */
export default function Greeting({ sub, owner, motto }: { sub: string; owner: string; motto: string }) {
  const [d, setD] = useState<Date | null>(null);
  useEffect(() => setD(new Date()), []);

  const hour = d ? d.getHours() : 9;
  const hello = !d ? "你好" : hour < 5 ? "夜深了" : hour < 11 ? "早安" : hour < 14 ? "午安" : hour < 18 ? "下午好" : "晚上好";
  const kicker = d ? `今日 · ${DOW[d.getDay()]}` : "今日";

  return (
    <div className="greeting">
      <div className="kicker">{kicker}</div>
      <h1>
        {hello}，{owner}。<span className="accent">{motto}</span>今天就推进一件大事。
      </h1>
      <p>{sub}</p>
    </div>
  );
}
