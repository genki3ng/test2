# OfferOS 🎯

> 拿 offer 的操作系统——一个 **「你 + Claude」协作**、端到端管理整场求职的系统：**计划 → 准备 → 投递 / 内推 → 面试 → 谈判 → 复盘**。

仓库里的 **markdown 文件就是数据库**；仓库根同时是一个 **Next.js 站点**，把这些 markdown 渲染成一个可交互的仪表盘。没有别的后端——push 到 `main`，（连了 Vercel 的话）自动重建上线。

> 🧪 当前仓库装的是**虚构样例**（候选人 Alex Rivera；公司 Northwind / Vertex Cloud / Helios Media），让你一眼看到它长什么样。部署后用站内 **/onboard 向导**（或把仓库交给 Claude/Codex 按 **[SETUP.md](SETUP.md)**）一键变成你自己的；人读版见 **[GETTING-STARTED.md](GETTING-STARTED.md)**。

---

## 🚀 快速开始

1. 点 GitHub **「Use this template」** 生成你自己的私有仓库（或用下方一键部署）。
2. 连 **Vercel** 部署，配 `SITE_PASSWORD` 加锁、`NEXT_PUBLIC_GITHUB_REPO` 指向你的仓库。
3. 打开站点 → **`/onboard` 向导**回答几个问题（**目标角色 DS/DE/SWE/PM/ML** + 名字 + 目标公司），它把模板变成你的、并选好对应角色的备战题库。
   - 或者**把仓库交给 Claude / Codex**，按 **[SETUP.md](SETUP.md)** 引导你装依赖、部署、采访配置（一条龙）。
4. 在 **claude.ai/code** 接上仓库，对 Claude 说「读 CLAUDE.md 和 HANDOFF.md，开始帮我找工作」。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/genki3ng/test2)
> ☝️ 用 GitHub **「Use this template」** 生成你自己的仓库后，**首次 push** 时仓库内的一个 GitHub Action 会自动把这个按钮指向**你的**仓库（见 [`.github/workflows/personalize-deploy-button.yml`](.github/workflows/personalize-deploy-button.yml)），无需手动改。

详细步骤 + 之后每天怎么交互 → **[GETTING-STARTED.md](GETTING-STARTED.md)**。

---

## ✨ 它能做什么

- **今日**：bento 首页——阶段轨、唯一下一步、倒计时、本周面试、该你出手了、漏斗。
- **公司 / pipeline**：目标公司库 + 各家进度，状态/内推可直接在站上改。
- **备战**：SQL/统计实验/产品 sense 笔记、可抽题口述的 /practice 练习台、行为面 STAR。
- **Offers**：offer 到来时的对比 + 谈判主场（offer 前是预案）。
- **时间线**：关键日期聚合（/agenda）+ 日志。
- **派活**：在站上 📨 给 Claude 派活 → 写进 `inbox/`，下个 session 自动处理。
- **联网情报**：自带 **Agent‑Reach** + 实测抓取手册——Claude 能直接读 LinkedIn JD、扫各家 ATS 在招岗、用 Exa 全网语义搜公司/人脉情报、拉视频字幕（详见 [tools/web-reach.md](tools/web-reach.md)）。

Claude 在每一步帮你：打磨/按公司 tailor 简历、出题找薄弱点、设计/解读 A/B 实验、模拟产品评审、把经历整理成 STAR、整理面经反推考点、维护进度、comp 调研与谈判话术、阶段复盘。

---

## 🧩 OfferOS Suite（套件）

OfferOS 是一组围绕「仓库即数据库」串起来、也可单独取用的组件：

| 组件 | 位置 | 作用 |
|---|---|---|
| **Dashboard 站点** | `src/` | 把全仓 markdown/JSON 渲染成仪表盘（今日 / 公司 / 备战 / Offers / 时间线） |
| **Web Clipper（浏览器扩展）** | [`tools/web-clipper/`](tools/web-clipper/) | 任意网页的面经/JD/截图一键存进 `inbox/`（套件的输入层） |
| **练习台 /practice** | `src/app/practice` | 抽题口述 + 自评，喂**当前角色**的题库 |
| **内推套件** | `ReferralKit` / `ColdOutreachKit` | 内推邮件生成 + 无内推时的决策流 |
| **inbox 捕获 / 派活 SOP** | [`inbox/`](inbox/) | 捕获与站上「📨 派活」的处理约定 |
| **多角色备战 packs** | [`prep/<role>/`](prep/) | DS / DE / SWE / PM / ML 各一套（题库 + 冲刺 + 板块） |
| **联网情报（Agent‑Reach + 抓取手册）** | [`tools/agent-reach/`](tools/agent-reach/) · [`tools/web-reach.md`](tools/web-reach.md) · `config/mcporter.json` | 一条命令给 Claude/Codex 装上互联网能力：读 LinkedIn 职位、打 Workday/Greenhouse/Ashby 等 ATS API、Exa 全网语义搜索（免 key）、抓 YouTube/B 站字幕 |
| **AI 编排契约** | `CLAUDE.md` / `AGENTS.md` / `SETUP.md` / `.claude/` 钩子 | 交给 Claude/Codex 即可引导部署与日常协作 |

> 角色由 `data/profile.json` 的 `role` 决定（`/onboard` 向导写入），定义见 [`src/config/roles.ts`](src/config/roles.ts)。

> 🛰️ **差异化优势 · 自带联网情报**：多数「求职模板」只是静态看板。OfferOS 内置了一份**打过补丁、可直接用的 [Agent‑Reach](tools/agent-reach/) 快照** + 一页**实测过的[抓取通路手册](tools/web-reach.md)**。在 claude.ai/code 云端会话里 `bash tools/agent-reach/setup.sh` 一条命令，Claude / Codex 就能**真正联网**——抓 JD 正文与薪资带、扫各家 ATS 的在招岗、用 Exa 做公司/人脉语义搜索、拉视频字幕——把"看板"升级成会**主动找情报**的助手，能力远强于普通 agent。

---

## 🧭 目录导航

| 区 | 动作 | 内容 |
|---|---|---|
| [profile/](profile/) | 定位 | [候选人背景](profile/candidate-profile.md) · [北极星](profile/target.md) · [简历](profile/resume/) |
| [strategy/](strategy/) | 计划 | 总策略 · 目标公司 · 时间线 |
| [prep/](prep/) | 准备 | 多角色 packs：DS / DE / SWE / PM / ML —— 各含题库 + 冲刺 + 板块（见 [prep/](prep/)） |
| [pipeline/](pipeline/) | 记录 | [tracker（data/tracker.json）](data/tracker.json) · [各公司](pipeline/companies/) · [内推](pipeline/referrals.md) |
| [negotiation/](negotiation/) | 谈判 | playbook · offer 对比 · comp 调研 |
| [log/](log/) · [summary/](summary/) | 记录/总结 | 流水日志 · 复盘 |

> 协作约定见 [CLAUDE.md](CLAUDE.md)；网站与数据格式契约见 [STYLEGUIDE.md](STYLEGUIDE.md)。

---

## 🛠️ 技术 & 本地开发

Next.js 15（App Router）+ React 19，零数据库（markdown 即数据源）。

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 部署前自检（Vercel 同款构建）
```

可选环境变量：`SITE_PASSWORD`（密码门）、`NEXT_PUBLIC_OWNER_NAME` / `NEXT_PUBLIC_OWNER_INITIALS` / `NEXT_PUBLIC_NORTH_STAR` / `NEXT_PUBLIC_GITHUB_REPO`（覆盖 `src/site.config.ts` 的默认值，不改代码也能个性化）。
