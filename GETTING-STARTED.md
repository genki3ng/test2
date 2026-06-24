# 🚀 上手指南 · Getting Started

把这个指挥台从 0 变成**你自己的**求职作战室，以及之后每天怎么和 Claude 协作。站内同款页面在 **/start**。

---

## 0. 这是什么（30 秒）

- 一个**「你 + Claude」协作**的求职管理系统：计划 / 准备 / 投递 / 内推 / 面试 / 谈判 / 复盘。
- 仓库里的 **markdown 文件就是数据库**；这个网站是只读看板 + 轻量交互。**真正干活在 Claude Code 的对话里**，网站负责让你一眼看清局面。
- 三个记忆文件让任何新会话都能接上：`CLAUDE.md`（长期约定）、`HANDOFF.md`（进行中快照）、`log/journal.md`（历史流水）。

---

## 1. 从 0 开始（5 步）

### ① 拿到代码
在 GitHub 点 **「Use this template」**（推荐）或 Fork，生成**你自己的私有仓库**。

### ② 部署到 Vercel
把仓库导入 [Vercel](https://vercel.com/new)（或用 README 顶部的一键 **Deploy** 按钮）。framework 会被识别成 Next.js（`vercel.json` 已锁定）。在 Vercel 环境变量里配 **`NEXT_PUBLIC_GITHUB_REPO = 你的 owner/repo`**。之后**每次 push 到 `main` 都会自动重建上线**。
> 也可以纯本地用：`npm install && npm run dev`。

### ③ 加把锁 🔒
你的求职数据不该公开。二选一：
- 在 Vercel 项目里加环境变量 **`SITE_PASSWORD`**（内置中间件会启用密码门，cookie 30 天）；或
- 打开 **Vercel Authentication**（部署保护）。

### ④ 配成你的身份与角色（推荐用向导）
部署后打开站点，未配置时首页会引导你进 **`/onboard` 向导**：回答名字、**目标角色（DS / DE / SWE / PM / ML）**、当前/目标级别、地区、签证、目标公司、北极星——它会把身份写进 `data/profile.json`、重置 `data/tracker.json`、重写 `profile/target.md`，并**选好对应角色的备战题库**。
- 有 PAT（见下）→ 向导直接写回仓库；没有 → 给你一段可粘贴给 **Claude / Codex** 的指令。
- 也可以一开始就**把仓库交给 Claude / Codex**，按 **[SETUP.md](SETUP.md)** 引导（含同一套采访 + 部署）。

> 手动派也行：身份默认在 [`src/site.config.ts`](src/site.config.ts)（或同名 `NEXT_PUBLIC_*` 环境变量覆盖）；`NEXT_PUBLIC_GITHUB_REPO` = 你的 `owner/repo`（**必配**）；`NEXT_PUBLIC_ROLE` 可覆盖角色。

**想在网站上直接编辑/派活**（勾任务、改公司状态、内推推进、📨 派活、跑 /onboard 写回）：去站内 **⚙️ /settings** 配一个 GitHub **fine-grained PAT**——权限只给**这一个仓库**的 **Contents: Read & Write**。token 存浏览器本地（localStorage），**不入库**。

### ⑤ 填上你自己
把虚构样例换成你的真实情况（见下面第 3 节）。可以直接让 Claude 帮你写。

---

## 2. 之后每天怎么交互（the loop）

在 [claude.ai/code](https://claude.ai/code) 把这个仓库接上（手机/网页都行），然后：

1. **开场** — 对 Claude 说：*「读 CLAUDE.md 和 HANDOFF.md，复述现状」*。它立刻知道你进行到哪。
2. **推进** — 直接说要做啥：
   - 「按 Northwind 这个 JD tailor 一版简历」
   - 「出 3 道 A/B 实验的题，我口述你点评」
   - 「帮我起草给 Jordan 的内推邮件」
   - 「我刚面完 X，帮我复盘并记一条」
3. **看板** — 在网站上勾任务、改公司状态、内推一键推进、📨 **派活**（写进 `inbox/`，下个 session 开场自动处理）。
4. **收尾** — 让 Claude **更新 `HANDOFF.md` + 记一条 `journal` + `commit & push`**。Vercel 自动重建，网站即刻同步。

> 为什么这套有用：云端会话结束会被归档，**下一个会话只靠 `HANDOFF.md` 接上**。坚持收尾仪式，进度就不会丢。

---

## 3. 把样例换成你自己的

| 文件 | 是什么 |
|---|---|
| `src/site.config.ts` | 你的名字 / 北极星 / 仓库（站点身份） |
| `profile/candidate-profile.md` | 你的背景与成就（简历 + 行为面的底料） |
| `profile/target.md` | 你的北极星与硬约束 |
| `profile/resume/master.md` | master 简历（构建时自动导出 docx/HTML/PDF） |
| `data/tracker.json` | 你的目标公司与各家进度 |
| `pipeline/companies/<slug>.md` | 每家公司的 dossier（参照 `_TEMPLATE.md`） |
| `pipeline/referrals.md` | 你的内推渠道 |
| `prep/<role>/*` | 你所选角色的题库与笔记（DS/DE/SWE/PM/ML 各一套；`/onboard` 选定角色，Claude 按你目标精炼） |
| `HANDOFF.md` | 把「上手清单」换成你真实的求职任务 |

**当前的虚构占位**（放心删）：候选人 **Alex Rivera @ Brightwave**；公司 **Northwind / Vertex Cloud / Helios Media**；内推人 **Jordan Lee / Sam Patel**；所有 `@example.com` 邮箱。

---

## 4. 小贴士 & 排错

- **改了 markdown 数据**：正常 `git push`（或在站上改，它替你 commit）。Vercel 约 1 分钟重建。
- **改了网站代码（`src/`）**：push 前先 `npm run build` 自检。
- **简历导出**：任何含 `## Professional Experience` 行的 `profile/resume/*.md` 会自动导出 docx/HTML 到 `public/exports/`（已 gitignore、被密码门盖住），下载链接在 /docs。
- **格式契约**：改 tracker / 公司「当前 opening」/ referrals 等核心表时，遵守 [STYLEGUIDE.md](STYLEGUIDE.md)「数据格式契约」，解析器才稳。
- **站内编辑没反应**：检查 /settings 里的 PAT 是否对**当前仓库**有 Contents 写权限，以及 `src/site.config.ts` 的 `githubRepo` 是否指向你自己的仓库。

祝找工作顺利 💪 —— 有任何一步卡住，直接问 Claude。
