"use client";

import { useEffect, useState } from "react";
import {
  getToken,
  saveTrackerNext,
  saveQuickNote,
} from "@/lib/githubClient";
import StatusCell from "@/app/pipeline/StatusCell";

/** 公司详情页快改：状态 / 下一步（写 tracker.md 对应行）+ 快记（追加公司文件） */
export default function QuickPanel({
  slug,
  companyCell,
  companyName,
  status,
  next,
}: {
  slug: string;
  companyCell: string;
  companyName: string;
  status: string;
  next: string;
}) {
  const [canWrite, setCanWrite] = useState(false);
  const [nextVal, setNextVal] = useState(next);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setCanWrite(!!getToken()), []);
  if (!canWrite) return null;

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 5000);
  };

  const saveNext = async () => {
    if (nextVal.trim() === next.trim() || busy) return;
    setBusy(true);
    try {
      await saveTrackerNext(companyCell, companyName, nextVal.trim());
      flash("✓ 下一步已 commit");
    } catch (e) {
      flash(`✗ ${e instanceof Error ? e.message : "失败"}`);
    } finally {
      setBusy(false);
    }
  };

  const saveNote = async () => {
    if (!note.trim() || busy) return;
    setBusy(true);
    try {
      await saveQuickNote(slug, note.trim());
      setNote("");
      flash("✓ 快记已 commit（文件末尾「快记」段，Claude 会归位）");
    } catch (e) {
      flash(`✗ ${e instanceof Error ? e.message : "失败"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card section quick-panel">
      <div className="card-title">⚡ 快改（直接 commit）</div>
      <div className="quick-row">
        <label>状态</label>
        <StatusCell companyCell={companyCell} companyName={companyName} status={status} />
      </div>
      <div className="quick-row">
        <label>下一步</label>
        <input
          className="field"
          value={nextVal}
          onChange={(e) => setNextVal(e.target.value)}
          placeholder="如：⏰06-20 follow up Shawn"
        />
        <button className="btn mini" onClick={saveNext} disabled={busy}>
          保存
        </button>
      </div>
      <div className="quick-row">
        <label>快记</label>
        <input
          className="field"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="随手一句（带日期追加到本公司文件，Claude 定期归位）"
        />
        <button className="btn mini" onClick={saveNote} disabled={busy || !note.trim()}>
          追加
        </button>
      </div>
      <p className="muted small" style={{ margin: "6px 0 0" }}>
        提示：「下一步」用 <code>⏰MM-DD</code> 开头会自动进 <a href="/agenda">日程</a>。
      </p>
      {msg && <div className="save-msg">{msg}</div>}
    </div>
  );
}
