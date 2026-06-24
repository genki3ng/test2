"use client";

import { useEffect, useState } from "react";
import {
  getToken,
  saveOpeningPin,
  saveOpeningAppStatus,
  autoAdvanceReferralOnApply,
  type AppStatus,
} from "@/lib/githubClient";
import { useLivePipeline } from "./LivePipeline";

export interface PipelineJob {
  anchor: string; // 写回定位（行内链接或标题）
  title: string;
  location: string;
  stars: number;
  hot: boolean;
  attitude: "" | "love" | "no";
  appStatus: AppStatus;
}

const STATUS_OPTS: { value: AppStatus; label: string }[] = [
  { value: "", label: "待投" },
  { value: "applied", label: "📮 已投" },
  { value: "interview", label: "🗣️ 面试中" },
  { value: "offer", label: "🏆 Offer" },
  { value: "rejected", label: "🛑 被拒" },
];
const ATT_ICON: Record<string, string> = { love: "💚", no: "🚫", "": "" };

export default function PipelineCompanyJobs({
  slug,
  companyName,
  jobs: initial,
}: {
  slug: string;
  companyName: string;
  jobs: PipelineJob[];
}) {
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState(initial);
  const [dirty, setDirty] = useState(false); // 本会话改过 → 不被实时数据覆盖
  const [statusOv, setStatusOv] = useState<Record<string, AppStatus>>({});
  const [canWrite, setCanWrite] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const { jobs: liveJobs, live } = useLivePipeline();
  const fresh = liveJobs[slug];

  useEffect(() => setCanWrite(!!getToken()), []);

  // 实时层：该公司 📌 岗最新清单到了且本会话没改过 → 替换构建快照
  // （刚在 /jobs 点的 📌 不等重建就出现在这里）
  useEffect(() => {
    if (live && fresh && !dirty) setJobs(fresh);
  }, [live, fresh, dirty]);

  if (!jobs.length) return null;

  const statusOf = (j: PipelineJob) => statusOv[j.anchor] ?? j.appStatus;
  const appliedCount = jobs.filter((j) => statusOf(j) && statusOf(j) !== "rejected").length;

  const setStatus = async (j: PipelineJob, v: AppStatus) => {
    if (!canWrite || busy) return;
    setDirty(true);
    setBusy(j.anchor);
    setStatusOv((o) => ({ ...o, [j.anchor]: v }));
    setMsg("提交中…");
    try {
      await saveOpeningAppStatus(slug, j.anchor, v, j.title);
      let extra = "";
      if (v === "applied") {
        // D 已在 saveOpeningAppStatus 里记了投递台账；E 尝试联动内推状态
        try {
          const advanced = await autoAdvanceReferralOnApply(companyName);
          if (advanced) extra = ` · 内推「${advanced}」→已投递`;
        } catch {
          /* 内推联动 best-effort，失败忽略 */
        }
        extra = " · 已记投递台账" + extra;
      }
      setMsg("已更新（约 1 分钟后全站同步）" + extra);
    } catch (e) {
      setStatusOv((o) => ({ ...o, [j.anchor]: j.appStatus }));
      setMsg(`✗ ${e instanceof Error ? e.message : "失败"}`);
    } finally {
      setBusy("");
      setTimeout(() => setMsg(""), 5000);
    }
  };

  const remove = async (j: PipelineJob) => {
    if (!canWrite || busy) return;
    if (!confirm(`从 pipeline 移除「${j.title}」？（= 取消 📌 投递清单标记）`)) return;
    setDirty(true);
    setBusy(j.anchor);
    setMsg("移除中…");
    try {
      await saveOpeningPin(slug, j.anchor, false, j.title);
      setJobs((js) => js.filter((x) => x.anchor !== j.anchor));
      setMsg("已移出 pipeline");
    } catch (e) {
      setMsg(`✗ ${e instanceof Error ? e.message : "失败"}`);
    } finally {
      setBusy("");
      setTimeout(() => setMsg(""), 5000);
    }
  };

  return (
    <div className="pl-jobs">
      <button className="pl-jobs-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? "▾" : "▸"} 📋 {jobs.length} 个会投的岗
        {appliedCount ? ` · 已投 ${appliedCount}` : ""}
      </button>
      {open && (
        <div className="pl-jobs-list">
          {msg && <span className="small muted">{msg}</span>}
          {jobs.map((j) => {
            const isUrl = /^https?:\/\//.test(j.anchor);
            return (
              <div className="pl-job-row" key={j.anchor}>
                <select
                  className="pl-job-status"
                  value={statusOf(j)}
                  disabled={!canWrite || !!busy}
                  onChange={(e) => setStatus(j, e.target.value as AppStatus)}
                  title={canWrite ? "投递进度" : "在 ⚙️ 设置配 token 后可改"}
                >
                  {STATUS_OPTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <span className="pl-job-title">
                  {j.hot ? "🎯" : ""}
                  {"⭐".repeat(j.stars)}
                  {ATT_ICON[j.attitude]} {j.title}
                </span>
                {j.location && <span className="muted small">{j.location}</span>}
                {isUrl && (
                  <a href={j.anchor} target="_blank" rel="noopener noreferrer" title="打开 JD">
                    ↗
                  </a>
                )}
                <button
                  className="pl-job-remove"
                  disabled={!canWrite || !!busy}
                  onClick={() => remove(j)}
                  title={canWrite ? "从 pipeline 移除（取消 📌）" : "需配 token"}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
