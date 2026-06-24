"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { OutreachTemplate } from "@/lib/data";

export interface KitJob {
  title: string;
  location: string;
  link: string;
  id: string;
  stars: number;
  hot: boolean;
  pinned?: boolean; // 📌 投递清单：排最前 + 自动预选
}

export function fillTemplate(t: string, jobs: KitJob[], company = ""): string {
  const lines = jobs
    .map(
      (j) =>
        `- ${j.title}${j.location ? `（${j.location}）` : ""}${j.link ? ` — ${j.link}` : ""}`
    )
    .join("\n");
  const ids = jobs.map((j) => j.id).filter(Boolean).join(", ");
  return t
    .replaceAll("{{jobs}}", lines || "-（勾选岗位或粘贴链接后自动填充）")
    .replaceAll("{{job_ids}}", ids || "（补 Job ID）")
    .replaceAll("{{job_title}}", jobs[0]?.title ?? "（岗位名）")
    .replaceAll("{{job_location}}", jobs[0]?.location ?? "（地点）")
    .replaceAll("{{company}}", company || "（公司）");
}

/**
 * 内推邮件生成器：按渠道模板 + 岗位库勾选/自定义链接 → 填好收件人/主题/正文，一键复制。
 * 模板源 = pipeline/referral-outreach-templates.md「C. 渠道邮件模板」段（可手改后重建生效）。
 */
export default function ReferralKit({
  channel,
  template,
  jobs,
  company = "",
}: {
  channel: string; // referrals 第一列原文
  template: OutreachTemplate | null;
  jobs: KitJob[];
  company?: string; // {{company}} 占位符用
}) {
  const [open, setOpen] = useState(false);
  const ranked = useMemo(
    () =>
      jobs
        .slice()
        .sort(
          (a, b) =>
            Number(!!b.pinned) - Number(!!a.pinned) ||
            b.stars + (b.hot ? 3 : 0) - (a.stars + (a.hot ? 3 : 0))
        ),
    [jobs]
  );
  // 默认勾选：投递清单（📌）里的岗；清单为空才退回契合度前 2
  const [sel, setSel] = useState<number[]>(() => {
    const pinnedIdx = ranked.map((j, i) => (j.pinned ? i : -1)).filter((i) => i >= 0);
    return pinnedIdx.length ? pinnedIdx : ranked.slice(0, 2).map((_, i) => i);
  });
  const [custom, setCustom] = useState("");
  const [copied, setCopied] = useState("");

  if (!template) return null;

  const customJobs: KitJob[] = custom
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const link = l.match(/https?:\/\/\S+/)?.[0] ?? "";
      const title = l.replace(link, "").replace(/[—\-–\s]+$/, "").trim();
      return { title: title || "岗位链接", location: "", link: link || l, id: "", stars: 0, hot: false };
    });
  const picked = [...sel.map((i) => ranked[i]).filter(Boolean), ...customJobs];
  const subject = fillTemplate(template.subject, picked, company);
  const body = fillTemplate(template.body, picked, company);

  const copy = async (what: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(""), 2500);
    } catch {
      setCopied("✗");
    }
  };

  const cleanChannel = channel.replace(/[*_`]/g, "");

  return (
    <>
      <div>
        <button className="btn mini ghost" onClick={() => setOpen(true)} title="按该渠道格式生成内推邮件">
          ✉️ 邮件
        </button>
      </div>
      {/* portal 到 body：液玻主题卡片有 backdrop-filter，会让 fixed 相对卡片定位 */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
        <div className="modal-mask" onClick={() => setOpen(false)}>
          <div className="modal" style={{ width: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="card-title">
              ✉️ {cleanChannel} · 内推邮件
              <span className="more">
                <button className="btn mini ghost" onClick={() => setOpen(false)}>
                  关闭
                </button>
              </span>
            </div>
            {template.note && <p className="muted small">📋 {template.note}</p>}

            {ranked.length > 0 && (
              <>
                <div className="small" style={{ fontWeight: 650, margin: "8px 0 2px" }}>
                  从岗位库勾选（已按契合度排序）：
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
                        {j.id ? <span className="muted small"> · {j.id}</span> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <textarea
              className="field"
              rows={2}
              placeholder={
                ranked.length
                  ? "岗位库没有的，贴链接（一行一个，可写「岗位名 — 链接」）"
                  : "贴你想推的岗位链接（一行一个，可写「岗位名 — 链接」）"
              }
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />

            <div className="small" style={{ margin: "6px 0 2px" }}>
              <b>收件人</b>：<code>{template.to}</code>{" "}
              <button className="btn mini ghost" onClick={() => copy("to", template.to)}>
                {copied === "to" ? "✓ 已复制" : "复制"}
              </button>
            </div>
            <div className="small" style={{ margin: "6px 0 2px" }}>
              <b>主题</b>：<code>{subject}</code>{" "}
              <button className="btn mini ghost" onClick={() => copy("subject", subject)}>
                {copied === "subject" ? "✓ 已复制" : "复制"}
              </button>
            </div>
            <textarea
              className="field"
              key={body}
              rows={14}
              defaultValue={body}
              id={`kit-body-${cleanChannel}`}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                className="btn"
                onClick={() => {
                  const el = document.getElementById(
                    `kit-body-${cleanChannel}`
                  ) as HTMLTextAreaElement | null;
                  copy("body", el?.value ?? body);
                }}
              >
                {copied === "body" ? "✓ 正文已复制" : "复制正文"}
              </button>
              <span className="muted small">
                📎 附件（PDF 简历等）记得手动挂 · 发完回这页点「→ 已联系」推进状态
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
