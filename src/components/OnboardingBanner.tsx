"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "jh_onboarding_dismissed";

/**
 * 首页顶部「新手上路」横幅。
 * unconfigured（data/profile.json 仍是模板态）时变成更强的「开始设置」召唤，且不可关闭，
 * 引导用户先用 /onboard 向导把它变成自己的；配置完成后回到可关闭的提示。
 */
export default function OnboardingBanner({ unconfigured = false }: { unconfigured?: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(unconfigured || localStorage.getItem(KEY) !== "1");
  }, [unconfigured]);
  if (!show) return null;
  return (
    <div
      className="card section"
      style={{
        display: "flex",
        gap: 16,
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "space-between",
        borderLeft: "3px solid var(--accent, #5E9A78)",
      }}
    >
      <div style={{ flex: "1 1 280px", minWidth: 260 }}>
        <div className="card-title" style={{ marginBottom: 4 }}>
          {unconfigured ? "🚀 开始设置" : "👋 新手上路"}
        </div>
        <div className="muted small">
          {unconfigured ? (
            <>
              这个仓库还是<strong>模板态</strong>。用 <Link href="/onboard">/onboard</Link>{" "}
              向导回答几个问题（目标角色 / 级别 / 目标公司 / 名字），就会把站点个性化成你的、并选好对应角色的备战模板。
              也可以把仓库交给 <strong>Claude / Codex</strong>，按 <code>SETUP.md</code> 引导你装依赖、部署到 Vercel、配密码与 PAT。
            </>
          ) : (
            <>
              这是一个「你 + Claude」协作的求职指挥台 —— 仓库里的 markdown 就是数据库，网站只是看板。改完直接 push，Vercel 自动重建上线。
            </>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Link className="btn-primary" href="/onboard">
          {unconfigured ? "开始设置 →" : "重跑上手向导"}
        </Link>
        {!unconfigured && (
          <button
            className="btn-ghost"
            onClick={() => {
              localStorage.setItem(KEY, "1");
              setShow(false);
            }}
          >
            知道了
          </button>
        )}
      </div>
    </div>
  );
}
