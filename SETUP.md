# SETUP — 把 OfferOS 变成你的（给 Claude / Codex 看的引导脚本）

这份文件是**给 AI agent 看的**部署 + 配置脚本。无论你是 **Claude Code** 还是 **Codex**：
若 `data/profile.json` 的 `configured` 不为 `true`（或站点仍显示占位身份 "Alex Rivera" /
仓库仍是 `your-username/your-repo`），就按下面的步骤**采访用户并把仓库配置成他们的**。

> 背景：OfferOS 是一个「你 + Claude」协作管理整场求职的系统，仓库里的 markdown / JSON 就是数据库，
> Next.js 站点只是看板（push `main` → Vercel 自动重建）。约定见 [CLAUDE.md](CLAUDE.md)，
> 数据格式契约见 [STYLEGUIDE.md](STYLEGUIDE.md)，人用上手版见 [GETTING-STARTED.md](GETTING-STARTED.md)。

## 0. 先判断是否需要配置

```bash
cat data/profile.json   # configured: true → 已配置，无需 onboarding；否则继续
```

## 1. 采访用户（onboarding interview）

依次问（与站点 `/onboard` 向导同一组问题）：

1. **名字** + 头像缩写（1–3 字符，可从名字自动取）。
2. **目标角色**：DS / DE / SWE / PM / ML —— 见 [`src/config/roles.ts`](src/config/roles.ts)。决定题库、面试轮次、北极星模板。
3. **当前级别 → 目标级别**（角色有预设，见 roles.ts 的 `levelPresets`）。
4. **地区 / 工作形态**（remote / hybrid / onsite + 城市偏好）。
5. **是否需要签证 sponsorship**。
6. **目标公司**（几家即可，先有再加）。
7. **北极星一句话** + **问候口头禅**（北极星留空可用角色模板自动生成）。

## 2. 写配置（**别手改 `src/site.config.ts`**；身份/角色走 `data/profile.json`）

- 写 `data/profile.json`：把上面答案写进去，**`configured` 设为 `true`**。字段见 `src/lib/data.ts` 的 `Profile` 接口
  （ownerName / ownerInitials / motto / northStar / role / currentLevel / targetLevel / location / visaSponsorship / targetCompanies）。
  站点的身份与北极星由 `getSiteConfig()` 读它并按 `NEXT_PUBLIC_* > profile.json > 默认` 合并。
- 重置 `data/tracker.json`：把示例公司换成用户的目标公司（schema 见 STYLEGUIDE「tracker.json」：
  `name / slug / careers / role / tier / status / perm / referral / next`）。
- 重写 `profile/target.md`：用答案填首要动机 / 级别 / 地区 / 签证 / 公司（保留中文小标题）。
- **充实所选角色的备战 pack** `prep/<role>/`：按 roles.ts 里该角色的 `prepCategories` 补题库与各板块，
  守 question-bank 格式契约（`## 类别` → `### [id] 题` → `**要点**`）。
- 设置 `NEXT_PUBLIC_GITHUB_REPO`（= 用户的 `owner/repo`）—— 站内编辑/写通道靠它。**只能用环境变量，不进 profile.json。**

> 用户也可以不靠你、直接在站点 `/onboard` 用向导完成（有 PAT 就直接提交；没 PAT 会给出可粘贴给你的指令）。

## 3. 安装与本地校验

```bash
npm install
npm run check     # 去标识化铁律检查（必过）
npm run build     # = check + 简历导出 + next build；构建过 = 可上线
npm run dev       # http://localhost:3000 本地预览
```

## 4. 部署到 Vercel

1. 到 https://vercel.com/new 导入用户的 GitHub 仓库（框架由 `vercel.json` 锁定为 Next.js，无需额外配置）。
   - 一键模板按钮（README 里也放了）：`https://vercel.com/new/clone?repository-url=https://github.com/<owner>/<repo>`
2. 在 Vercel 项目 → Settings → Environment Variables 配：
   - `NEXT_PUBLIC_GITHUB_REPO = <owner>/<repo>`（必配）
   - `SITE_PASSWORD = <一个密码>`（强烈建议：给站点加密码门，见 `src/middleware.ts`）
   - 可选 `NEXT_PUBLIC_ROLE`（覆盖 profile 的角色）、`NEXT_PUBLIC_OWNER_NAME` 等。
3. 之后每次 push `main` → 自动重建上线。

## 5. 配 GitHub PAT（站内编辑 + Web Clipper 共用一把）

1. GitHub → Settings → Developer settings → **Fine-grained personal access tokens**。
2. Repository access：只选用户这个仓库；Permissions → **Contents: Read and write**。
3. 在站点 `/settings` 填入（存浏览器 localStorage，**不进仓库**）。勾任务 / 改状态 / 派活 / onboarding 写回都靠它。

## 6. 装浏览器收集插件（可选但推荐）

`tools/web-clipper/` 是 OfferOS suite 的输入层：把任意网页的面经/JD/截图一键存进仓库 `inbox/`。
按 [`tools/web-clipper/README.md`](tools/web-clipper/README.md) 加载未打包扩展，用同一把 PAT 指向用户仓库。

## 6.5 给 agent 装联网情报能力（云端会话强烈推荐）

OfferOS 的一大优势：自带一份打过补丁、可直接用的 **Agent‑Reach** 快照
（[`tools/agent-reach/`](tools/agent-reach/)）+ 一页实测过的抓取通路手册
（[`tools/web-reach.md`](tools/web-reach.md)）。在 **claude.ai/code 云端会话**里跑一条命令，
你（agent）就拥有真正的联网情报能力，可主动替用户找工作情报：

```bash
bash tools/agent-reach/setup.sh        # 一条命令装好；`agent-reach doctor` 体检各渠道
```

装好后能做（详见 web-reach.md，均为公开页/公开 API 的低频读取，注意限流与礼貌）：
- 读 **LinkedIn 职位页/搜索**（Jina 游客视图，含 JD 正文 + 薪资带）；
- 打 **Workday cxs / Greenhouse / Ashby / Eightfold 等 ATS API** 扫各家在招岗；
- **Exa 全网语义搜索**（免 API key，`config/mcporter.json` 已配；支持 `category:company/people`）；
- 抓 **YouTube / B 站字幕**（yt-dlp）等。

> 本地会话外网通常关闭，这些通路只在云端会话可用。给链接 Claude 跑不出内容，但**抓成文件/调 API 能读**。

## 7. 去标识化铁律（开发铁律）

仓库**不得包含他人个人信息**。所有展示身份一律走 `getSiteConfig()` / `data/profile.json`，**不写死**。
`npm run check`（已接进 `npm run build`）会扫源作者标识 + 模板态占位完整性；提交前必过。详见 [CLAUDE.md](CLAUDE.md)。

---

配置完成后：提交并推送，告诉用户站点 ~1 分钟后重建上线，然后按 CLAUDE.md 的 session 仪式开始日常协作。
