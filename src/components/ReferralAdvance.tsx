"use client";

import { useEffect, useState } from "react";
import { getToken, saveReferralStatus, nowStamp } from "@/lib/githubClient";

const FLOW = ["找到", "已联系", "已发材料", "已提交内推", "已投递"];

/** 内推状态推进：点一下进入下一态并自动盖日期（直接 commit referrals.md） */
export default function ReferralAdvance({
  firstCell,
  status,
}: {
  firstCell: string;
  status: string;
}) {
  const [cur, setCur] = useState(status);
  const [canWrite, setCanWrite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => setCanWrite(!!getToken()), []);

  const base = FLOW.find((s) => cur.startsWith(s)) ?? "";
  const next = base ? FLOW[FLOW.indexOf(base) + 1] : FLOW[0];
  const dateInCur = cur.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  const daysSince = dateInCur
    ? Math.round((Date.now() - new Date(dateInCur).getTime()) / 86400000)
    : null;

  const advance = async () => {
    if (!next || busy) return;
    const stamped = `${next}(${nowStamp().date})`;
    const prev = cur;
    setCur(stamped);
    setBusy(true);
    setErr("");
    try {
      await saveReferralStatus(firstCell, stamped);
    } catch (e) {
      setCur(prev);
      setErr(e instanceof Error ? e.message : "失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span style={{ whiteSpace: "nowrap" }}>
      <span className={base === "已投递" ? "pill green" : "pill blue"}>{cur}</span>
      {daysSince !== null && daysSince >= 3 && base !== "已投递" && (
        <span className="pill amber" title="超过 3 天，考虑催/换渠道">
          {daysSince} 天
        </span>
      )}
      {canWrite && next && (
        <button className="btn mini" disabled={busy} onClick={advance} title={`推进到「${next}」并盖今天日期`}>
          {busy ? "…" : `→ ${next}`}
        </button>
      )}
      {err && <span className="small" style={{ color: "var(--red)" }} title={err}> ✗</span>}
    </span>
  );
}
