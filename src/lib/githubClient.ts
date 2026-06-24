"use client";

/**
 * 浏览器直连 GitHub Contents API 的写通道（与 1p3a 扩展同一模式、同一 PAT 可复用）。
 * token 存 localStorage，永不入库。所有写操作 = 直接 commit 到 main → Vercel 自动重建。
 */

import { siteConfig } from "@/site.config";

export const REPO = siteConfig.githubRepo;
const API = `https://api.github.com/repos/${REPO}/contents/`;
const TOKEN_KEY = "jh_gh_token";

export function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setToken(t: string) {
  if (t) localStorage.setItem(TOKEN_KEY, t.trim());
  else localStorage.removeItem(TOKEN_KEY);
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${getToken()}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function b64encodeUtf8(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function b64decodeUtf8(b64: string): string {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export async function ghGetFile(
  path: string
): Promise<{ content: string; sha: string } | null> {
  const res = await fetch(API + path + `?ref=main&t=${Date.now()}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub 读取失败 ${res.status}`);
  const j = await res.json();
  return { content: b64decodeUtf8(j.content), sha: j.sha };
}

export async function ghPutFile(
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const body: Record<string, string> = {
    message,
    content: b64encodeUtf8(content),
    branch: "main",
  };
  if (sha) body.sha = sha;
  const res = await fetch(API + path, {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(`GitHub 写入失败 ${res.status}：${j.message ?? ""}`);
  }
}

/** 只取文件 sha（不解码内容，二进制/大文件也可用；404 → null） */
export async function ghGetSha(path: string): Promise<string | null> {
  const res = await fetch(API + path + `?ref=main&t=${Date.now()}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub 读取失败 ${res.status}`);
  const j = await res.json();
  return j.sha as string;
}

/** 写二进制文件（content 已是 base64，不做 UTF-8 编码） */
export async function ghPutFileBase64(
  path: string,
  b64: string,
  message: string,
  sha?: string
): Promise<void> {
  const body: Record<string, string> = { message, content: b64, branch: "main" };
  if (sha) body.sha = sha;
  const res = await fetch(API + path, {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(`GitHub 写入失败 ${res.status}：${j.message ?? ""}`);
  }
}

export async function ghDeleteFile(
  path: string,
  message: string,
  sha: string
): Promise<void> {
  const res = await fetch(API + path, {
    method: "DELETE",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({ message, sha, branch: "main" }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(`GitHub 删除失败 ${res.status}：${j.message ?? ""}`);
  }
}

/** 列目录下的文件（实时读 main，收件箱实时卡用） */
export async function ghListDir(
  path: string
): Promise<{ name: string; path: string }[]> {
  const res = await fetch(API + path + `?ref=main&t=${Date.now()}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub 读取失败 ${res.status}`);
  const j = await res.json();
  return Array.isArray(j)
    ? j
        .filter((e) => e.type === "file")
        .map((e) => ({ name: e.name as string, path: e.path as string }))
    : [];
}

export async function ghTestToken(): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${REPO}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (res.status === 401) throw new Error("token 无效（401）");
  if (res.status === 403 || res.status === 404)
    throw new Error(`token 无本仓库权限（${res.status}）`);
  if (!res.ok) throw new Error(`连接失败 ${res.status}`);
  const j = await res.json();
  if (!j.permissions?.push)
    throw new Error("token 只读——需要 Contents Read & Write 权限");
  return `已连接 ${j.full_name}（可写）`;
}

/* ---------- markdown 变换（纯函数） ---------- */

/** 提取任务行（与服务端 data.ts 的 getTaskLines 逻辑保持一致） */
export function findTaskLines(
  src: string
): { line: number; text: string; checked: boolean }[] {
  const out: { line: number; text: string; checked: boolean }[] = [];
  let inFence = false;
  src.split("\n").forEach((l, i) => {
    if (/^\s*(```|~~~)/.test(l)) inFence = !inFence;
    if (inFence) return;
    const m = l.match(/^(\s*(?:>\s*)?[-*] )\[([ xX])\] (.*)$/);
    if (m) out.push({ line: i, text: m[3].trim(), checked: m[2] !== " " });
  });
  return out;
}

/** 把第 idx 个任务行打勾/取消（用 expectedText 校验；不匹配则按文本查找兜底） */
export function toggleTask(
  src: string,
  idx: number,
  expectedText: string,
  checked: boolean
): string {
  const tasks = findTaskLines(src);
  let target = tasks[idx];
  if (!target || target.text !== expectedText) {
    const byText = tasks.filter((t) => t.text === expectedText);
    if (byText.length !== 1)
      throw new Error("文件内容已变化，定位不到该任务——刷新页面后再试");
    target = byText[0];
  }
  const lines = src.split("\n");
  lines[target.line] = lines[target.line].replace(
    /\[( |x|X)\]/,
    checked ? "[x]" : "[ ]"
  );
  return lines.join("\n");
}

/** 修改 tracker.md 中某公司行的状态列（第 3 列） */
export function setTrackerStatus(
  src: string,
  companyCell: string,
  newStatus: string
): string {
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l.startsWith("|")) continue;
    const cells = l.replace(/^\|/, "").replace(/\|$/, "").split("|");
    if (cells.length >= 7 && cells[0].trim() === companyCell) {
      cells[2] = ` ${newStatus} `;
      lines[i] = "|" + cells.join("|") + "|";
      return lines.join("\n");
    }
  }
  throw new Error(`tracker.md 里找不到公司行：${companyCell}`);
}

/** 修改 tracker.md 中某公司行的「Referral」列（第 5 列）——缺口卡策略标记用 */
export function setTrackerReferral(
  src: string,
  companyCell: string,
  newVal: string
): string {
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l.startsWith("|")) continue;
    const cells = l.replace(/^\|/, "").replace(/\|$/, "").split("|");
    if (cells.length >= 7 && cells[0].trim() === companyCell) {
      cells[4] = ` ${newVal.replace(/\|/g, "/")} `;
      lines[i] = "|" + cells.join("|") + "|";
      return lines.join("\n");
    }
  }
  throw new Error(`tracker.md 里找不到公司行：${companyCell}`);
}

/** 修改 tracker.md 中某公司行的「下一步」列（第 6 列） */
export function setTrackerNext(
  src: string,
  companyCell: string,
  newNext: string
): string {
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l.startsWith("|")) continue;
    const cells = l.replace(/^\|/, "").replace(/\|$/, "").split("|");
    if (cells.length >= 7 && cells[0].trim() === companyCell) {
      cells[5] = ` ${newNext.replace(/\|/g, "/")} `;
      lines[i] = "|" + cells.join("|") + "|";
      return lines.join("\n");
    }
  }
  throw new Error(`tracker.md 里找不到公司行：${companyCell}`);
}

/** referrals.md 主表：把某行（按第一列匹配）的「状态」列推进到 newStatus */
export function setReferralStatus(
  src: string,
  firstCell: string,
  newStatus: string
): string {
  const lines = src.split("\n");
  let header: string[] | null = null;
  let statusCol = -1;
  const matches: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l.startsWith("|")) {
      header = null;
      continue;
    }
    const cells = l.replace(/^\|/, "").replace(/\|$/, "").split("|");
    if (cells.every((c) => /^\s*:?-{2,}:?\s*$/.test(c))) continue;
    if (!header) {
      header = cells;
      statusCol = cells.findIndex((c) => c.includes("状态"));
      continue;
    }
    if (statusCol >= 0 && cells[0]?.trim() === firstCell) matches.push(i);
  }
  if (statusCol < 0) throw new Error("referrals.md 找不到「状态」列");
  if (matches.length !== 1)
    throw new Error(
      matches.length === 0
        ? `referrals.md 找不到行：${firstCell}`
        : `referrals.md 有多行同名：${firstCell}，请手工改`
    );
  const i = matches[0];
  const cells = lines[i]
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|");
  cells[statusCol] = ` ${newStatus} `;
  lines[i] = "|" + cells.join("|") + "|";
  return lines.join("\n");
}

/** 在公司文件「当前 opening」段内，给含 anchor（链接或标题）的岗位行加/去 📌（投递清单标记） */
export function toggleOpeningPin(src: string, anchor: string, pin: boolean): string {
  const lines = src.split("\n");
  let inSection = false;
  let lastBullet = -1;
  const hits: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("## ")) {
      inSection =
        l.includes("当前 opening") || l.toLowerCase().includes("当前opening");
      lastBullet = -1;
      continue;
    }
    if (!inSection) continue;
    if (/^\s*- /.test(l)) {
      lastBullet = i;
      if (l.includes(anchor)) hits.push(i);
    } else if (lastBullet >= 0 && /^\s+\S/.test(l) && l.includes(anchor)) {
      hits.push(lastBullet); // anchor 在折行续接里 → 算到所属 bullet 头上
    }
  }
  const uniq = [...new Set(hits)];
  if (uniq.length !== 1)
    throw new Error(
      uniq.length === 0
        ? "定位不到该岗位行——文件可能已更新，刷新页面再试"
        : "多行匹配到同一锚点，请到源文件手动加 📌"
    );
  const i = uniq[0];
  if (pin) {
    if (!lines[i].includes("📌")) lines[i] = lines[i].replace(/^(\s*- )/, "$1📌 ");
  } else {
    lines[i] = lines[i].replace(/📌\s*/u, "");
  }
  return lines.join("\n");
}

export async function saveOpeningPin(
  slug: string,
  anchor: string,
  pin: boolean,
  label: string
): Promise<void> {
  const path = `pipeline/companies/${slug}.md`;
  const f = await ghGetFile(path);
  if (!f) throw new Error(`${path} 不存在`);
  const next = toggleOpeningPin(f.content, anchor, pin);
  await ghPutFile(
    path,
    next,
    `site: 投递清单${pin ? "＋" : "－"} ${slug} · ${label.slice(0, 40)}`,
    f.sha
  );
}

/** 在公司文件「当前 opening」段内，给含 anchor 的岗位行设/清「态度」标记（💚 心仪 / 🚫 不合适 / "" 清除） */
export function setOpeningAttitude(
  src: string,
  anchor: string,
  attitude: "" | "love" | "no"
): string {
  const lines = src.split("\n");
  let inSection = false;
  let lastBullet = -1;
  const hits: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("## ")) {
      inSection =
        l.includes("当前 opening") || l.toLowerCase().includes("当前opening");
      lastBullet = -1;
      continue;
    }
    if (!inSection) continue;
    if (/^\s*- /.test(l)) {
      lastBullet = i;
      if (l.includes(anchor)) hits.push(i);
    } else if (lastBullet >= 0 && /^\s+\S/.test(l) && l.includes(anchor)) {
      hits.push(lastBullet);
    }
  }
  const uniq = [...new Set(hits)];
  if (uniq.length !== 1)
    throw new Error(
      uniq.length === 0
        ? "定位不到该岗位行——文件可能已更新，刷新页面再试"
        : "多行匹配到同一锚点，请到源文件手动标"
    );
  const i = uniq[0];
  // 先清掉旧态度标记，再插到 "- "（及可能的 📌）之后
  let line = lines[i].replace(/[💚🚫]\s*/gu, "");
  const mark = attitude === "love" ? "💚 " : attitude === "no" ? "🚫 " : "";
  if (mark) line = line.replace(/^(\s*- (?:📌\s*)?)/, `$1${mark}`);
  lines[i] = line;
  return lines.join("\n");
}

export async function saveOpeningAttitude(
  slug: string,
  anchor: string,
  attitude: "" | "love" | "no",
  label: string
): Promise<void> {
  const path = `pipeline/companies/${slug}.md`;
  const f = await ghGetFile(path);
  if (!f) throw new Error(`${path} 不存在`);
  const next = setOpeningAttitude(f.content, anchor, attitude);
  const tag = attitude === "love" ? "💚心仪" : attitude === "no" ? "🚫不合适" : "清除态度";
  await ghPutFile(path, next, `site: 态度 ${tag} ${slug} · ${label.slice(0, 40)}`, f.sha);
}

export type AppStatus = "" | "applied" | "interview" | "offer" | "rejected";
const APP_EMOJI: Record<Exclude<AppStatus, "">, string> = {
  applied: "📮",
  interview: "🗣️",
  offer: "🏆",
  rejected: "🛑",
};

/** 在「当前 opening」段内，给含 anchor 的岗位行设投递进度标记（📮已投/🗣️面试中/🏆offer/🛑被拒/""清除） */
export function setOpeningAppStatus(
  src: string,
  anchor: string,
  status: AppStatus
): string {
  const lines = src.split("\n");
  let inSection = false;
  let lastBullet = -1;
  const hits: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("## ")) {
      inSection =
        l.includes("当前 opening") || l.toLowerCase().includes("当前opening");
      lastBullet = -1;
      continue;
    }
    if (!inSection) continue;
    if (/^\s*- /.test(l)) {
      lastBullet = i;
      if (l.includes(anchor)) hits.push(i);
    } else if (lastBullet >= 0 && /^\s+\S/.test(l) && l.includes(anchor)) {
      hits.push(lastBullet);
    }
  }
  const uniq = [...new Set(hits)];
  if (uniq.length !== 1)
    throw new Error(
      uniq.length === 0
        ? "定位不到该岗位行——刷新页面再试"
        : "多行匹配到同一锚点，请到源文件手动标"
    );
  const i = uniq[0];
  // 先清掉旧进度标记（含变体选择符），再插到 "- " 之后
  let line = lines[i].replace(/[📮🏆🛑🗣️]️?\s*/gu, "");
  const mark = status ? APP_EMOJI[status] + " " : "";
  if (mark) line = line.replace(/^(\s*- )/, `$1${mark}`);
  lines[i] = line;
  return lines.join("\n");
}

export async function saveOpeningAppStatus(
  slug: string,
  anchor: string,
  status: AppStatus,
  label: string
): Promise<void> {
  const path = `pipeline/companies/${slug}.md`;
  const f = await ghGetFile(path);
  if (!f) throw new Error(`${path} 不存在`);
  let next = setOpeningAppStatus(f.content, anchor, status);
  // D) 标「已投」时，自动在「投递记录」表补一行（去重）
  if (status === "applied") next = appendDeliveryLog(next, label, anchor);
  const tag =
    status === "applied"
      ? "📮已投"
      : status === "interview"
      ? "🗣️面试中"
      : status === "offer"
      ? "🏆offer"
      : status === "rejected"
      ? "🛑被拒"
      : "清除进度";
  await ghPutFile(path, next, `site: 投递进度 ${tag} ${slug} · ${label.slice(0, 40)}`, f.sha);
}

/** 在公司文件「投递记录」表追加一行（已投自动记账）。表/段不存在则创建；按岗位名去重 */
export function appendDeliveryLog(src: string, title: string, anchor: string): string {
  const t = (title || "").replace(/\|/g, "\\|").trim();
  // 已记过就不重复（按标题或链接命中）
  const sec = /## 投递记录[\s\S]*?(?=\n## |$)/.exec(src)?.[0];
  if (sec && (sec.includes(t) || (anchor && sec.includes(anchor)))) return src;
  const { date } = nowStamp();
  const row = `| ${date} | ${t} | （内推/网申） | 已投 | |`;
  if (/^## 投递记录/m.test(src)) {
    // 追加到该段表格末尾：在「投递记录」段最后一个表格行后插入
    const lines = src.split("\n");
    let inSec = false;
    let lastTableRow = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("## ")) {
        if (inSec) break;
        inSec = lines[i].includes("投递记录");
        continue;
      }
      if (inSec && /^\s*\|/.test(lines[i])) lastTableRow = i;
    }
    if (lastTableRow >= 0) {
      lines.splice(lastTableRow + 1, 0, row);
      return lines.join("\n");
    }
  }
  // 无段/无表 → 新建一段
  return (
    src.trimEnd() +
    `\n\n## 投递记录\n\n| 日期 | 岗位 | 渠道 | 状态 | follow-up |\n|---|---|---|---|---|\n${row}\n`
  );
}

/** E) 标「已投」时，若该公司在 referrals 主表里**恰好一条**渠道且状态尚早，自动推进到「已投递」。返回推进的渠道名（无则 null）。best-effort。 */
export async function autoAdvanceReferralOnApply(
  companyName: string
): Promise<string | null> {
  const path = "pipeline/referrals.md";
  const f = await ghGetFile(path);
  if (!f) return null;
  const baseName = (cell: string) =>
    cell
      .replace(/[①②③④]/g, "")
      .replace(/（[^）]*）/g, "")
      .replace(/\([^)]*\)/g, "")
      .replace(/[*`]/g, "")
      .trim();
  // 找该公司的渠道行（第一列 baseName 匹配）
  const lines = f.content.split("\n");
  let header: string[] | null = null;
  let statusCol = -1;
  const matches: { firstCell: string; status: string }[] = [];
  for (const l of lines) {
    const tl = l.trim();
    if (!tl.startsWith("|")) {
      header = null;
      continue;
    }
    const cells = tl.replace(/^\|/, "").replace(/\|$/, "").split("|");
    if (cells.every((c) => /^\s*:?-{2,}:?\s*$/.test(c))) continue;
    if (!header) {
      header = cells;
      statusCol = cells.findIndex((c) => c.includes("状态"));
      continue;
    }
    if (statusCol < 0) continue;
    if (baseName(cells[0]) === companyName)
      matches.push({ firstCell: cells[0].trim(), status: (cells[statusCol] ?? "").trim() });
  }
  if (matches.length !== 1) return null; // 0 或多条渠道 → 不动（避免猜错）
  const { firstCell, status } = matches[0];
  if (/已投递|失效/.test(status)) return null; // 已是终态
  const { date } = nowStamp();
  const next = setReferralStatus(f.content, firstCell, `已投递(${date})`);
  await ghPutFile(path, next, `site: 内推状态→已投递（${companyName} 岗已投联动）`, f.sha);
  return firstCell;
}

/** 公司文件末尾「## 快记」段追加一条带日期 bullet（无段则创建） */
export function appendQuickNote(src: string, note: string): string {
  const { date } = nowStamp();
  const bullet = `- ${date}：${note.trim()}`;
  if (/^## 快记/m.test(src)) {
    return src.trimEnd() + "\n" + bullet + "\n";
  }
  return (
    src.trimEnd() +
    `\n\n## 快记（站点随手记，Claude 定期归位）\n\n${bullet}\n`
  );
}

/* ---------- 高层操作 ---------- */

export async function saveTaskToggle(
  path: string,
  idx: number,
  expectedText: string,
  checked: boolean
): Promise<void> {
  const f = await ghGetFile(path);
  if (!f) throw new Error(`文件不存在：${path}`);
  const next = toggleTask(f.content, idx, expectedText, checked);
  await ghPutFile(
    path,
    next,
    `site: ${checked ? "完成" : "取消"} ${path} · ${expectedText.slice(0, 40)}`,
    f.sha
  );
}

/** tracker 数据源 = data/tracker.json：按 name 定位公司、改字段、写回（比 markdown 表格字符串匹配稳得多）。
 *  companyCell 参数保留是为了不动调用方签名（StatusCell/QuickPanel/ColdOutreachKit），实际按 companyName 定位。 */
async function saveTrackerField(
  companyName: string,
  field: "status" | "referral" | "next",
  value: string,
  msg: string
): Promise<void> {
  const path = "data/tracker.json";
  const f = await ghGetFile(path);
  if (!f) throw new Error("data/tracker.json 不存在");
  const data = JSON.parse(f.content) as { companies: Array<Record<string, unknown>> };
  const co = (data.companies ?? []).find((c) => c.name === companyName);
  if (!co) throw new Error(`tracker 里找不到公司：${companyName}`);
  co[field] = value;
  await ghPutFile(path, JSON.stringify(data, null, 2) + "\n", msg, f.sha);
}

export async function saveTrackerStatus(
  _companyCell: string,
  companyName: string,
  newStatus: string
): Promise<void> {
  await saveTrackerField(companyName, "status", newStatus, `site: ${companyName} 状态 → ${newStatus}`);
}

export async function saveTrackerReferral(
  _companyCell: string,
  companyName: string,
  newVal: string
): Promise<void> {
  await saveTrackerField(companyName, "referral", newVal, `site: ${companyName} 内推策略 → ${newVal.slice(0, 40)}`);
}

export async function saveTrackerNext(
  _companyCell: string,
  companyName: string,
  newNext: string
): Promise<void> {
  await saveTrackerField(companyName, "next", newNext, `site: ${companyName} 下一步 → ${newNext.slice(0, 40)}`);
}

export async function saveReferralStatus(
  firstCell: string,
  newStatus: string
): Promise<void> {
  const path = "pipeline/referrals.md";
  const f = await ghGetFile(path);
  if (!f) throw new Error("referrals.md 不存在");
  const next = setReferralStatus(f.content, firstCell, newStatus);
  await ghPutFile(path, next, `site: 内推 ${firstCell} → ${newStatus}`, f.sha);
}

export async function saveQuickNote(slug: string, note: string): Promise<void> {
  const path = `pipeline/companies/${slug}.md`;
  const f = await ghGetFile(path);
  if (!f) throw new Error(`${path} 不存在`);
  await ghPutFile(
    path,
    appendQuickNote(f.content, note),
    `site: ${slug} 快记 — ${note.slice(0, 40)}`,
    f.sha
  );
}

/* ---------- 壁纸跨设备同步 ---------- */

export const WALLPAPER_PATH = "public/wallpaper.jpg";

/** 壁纸 dataURL → commit 到仓库（Vercel 重建后全设备生效，浏览端无需 token 即可看） */
export async function syncWallpaperToRepo(dataUrl: string): Promise<void> {
  const b64 = dataUrl.split(",")[1];
  if (!b64) throw new Error("无效的图片数据");
  const sha = await ghGetSha(WALLPAPER_PATH);
  await ghPutFileBase64(
    WALLPAPER_PATH,
    b64,
    "site: 壁纸更新（设置页上传，全设备同步）",
    sha ?? undefined
  );
}

/** 删除仓库壁纸（不存在则返回 false） */
export async function removeWallpaperFromRepo(): Promise<boolean> {
  const sha = await ghGetSha(WALLPAPER_PATH);
  if (!sha) return false;
  await ghDeleteFile(WALLPAPER_PATH, "site: 壁纸清除（全设备）", sha);
  return true;
}

function two(n: number) {
  return String(n).padStart(2, "0");
}

export function nowStamp() {
  const d = new Date();
  return {
    date: `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`,
    time: `${two(d.getHours())}${two(d.getMinutes())}`,
    iso: d.toISOString(),
  };
}

/** 给 Claude 派活：写一条 status:new 的请求进 inbox/（下个 session 开场自动处理） */
export async function sendRequestToClaude(opts: {
  topic: string;
  detail: string;
  kind: string; // 出题练习 / 准备材料 / Mock 面试 / 扫岗调研 / 其他
  context?: string; // 来源页面等
}): Promise<string> {
  const { date, time, iso } = nowStamp();
  const slug =
    opts.topic
      .toLowerCase()
      .replace(/[^a-z0-9一-龥]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "request";
  const path = `inbox/${date}_${time}_request_${slug}.md`;
  const body = `---
captured_at: ${iso}
source_url: site://${opts.context ?? ""}
source_title: "[派活] ${opts.topic.replace(/"/g, "'")}"
type: [request]
kind: ${opts.kind}
tags: []
status: new
---

# 请求：${opts.topic}

${opts.detail.trim() || "（无补充说明）"}

> 来自网页指挥台${opts.context ? `（${opts.context} 页）` : ""}，${date} ${time.slice(0, 2)}:${time.slice(2)}。
`;
  await ghPutFile(path, body, `site: 派活给 Claude — ${opts.topic.slice(0, 40)}`);
  return path;
}

/** 练习自评：往（角色作用域的）practice-log.md 追加一行（无则创建）。path 由练习台按当前角色传入。 */
export async function appendPracticeLog(
  qid: string,
  grade: string,
  note: string,
  path = "prep/practice-log.md"
): Promise<void> {
  const { date, time } = nowStamp();
  const row = `| ${date} ${time.slice(0, 2)}:${time.slice(2)} | ${qid} | ${grade} | ${note.replace(/\|/g, "/").trim()} |`;
  const f = await ghGetFile(path);
  if (!f) {
    const header = `# 练习日志（网页指挥台自动追加）

> 自评：😣 不会 / 😐 磕绊 / 😎 流畅。Claude 按此找薄弱点出补强材料。题号见 [question-bank.md](question-bank.md)。

| 时间 | 题 | 自评 | 备注 |
|---|---|---|---|
${row}
`;
    await ghPutFile(path, header, `site: 练习自评 ${qid} ${grade}`);
    return;
  }
  const next = f.content.trimEnd() + "\n" + row + "\n";
  await ghPutFile(path, next, `site: 练习自评 ${qid} ${grade}`, f.sha);
}
