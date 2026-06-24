"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getToken, ghGetFile } from "@/lib/githubClient";
import { parseCompanyOpenings } from "@/lib/parse";
import type { PipelineJob } from "./PipelineCompanyJobs";

/**
 * pipeline 实时层（同 LiveInbox 模式）：构建快照先显示；配 token 的浏览器挂载后
 * 直接读仓库 tracker.md + 各公司文件，把「状态」与「📌 会投的岗」刷成最新——
 * 刚在 /jobs 点的 📌、刚改的状态不用等 Vercel 重建。无 token 保持快照。
 */
interface LiveData {
  status: Record<string, string>; // 公司名 → tracker 状态列（实时）
  jobs: Record<string, PipelineJob[]>; // slug → 📌 非排除岗（实时）
  live: boolean;
}

const EMPTY: LiveData = { status: {}, jobs: {}, live: false };
const Ctx = createContext<LiveData>(EMPTY);

export function useLivePipeline(): LiveData {
  return useContext(Ctx);
}

export default function LivePipeline({
  slugs,
  children,
}: {
  slugs: string[];
  children: ReactNode;
}) {
  const [data, setData] = useState<LiveData>(EMPTY);

  useEffect(() => {
    if (!getToken()) return;
    let on = true;
    (async () => {
      try {
        const [trk, ...companies] = await Promise.all([
          ghGetFile("data/tracker.json"),
          ...slugs.map((s) => ghGetFile(`pipeline/companies/${s}.md`)),
        ]);
        if (!on) return;
        const status: Record<string, string> = {};
        if (trk) {
          try {
            const data = JSON.parse(trk.content) as { companies: Array<{ name: string; status: string }> };
            for (const c of data.companies ?? []) status[c.name] = c.status;
          } catch {
            /* JSON 坏了就不覆盖快照 */
          }
        }
        const jobs: Record<string, PipelineJob[]> = {};
        slugs.forEach((s, i) => {
          const f = companies[i];
          if (!f) return;
          jobs[s] = parseCompanyOpenings(f.content)
            .filter((o) => o.pinned && !o.excluded)
            .map((o) => ({
              anchor: o.anchor,
              title: o.title,
              location: o.location,
              stars: o.stars,
              hot: o.hot,
              attitude: o.attitude,
              appStatus: o.appStatus,
            }));
        });
        setData({ status, jobs, live: true });
      } catch {
        /* 实时读失败就保留构建时快照 */
      }
    })();
    return () => {
      on = false;
    };
    // slugs 来自构建期 tracker，页面生命周期内不变
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

/** 页脚实时角标（同 LiveInbox 文案风格） */
export function LiveBadge() {
  const { live } = useLivePipeline();
  const [hasToken, setHasToken] = useState(false);
  useEffect(() => setHasToken(!!getToken()), []);
  return (
    <p className="muted small" style={{ margin: "6px 0 0" }}>
      {live
        ? "↻ 实时（直接读仓库：状态与 📌 子条目为最新，刚在 /jobs 点的 📌 立即可见）"
        : hasToken
        ? "↻ 实时读取中…（失败则显示构建快照）"
        : "状态/📌 为构建时快照——你的修改已即时提交，约 1 分钟重建后同步；配 token 后此页变实时"}
    </p>
  );
}

/** 状态格下的 💡 投递进度提示（实时版：据该公司 📌 岗的最新进度） */
export function StatusHint({
  slug,
  initial,
}: {
  slug: string;
  initial: PipelineJob[];
}) {
  const { jobs, live } = useLivePipeline();
  const cur = (live && jobs[slug]) || initial;
  const has = (s: string) => cur.some((j) => j.appStatus === s);
  const hint = has("offer")
    ? "🏆 有 Offer"
    : has("interview")
    ? "🗣️ 面试中"
    : has("applied")
    ? "📮 已投岗"
    : "";
  if (!hint) return null;
  return (
    <div
      className="muted small"
      style={{ marginTop: 3 }}
      title="据该公司 📌 岗的投递进度自动提示（不改你的状态选择）"
    >
      💡 {hint}
    </div>
  );
}
