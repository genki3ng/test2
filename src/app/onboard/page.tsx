"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ROLES, ROLE_SLUGS, getRole, type RoleSlug } from "@/config/roles";
import { getToken, ghGetFile, ghPutFile, sendRequestToClaude, REPO } from "@/lib/githubClient";

/* ---------- 类型与工具 ---------- */

type Mode = "remote" | "hybrid" | "onsite";
type Visa = "needed" | "not-needed" | "unsure";

interface Wizard {
  ownerName: string;
  ownerInitials: string;
  role: RoleSlug;
  currentLevel: string;
  targetLevel: string;
  locationMode: Mode | "";
  regions: string;
  visa: Visa | "";
  companies: string[];
  companyInput: string;
  motto: string;
  northStar: string;
}

const BLANK: Wizard = {
  ownerName: "",
  ownerInitials: "",
  role: "ds",
  currentLevel: "",
  targetLevel: "",
  locationMode: "",
  regions: "",
  visa: "",
  companies: [],
  companyInput: "",
  motto: "稳住节奏，",
  northStar: "",
};

const DRAFT_KEY = "jh_onboard_draft";
const MODE_LABEL: Record<Mode, string> = { remote: "远程 Remote", hybrid: "混合 Hybrid", onsite: "现场 Onsite" };
const VISA_LABEL: Record<Visa, string> = { needed: "需要 sponsorship", "not-needed": "不需要", unsure: "待定" };

function initialsFrom(name: string): string {
  const s = name.trim();
  if (!s) return "";
  const parts = s.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return /^[a-z]/i.test(s) ? s.slice(0, 2).toUpperCase() : s.slice(0, 1);
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9一-龥]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "company"
  );
}

function northStarPreview(w: Wizard): string {
  if (w.northStar.trim()) return w.northStar.trim();
  const lvl = w.targetLevel || w.currentLevel || "Senior→Staff";
  return getRole(w.role).northStarTemplate.replace("{level}", lvl);
}

function buildProfile(w: Wizard) {
  return {
    schemaVersion: 1,
    configured: true,
    ownerName: w.ownerName.trim() || "我",
    ownerInitials: (w.ownerInitials.trim() || initialsFrom(w.ownerName) || "我").slice(0, 3),
    motto: w.motto.trim() || "稳住节奏，",
    northStar: northStarPreview(w),
    role: w.role,
    currentLevel: w.currentLevel.trim(),
    targetLevel: w.targetLevel.trim(),
    location: { mode: w.locationMode || "remote", regions: w.regions.split(/[,，、]/).map((s) => s.trim()).filter(Boolean) },
    visaSponsorship: w.visa || "unsure",
    targetCompanies: w.companies,
    createdAt: new Date().toISOString(),
  };
}

type Profile = ReturnType<typeof buildProfile>;

function buildTrackerJson(p: Profile): string {
  const role = getRole(p.role);
  const companies = p.targetCompanies.map((name) => ({
    name,
    slug: slugify(name),
    careers: null,
    role: role.defaultRoleTitle,
    tier: 2,
    status: "researching",
    perm: "",
    referral: "待找",
    next: "核实在招岗位 + 找内推渠道",
  }));
  return JSON.stringify({ companies }, null, 2) + "\n";
}

function buildTargetMd(p: Profile): string {
  const role = getRole(p.role);
  const today = new Date().toISOString().slice(0, 10);
  const loc =
    `${MODE_LABEL[(p.location.mode as Mode) || "remote"]}` +
    (p.location.regions.length ? ` · ${p.location.regions.join("、")}` : "");
  const companies = p.targetCompanies.join("、") || "（填目标公司）";
  return `# 北极星 与 约束（Target）

> 由 /onboard 向导生成（${today}）。这是整个求职的「北极星」：任何决策都回到这里对照。改完直接 push。

## 🟢 首要动机

- ${p.northStar}

## 🎯 目标

- 角色方向：**${role.label}（${role.shortLabel}）**。
- 目标公司：**${companies}**。

## 🏆 级别

- 当前：**${p.currentLevel || "（填）"}** → 目标：**${p.targetLevel || "（填）"}**。

## 📍 地区

- ${loc}

## 🛂 签证 / Sponsorship

- ${VISA_LABEL[(p.visaSponsorship as Visa) || "unsure"]}

## 🗓️ 时间线

| 里程碑 | 日期 |
|---|---|
| 启动 | ${today} |
| 理想拿到 offer | （填，如 ~3 个月内）|
| 入职 | （填，可灵活）|

## ✅ Dealbreakers / 优先级排序

1. （最重要的硬约束，如方向 / 级别 / sponsorship）
2. 总包
3. 入职时间
4. 地区
`;
}

function handoffPrompt(p: Profile): string {
  const role = getRole(p.role);
  return `请把下面这份 onboarding profile 应用到我的 OfferOS 仓库，改完 commit 并 push 到 main：

1) 写 data/profile.json（原样照抄，configured 必须为 true）：
\`\`\`json
${JSON.stringify(p, null, 2)}
\`\`\`

2) 重写 data/tracker.json，把示例公司换成我的目标公司；每条用现有 schema：
   { "name", "slug"(name 转 kebab), "careers": null, "role": "${role.defaultRoleTitle}", "tier": 2, "status": "researching", "perm": "", "referral": "待找", "next": "核实在招岗位 + 找内推渠道" }
   我的目标公司：${p.targetCompanies.join("、") || "（无）"}

3) 重写 profile/target.md：用上面 profile 的动机 / 级别 / 地区 / 签证 / 公司填好（保留中文小标题）。

4) 生成 prep/${role.slug}/ 备战 pack：按 src/config/roles.ts 里 ${role.slug} 的 prepCategories 充实题库与各板块（守 STYLEGUIDE 的 question-bank 格式契约：## 类别 → ### [id] 题 → **要点**）。

5) 完整部署 / 配置流程见仓库根的 SETUP.md。`;
}

/* ---------- 小组件 ---------- */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {hint && <div className="muted small" style={{ marginBottom: 6 }}>{hint}</div>}
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--border, #d9d4cc)",
  background: "var(--bg, #fff)",
  color: "inherit",
  font: "inherit",
};

function Chip({ label, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button type="button" className="btn-ghost" onClick={onClick} style={{ marginRight: 6, marginBottom: 6 }}>
      {label}
    </button>
  );
}

/* ---------- 主向导 ---------- */

const STEPS = ["身份", "目标角色", "级别", "地区", "签证", "目标公司", "北极星", "确认"];

export default function OnboardPage() {
  const [w, setW] = useState<Wizard>(BLANK);
  const [step, setStep] = useState(0);
  const [hasToken, setHasToken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  // 草稿持久化：进出 /settings 配 token 也不丢答案
  useEffect(() => {
    setHasToken(!!getToken());
    try {
      const d = localStorage.getItem(DRAFT_KEY);
      if (d) setW({ ...BLANK, ...JSON.parse(d) });
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(w));
    } catch {}
  }, [w]);

  const up = (patch: Partial<Wizard>) => setW((prev) => ({ ...prev, ...patch }));
  const role = getRole(w.role);

  const addCompany = () => {
    const v = w.companyInput.trim().replace(/[,，、]$/, "");
    if (v && !w.companies.includes(v)) up({ companies: [...w.companies, v], companyInput: "" });
    else up({ companyInput: "" });
  };

  async function doWrite() {
    setBusy(true);
    setErr("");
    try {
      const p = buildProfile(w);
      const prof = await ghGetFile("data/profile.json");
      await ghPutFile("data/profile.json", JSON.stringify(p, null, 2) + "\n", "site: onboarding — 身份/角色 profile", prof?.sha);
      const trk = await ghGetFile("data/tracker.json");
      await ghPutFile("data/tracker.json", buildTrackerJson(p), "site: onboarding — 重置目标公司清单", trk?.sha);
      const tgt = await ghGetFile("profile/target.md");
      await ghPutFile("profile/target.md", buildTargetMd(p), "site: onboarding — 重写北极星 target.md", tgt?.sha);
      await sendRequestToClaude({
        kind: "准备材料",
        topic: `生成 ${role.label} 备战 pack`,
        context: "onboard",
        detail: `用户已通过 /onboard 完成 onboarding：角色 ${role.label}（${role.slug}），级别 ${p.currentLevel || "?"} → ${p.targetLevel || "?"}。\n\n请：\n1) 按 src/config/roles.ts 里 ${role.slug} 的 prepCategories 充实 prep/${role.slug}/ 题库与各板块（已存在则按背景精炼）。\n2) 结合 profile/target.md 与目标公司定制 question-bank / sprint-plan。\n3) 目标公司：${p.targetCompanies.join("、") || "（未填）"}。`,
      });
      localStorage.setItem("jh_onboard_done", "1");
      localStorage.setItem(
        "jh_profile_cache",
        JSON.stringify({ ownerName: p.ownerName, ownerInitials: p.ownerInitials, motto: p.motto })
      );
      localStorage.removeItem(DRAFT_KEY);
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "写入失败");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <>
        <h1 className="page-title">✅ 设置完成</h1>
        <div className="card section">
          <p>
            已把你的身份、角色（<b>{role.label}</b>）、目标公司写进仓库，并给 Claude 留了一条生成{" "}
            <b>{role.shortLabel}</b> 备战 pack 的请求。
          </p>
          <p className="muted small">
            Vercel 会在 ~1 分钟内重建上线，届时全站文案会变成你的。接下来：在 Claude Code 里说「读 CLAUDE.md 和 HANDOFF.md，处理 inbox」即可。
          </p>
          <div style={{ marginTop: 12 }}>
            <Link className="btn-primary" href="/">回到今日 →</Link>
          </div>
        </div>
      </>
    );
  }

  const last = STEPS.length - 1;

  return (
    <>
      <h1 className="page-title">🚀 设置 OfferOS</h1>
      <p className="page-sub">
        回答几个问题，把这个模板变成<strong>你的</strong>求职指挥台，并选好对应角色的备战模板。
        步骤 {step + 1}/{STEPS.length}：{STEPS[step]}
      </p>

      <div className="card section" style={{ maxWidth: 640 }}>
        {step === 0 && (
          <>
            <Field label="你的名字" hint="首页问候语、页面文案里用。">
              <input
                style={inputStyle}
                value={w.ownerName}
                onChange={(e) => up({ ownerName: e.target.value })}
                placeholder="如 Jane Doe / 张三"
                autoFocus
              />
            </Field>
            <Field label="头像缩写" hint="右上角头像，1–3 字符；留空自动从名字取。">
              <input
                style={{ ...inputStyle, maxWidth: 120 }}
                value={w.ownerInitials}
                onChange={(e) => up({ ownerInitials: e.target.value })}
                placeholder={initialsFrom(w.ownerName) || "JD"}
              />
            </Field>
          </>
        )}

        {step === 1 && (
          <Field label="你的目标角色" hint="决定备战题库、面试轮次与北极星模板。">
            <div>
              {ROLE_SLUGS.map((s) => {
                const r = ROLES[s];
                const active = w.role === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => up({ role: s })}
                    className={active ? "btn-primary" : "btn-ghost"}
                    style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 8, padding: "10px 12px" }}
                  >
                    <b>{r.label}（{r.shortLabel}）</b>
                    <div className="small" style={{ opacity: 0.85 }}>{r.blurb}</div>
                  </button>
                );
              })}
            </div>
          </Field>
        )}

        {step === 2 && (
          <>
            <Field label="当前级别" hint="点预设或自己填。">
              <div style={{ marginBottom: 6 }}>
                {role.levelPresets.map((lv) => (
                  <Chip key={lv} label={lv} onClick={() => up({ currentLevel: lv })} />
                ))}
              </div>
              <input style={inputStyle} value={w.currentLevel} onChange={(e) => up({ currentLevel: e.target.value })} placeholder="如 Senior (IC5)" />
            </Field>
            <Field label="目标级别">
              <div style={{ marginBottom: 6 }}>
                {role.levelPresets.map((lv) => (
                  <Chip key={lv} label={lv} onClick={() => up({ targetLevel: lv })} />
                ))}
              </div>
              <input style={inputStyle} value={w.targetLevel} onChange={(e) => up({ targetLevel: e.target.value })} placeholder="如 Staff (IC6)" />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <Field label="工作形态">
              <div>
                {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
                  <button key={m} type="button" onClick={() => up({ locationMode: m })} className={w.locationMode === m ? "btn-primary" : "btn-ghost"} style={{ marginRight: 6 }}>
                    {MODE_LABEL[m]}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="地区 / 城市偏好" hint="逗号分隔，可留空。">
              <input style={inputStyle} value={w.regions} onChange={(e) => up({ regions: e.target.value })} placeholder="如 美国主要城市、Remote、Bay Area" />
            </Field>
          </>
        )}

        {step === 4 && (
          <Field label="是否需要签证 sponsorship？">
            <div>
              {(Object.keys(VISA_LABEL) as Visa[]).map((v) => (
                <button key={v} type="button" onClick={() => up({ visa: v })} className={w.visa === v ? "btn-primary" : "btn-ghost"} style={{ marginRight: 6 }}>
                  {VISA_LABEL[v]}
                </button>
              ))}
            </div>
          </Field>
        )}

        {step === 5 && (
          <Field label="目标公司" hint="回车或逗号添加；会写进 tracker（pipeline）。可留空稍后再加。">
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={inputStyle}
                value={w.companyInput}
                onChange={(e) => up({ companyInput: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addCompany();
                  }
                }}
                placeholder="如 Northwind"
              />
              <button type="button" className="btn-ghost" onClick={addCompany}>添加</button>
            </div>
            <div style={{ marginTop: 8 }}>
              {w.companies.map((c) => (
                <Chip key={c} label={`${c} ✕`} onClick={() => up({ companies: w.companies.filter((x) => x !== c) })} />
              ))}
            </div>
          </Field>
        )}

        {step === 6 && (
          <>
            <Field label="问候口头禅（motto）" hint="首页问候里的鼓励语。">
              <input style={inputStyle} value={w.motto} onChange={(e) => up({ motto: e.target.value })} placeholder="稳住节奏，" />
            </Field>
            <Field label="北极星（一句话目标）" hint="留空则按角色模板自动生成（见下方预览）。">
              <input style={inputStyle} value={w.northStar} onChange={(e) => up({ northStar: e.target.value })} placeholder={getRole(w.role).northStarTemplate.replace("{level}", w.targetLevel || "Senior→Staff")} />
              <div className="muted small" style={{ marginTop: 6 }}>预览：{northStarPreview(w)}</div>
            </Field>
          </>
        )}

        {step === last && (
          <>
            <div className="card-title">确认要写入的 profile</div>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "var(--code-bg, #f4f1ec)", padding: 12, borderRadius: 8, overflowX: "auto" }}>
              {JSON.stringify(buildProfile(w), null, 2)}
            </pre>
            {hasToken ? (
              <>
                <p className="muted small">
                  将提交到仓库 <code>{REPO}</code>：写 <code>data/profile.json</code>、重置 <code>data/tracker.json</code>、重写{" "}
                  <code>profile/target.md</code>，并给 Claude 留一条生成 {role.shortLabel} 备战 pack 的请求。Vercel ~1 分钟后重建上线。
                </p>
                <button className="btn-primary" disabled={busy} onClick={doWrite}>
                  {busy ? "写入中…" : "确认并写入仓库 →"}
                </button>
                {err && <p className="small" style={{ color: "var(--danger, #d33)" }}>✗ {err}</p>}
              </>
            ) : (
              <>
                <p className="muted small">
                  还没连 GitHub（没配 PAT）。两个选择：① 去 <Link href="/settings">/settings</Link> 配一把细粒度 PAT 再回来，
                  这页的答案已自动暂存；② 或者把下面这段交给 Claude / Codex，让它替你写进仓库。
                </p>
                <textarea readOnly style={{ ...inputStyle, height: 220, fontFamily: "monospace", fontSize: 12 }} value={handoffPrompt(buildProfile(w))} />
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      navigator.clipboard?.writeText(handoffPrompt(buildProfile(w)));
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? "已复制 ✓" : "复制给 Claude / Codex"}
                  </button>
                  <Link className="btn-ghost" href="/settings">去配 PAT →</Link>
                </div>
              </>
            )}
          </>
        )}

        {/* 导航 */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
          <button className="btn-ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            ← 上一步
          </button>
          {step < last && (
            <button className="btn-primary" disabled={step === 0 && !w.ownerName.trim()} onClick={() => setStep((s) => Math.min(last, s + 1))}>
              下一步 →
            </button>
          )}
        </div>
      </div>
    </>
  );
}
