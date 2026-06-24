"use client";

import { useEffect, useState } from "react";
import { getToken, saveTrackerStatus } from "@/lib/githubClient";
import { useLivePipeline } from "./LivePipeline";

const STATUSES = [
  "researching",
  "referral",
  "applied",
  "recruiter",
  "phone",
  "onsite",
  "offer",
  "negotiation",
  "decision",
  "rejected",
  "withdrawn",
  "观察",
];

/** pipeline 状态列：有 token 时变成可改的下拉（直接 commit tracker.md） */
export default function StatusCell({
  companyCell,
  companyName,
  status,
}: {
  companyCell: string;
  companyName: string;
  status: string;
}) {
  const [cur, setCur] = useState(status);
  const [dirty, setDirty] = useState(false); // 本会话改过 → 不被实时数据覆盖
  const [editable, setEditable] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  const { status: liveStatus, live } = useLivePipeline();
  const liveVal = liveStatus[companyName];

  useEffect(() => {
    setEditable(!!getToken());
  }, []);

  // 实时层：tracker 最新状态到了且本会话没改过 → 替换构建快照
  useEffect(() => {
    if (live && liveVal && !dirty) setCur(liveVal);
  }, [live, liveVal, dirty]);

  if (!editable) return <span className="pill blue">{cur}</span>;

  const onChange = async (v: string) => {
    const prev = cur;
    setCur(v);
    setDirty(true);
    setState("saving");
    try {
      await saveTrackerStatus(companyCell, companyName, v);
      setState("done");
      setTimeout(() => setState("idle"), 4000);
    } catch (e) {
      setCur(prev);
      setErr(e instanceof Error ? e.message : "失败");
      setState("error");
      setTimeout(() => setState("idle"), 6000);
    }
  };

  return (
    <span style={{ whiteSpace: "nowrap" }}>
      <select
        className="status-select"
        value={STATUSES.includes(cur) ? cur : ""}
        disabled={state === "saving"}
        onChange={(e) => onChange(e.target.value)}
      >
        {!STATUSES.includes(cur) && <option value="">{cur}</option>}
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {state === "saving" && <span className="muted small"> …</span>}
      {state === "done" && <span className="small" style={{ color: "var(--green)" }}> ✓</span>}
      {state === "error" && <span className="small" style={{ color: "var(--red)" }} title={err}> ✗</span>}
    </span>
  );
}
