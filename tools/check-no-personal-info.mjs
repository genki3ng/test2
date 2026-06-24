#!/usr/bin/env node
/**
 * 去标识化铁律检查（开发铁律 · 见 CLAUDE.md / STYLEGUIDE.md）。
 *
 * OfferOS 是要分享出去的模板，**仓库不得包含源作者的任何个人信息**。
 * 本脚本扫描 git 跟踪的文本文件：
 *   - 个人禁用名单（源作者真实标识：名字/handle/姊妹库/私人邮箱片段）——永远硬失败。
 *     名单**不写死在仓库**（公开分享的模板）：从 env DEID_DENYLIST + 本地 gitignore 文件读取（见 loadPersonalDenylist）。
 *   - 模板态额外检查（仅当 data/profile.json.configured !== true）：
 *       · 雇主名 "Meta" 等通用敏感词（下游用户若真在 Meta 求职，配置后即放行）
 *       · 非样例的真人邮箱
 *       · 占位完整性（site.config 默认仍是中性占位）
 *
 * 接到 `npm run build` / `npm run check`。命中即非零退出并打印 file:line。
 * 扩展个人禁用词（择一即可）：env DEID_DENYLIST="词1,词2"（逗号分隔），
 * 或本地文件 tools/deid-denylist-private.json（JSON 字符串数组，已 gitignore，绝不入库）。
 */
import { execSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

const SELF = "tools/check-no-personal-info.mjs";

/** 正则转义：把任意字符串当字面量做大小写不敏感匹配 */
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 源作者专属个人禁用名单 —— 永远硬失败（对任何下游用户都不合法）。
 * **不写死在仓库**（这是公开分享的模板）：从 env DEID_DENYLIST + 本地 gitignore 文件读取。
 * 维护者把自己的真实标识放本地文件 / env；下游用户可留空或填自己的。
 * 空名单 = 模板默认（模板态仍有下方 Meta/邮箱/占位检查兜底）。
 */
function loadPersonalDenylist() {
  const terms = [];
  if (process.env.DEID_DENYLIST) {
    terms.push(...process.env.DEID_DENYLIST.split(",").map((s) => s.trim()).filter(Boolean));
  }
  for (const p of ["tools/deid-denylist-private.json", ".deid-denylist-private.json"]) {
    try {
      const arr = JSON.parse(readFileSync(p, "utf8"));
      if (Array.isArray(arr)) terms.push(...arr.filter((t) => typeof t === "string" && t.trim()));
    } catch {
      /* 文件不存在 / 格式错 = 跳过 */
    }
  }
  return [...new Set(terms)].map((t) => new RegExp(escapeRegExp(t), "i"));
}

const ALWAYS = loadPersonalDenylist();

/** 仅模板态视为泄漏（下游用户配置后放行：他们可能真在这家公司求职） */
const TEMPLATE_ONLY = [/\bMeta\b/];

/** 非样例真人邮箱（仅模板态查） */
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const EMAIL_ALLOW = /@example\.(com|org)\b|noreply@|@your-|@company\.com\b/i;

/** 只扫文本文件（跳过图片/二进制） */
const TEXT_EXT = /\.(md|mdx|ts|tsx|js|jsx|mjs|cjs|json|css|html|txt|yml|yaml|sh)$/i;

function trackedFiles() {
  return execSync("git ls-files", { encoding: "utf8" }).split("\n").filter(Boolean);
}

function isConfigured() {
  try {
    return JSON.parse(readFileSync("data/profile.json", "utf8")).configured === true;
  } catch {
    return false;
  }
}

const configured = isConfigured();
const patterns = configured ? ALWAYS : [...ALWAYS, ...TEMPLATE_ONLY];
const hits = [];

for (const f of trackedFiles()) {
  if (f === SELF || !TEXT_EXT.test(f)) continue;
  let content;
  try {
    if (statSync(f).size > 2_000_000) continue;
    content = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  content.split("\n").forEach((line, i) => {
    for (const re of patterns) {
      const m = line.match(re);
      if (m) hits.push({ f, n: i + 1, why: m[0], line: line.trim().slice(0, 120) });
    }
    if (!configured) {
      for (const em of line.match(EMAIL) || []) {
        if (!EMAIL_ALLOW.test(em)) hits.push({ f, n: i + 1, why: em, line: line.trim().slice(0, 120) });
      }
    }
  });
}

/** 占位完整性：模板态下，site.config 的身份默认应仍是中性占位 */
const placeholderProbs = [];
if (!configured) {
  try {
    const cfg = readFileSync("src/site.config.ts", "utf8");
    if (!/Alex Rivera/.test(cfg))
      placeholderProbs.push("src/site.config.ts: ownerName 默认占位应为 'Alex Rivera'（模板态）");
    if (!/your-username\/your-repo/.test(cfg))
      placeholderProbs.push("src/site.config.ts: githubRepo 默认占位应为 'your-username/your-repo'（模板态）");
  } catch {
    placeholderProbs.push("src/site.config.ts: 读不到");
  }
}

if (hits.length || placeholderProbs.length) {
  console.error("✗ 去标识化检查未通过（铁律：仓库不得含源作者个人信息）\n");
  for (const h of hits) console.error(`  ${h.f}:${h.n}  「${h.why}」  ${h.line}`);
  for (const p of placeholderProbs) console.error(`  ${p}`);
  console.error(`\n共 ${hits.length} 处命中 + ${placeholderProbs.length} 处占位问题。`);
  process.exit(1);
}
console.log(`✓ 去标识化检查通过（${configured ? "已配置态" : "模板态"}）：未发现源作者个人信息。`);
