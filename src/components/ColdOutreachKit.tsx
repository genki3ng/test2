"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { OutreachTemplate } from "@/lib/data";
import { getToken, saveTrackerReferral } from "@/lib/githubClient";
import { fillTemplate, type KitJob } from "./ReferralKit";

export interface ColdTemplates {
  connect: OutreachTemplate | null; // LinkedIn 连接请求
  dm: OutreachTemplate | null; // LinkedIn 陌生人 DM
  friend: OutreachTemplate | null; // 熟人内推请求
}

type Path = "" | "linkedin" | "friend" | "giveup";

/** 解析 tracker Referral 列里的策略标记 → 展示 pill */
function decisionLabel(cell: string): { text: string; cls: string } | null {
  if (cell.includes("🔍")) return { text: "🔍 LinkedIn 找人中", cls: "pill blue" };
  if (cell.includes("🤝")) return { text: "🤝 熟人引荐中", cls: "pill amber" };
  if (cell.includes("✖")) return { text: "✖️ 已放弃 · 直接网申", cls: "pill gray" };
  return null;
}

/**
 * 缺内推公司的解决 flow：🔍 LinkedIn 冷启动（人脉搜索 + B 陌生人话术）/
 * 🤝 熟人（A 版话术）/ ✖️ 放弃 referral 直接网申。决策写回 tracker「Referral」列。
 */
export default function ColdOutreachKit({
  companyCell,
  name,
  currentReferralCell,
  jobs,
  templates,
}: {
  companyCell: string; // tracker 第一列原文（写回定位）
  name: string;
  currentReferralCell: string;
  jobs: KitJob[];
  templates: ColdTemplates;
}) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<Path>("");
  const [canWrite, setCanWrite] = useState(false);
  const [decision, setDecision] = useState(currentReferralCell);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => setCanWrite(!!getToken()), []);

  const ranked = jobs
    .slice()
    .sort(
      (a, b) =>
        Number(!!b.pinned) - Number(!!a.pinned) ||
        b.stars + (b.hot ? 3 : 0) - (a.stars + (a.hot ? 3 : 0))
    );
  const [sel, setSel] = useState<number[]>(() => {
    const pinnedIdx = ranked.map((j, i) => (j.pinned ? i : -1)).filter((i) => i >= 0);
    return pinnedIdx.length ? pinnedIdx : ranked.slice(0, 1).map((_, i) => i);
  });
  const picked = sel.map((i) => ranked[i]).filter(Boolean);

  const today = () => new Date().toISOString().slice(0, 10);
  const mark = async (val: string, note: string) => {
    if (!canWrite || busy) return;
    setBusy(true);
    setMsg("写入 tracker…");
    try {
      await saveTrackerReferral(companyCell, name, val);
      setDecision(val);
      setMsg(`✓ ${note}（已写进 tracker，约 1 分钟后全站更新）`);
    } catch (e) {
      setMsg(`✗ ${e instanceof Error ? e.message : "写入失败"}`);
    } finally {
      setBusy(false);
    }
  };

  const copy = async (what: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(""), 2500);
    } catch {
      setCopied("✗");
    }
  };

  const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
    name + " data scientist"
  )}`;
  const pill = decisionLabel(decision);

  const jobPicker = ranked.length > 0 && (
    <>
      <div className="small" style={{ fontWeight: 650, margin: "8px 0 2px" }}>
        提哪个岗（建议 1 个，📌 已预选）：
      </div>
      <ul className="task-list">
        {ranked.map((j, i) => (
          <li key={i} className="today-task">
            <input
              type="checkbox"
              checked={sel.includes(i)}
              onChange={() =>
                setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))
              }
            />
            <span>
              {j.pinned ? "📌" : ""}
              {j.hot ? "🎯" : ""}
              {"⭐".repeat(j.stars)} {j.title}
              {j.location ? <span className="muted">（{j.location}）</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </>
  );

  const textBlock = (label: string, tpl: OutreachTemplate | null) => {
    if (!tpl) return null;
    const text = fillTemplate(tpl.body, picked, name);
    return (
      <div style={{ marginTop: 8 }}>
        <div className="small" style={{ fontWeight: 650 }}>
          {label} <span className="muted">{tpl.to}</span>{" "}
          <button className="btn mini ghost" onClick={() => copy(label, text)}>
            {copied === label ? "✓ 已复制" : "复制"}
          </button>
        </div>
        <textarea className="field" key={text} rows={6} defaultValue={text} />
      </div>
    );
  };

  return (
    <>
      {pill && <span className={pill.cls}>{pill.text}</span>}
      <button className="btn mini ghost" onClick={() => setOpen(true)}>
        🧭 解决
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="modal-mask" onClick={() => setOpen(false)}>
            <div className="modal" style={{ width: 620 }} onClick={(e) => e.stopPropagation()}>
              <div className="card-title">
                🧭 {name} · 内推怎么解决
                <span className="more">
                  <button className="btn mini ghost" onClick={() => setOpen(false)}>
                    关闭
                  </button>
                </span>
              </div>
              <div className="chips">
                <button
                  className={`chip ${path === "linkedin" ? "on" : ""}`}
                  onClick={() => setPath("linkedin")}
                >
                  🔍 LinkedIn 找陌生人
                </button>
                <button
                  className={`chip ${path === "friend" ? "on" : ""}`}
                  onClick={() => setPath("friend")}
                >
                  🤝 找认识的人
                </button>
                <button
                  className={`chip ${path === "giveup" ? "on" : ""}`}
                  onClick={() => setPath("giveup")}
                >
                  ✖️ 放弃 referral
                </button>
              </div>

              {path === "" && (
                <p className="muted small">
                  选一条路：LinkedIn 冷启动（找该公司 DS 发连接请求 + DM）、找认识的人（话术已备）、
                  或者放弃内推直接网申。选完会把策略标记写进 tracker，缺口名单里就能看到进展。
                </p>
              )}

              {path === "linkedin" && (
                <>
                  <p className="small" style={{ margin: "4px 0" }}>
                    <a className="btn mini" href={searchUrl} target="_blank" rel="noreferrer">
                      ① 在 LinkedIn 搜 {name} 的 DS →
                    </a>{" "}
                    <span className="muted small">
                      优先：同方向 DS &gt; 同校/同社区 &gt; 华人；挑 2–3 人，别群发
                    </span>
                  </p>
                  {jobPicker}
                  {textBlock("② 连接请求（≤300 字符）", templates.connect)}
                  {textBlock("③ 通过后发 DM", templates.dm)}
                  <button
                    className="btn"
                    style={{ marginTop: 8 }}
                    disabled={!canWrite || busy}
                    title={canWrite ? "" : "在 ⚙️ 设置配 token 后可写入"}
                    onClick={() => mark(`🔍LinkedIn找人中(${today()})`, "已标记 LinkedIn 找人中")}
                  >
                    ④ 标记为 🔍 找人中
                  </button>
                </>
              )}

              {path === "friend" && (
                <>
                  {jobPicker}
                  {textBlock("话术（EN + 中，删掉不用的那段）", templates.friend)}
                  <p className="muted small">发完记得补三件套：简历 PDF + JD 链接 + 三人称简介。</p>
                  <button
                    className="btn"
                    disabled={!canWrite || busy}
                    onClick={() => mark(`🤝熟人引荐中(${today()})`, "已标记熟人引荐中")}
                  >
                    标记为 🤝 引荐中
                  </button>
                </>
              )}

              {path === "giveup" && (
                <>
                  <p className="small">
                    放弃 referral = 直接官网投递（内推过的回复率高 ~3–5 倍，确定吗？）。
                    标记后该公司仍留在缺口名单里、显示 ✖️，想反悔随时换策略。
                  </p>
                  <button
                    className="btn"
                    disabled={!canWrite || busy}
                    onClick={() =>
                      mark(`✖️放弃内推·直接网申(${today()})`, "已标记放弃，直接网申")
                    }
                  >
                    确认 ✖️ 放弃内推
                  </button>
                </>
              )}

              {msg && <div className="save-msg">{msg}</div>}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
