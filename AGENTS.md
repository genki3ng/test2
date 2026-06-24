# AGENTS.md

OfferOS 是一个「你 + AI」协作管理整场求职的系统（Next.js 站点 + 仓库内 markdown/JSON 作数据库；
push `main` → Vercel 自动重建）。这份文件给 **Codex 及任何读 AGENTS.md 的 agent**；Claude Code 另见
[CLAUDE.md](CLAUDE.md)。两者遵循同一套流程。

## 接手第一件事：是否需要 onboarding

```bash
cat data/profile.json
```

如果 `configured` 不为 `true`（或身份仍是占位 "Alex Rivera" / 仓库仍是 `your-username/your-repo`），
说明仓库还是**模板态**：请按 **[SETUP.md](SETUP.md)** 采访用户并把仓库配置成他们的
（写 `data/profile.json` 设 `configured: true`、重置 `data/tracker.json`、重写 `profile/target.md`、
按所选角色充实 `prep/<role>/`、设 `NEXT_PUBLIC_GITHUB_REPO`、引导部署 Vercel + 配 PAT）。
用户也可直接用站点 `/onboard` 向导。

## 日常协作

- 单一事实来源是仓库文件；站点只渲染。改完直接 commit、push `main`。
- 维持 [STYLEGUIDE.md](STYLEGUIDE.md) 的**数据格式契约**（tracker.json、公司「当前 opening」、
  referrals、question-bank、sprint-plan、profile.json / 角色），否则解析器会坏。
- 改了 `src/` 代码先 `npm run build` 自检再 push。

## 开发铁律：去标识化

仓库**不得包含任何他人个人信息**（姓名、雇主、私人邮箱、他人的真实公司进度等）。
所有展示身份一律走 `getSiteConfig()` / `data/profile.json`，**绝不写死**。
提交前 `npm run check` 必须通过（已接进 `npm run build`）。
