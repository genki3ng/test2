# STYLEGUIDE.md — 求职指挥台网站规范

> CLAUDE.md「未来」预告的网站已落地（2026-06-10）。本文 = 网站的技术与文案约定，给后续改网站的 session 看。

## 架构一句话

**Next.js 15（App Router）放在仓库根**，构建时直接解析仓库里的 markdown 当数据源（`src/lib/data.ts`）——**没有数据库**。push 到 `main` → Vercel 自动重建 → 网站即最新。

## 目录

| 路径 | 内容 |
|---|---|
| `src/lib/data.ts` | 全部解析器（tracker / 公司「当前 opening」/ referrals / 勾选框进度 / journal / JD / HANDOFF）+ **身份与角色**：`getProfile` / `getActiveRole` / `prepPath` / `getSiteConfig` / `isUnconfigured`（读 `data/profile.json`） |
| `src/config/roles.ts` | **角色注册表**（DS/DE/SWE/PM/ML）：每角色的面试轮次、备战板块（= `prep/<slug>/` 子目录）、北极星模板、级别预设 |
| `src/lib/parse.ts` | **纯解析（无 fs）**：tracker 表 + 公司「当前 opening」——构建端 `data.ts` 与浏览器实时层（pipeline 页 LivePipeline）共用同一份逻辑；改这里两端都变，改完必跑 `npm run build` |
| `src/lib/markdown.ts` | marked 渲染 + 仓库内 `.md` 链接改写成站内路由（公司文件 → `/companies/<slug>`，白名单内 → `/docs/...`，其余 → GitHub） |
| `src/lib/githubClient.ts` | 浏览器写通道：GitHub Contents API + 全部 markdown 变换纯函数（打勾/改状态/追加行/派活） |
| `src/components/` | 交互组件：Prose（可勾选渲染）/ AskClaude（派活弹窗）/ **TaskList（防误勾任务列表：双向勾选、勾完留原位划线、已完成折叠可取消）** / **DailyGuide（首页今日 SOP 四步条，规则 → prep/daily-routine.md）** / **ReferralKit（内推邮件生成器：渠道模板 × 岗位库勾选 → 一键复制；弹窗须 portal 到 body——液玻 backdrop-filter 会劫持 fixed 定位）** / **ColdOutreachKit（缺内推公司的解决 flow：LinkedIn 冷启动 / 熟人 / 放弃，决策写 tracker Referral 列）** / TodayCard / AgendaList / ReferralAdvance / QuickPanel |
| `src/app/` | 页面：`/` 总览 · `/jobs` 岗位库 · `/pipeline` · `/agenda` 日程 · `/companies/[slug]` · `/referrals` · `/practice` 练习台 · `/prep` · `/intel` · `/journal` · `/docs(/[...slug])` · `/settings` |
| `src/middleware.ts` | 可选密码门：Vercel 设 `SITE_PASSWORD` 环境变量即启用（cookie 30 天）；不设则全站公开 |
| `tools/build-resume-exports.mjs` | **构建第一步**（`npm run build` 串联）：把简历 md 自动导出成 docx + 打印版 HTML 到 `public/exports/`（gitignored；密码门盖住），/docs 挂下载链接 |
| `vercel.json` | 强制 framework=nextjs（防项目导入时误判 preset） |

## 数据格式契约（写 markdown 时维持，解析器才稳）

- **tracker = `data/tracker.json`（2026-06-20 起，不再是 `pipeline/tracker.md` 表格）**：`{ "companies": [ { name, slug, careers, role, tier(1/2/3), status, perm, referral, next } ] }`。`getTracker()` 读它（坏了回退老 tracker.md 解析）；站点改状态/下一步/内推 = `saveTrackerField` 按 `name` 定位、改字段、写回 JSON（比老的 markdown 整格字符串匹配稳得多）。**`status` 用状态模型词**（公司卡下拉直改）；`next` 带日期用 `⏰MM-DD ` 开头（/agenda 聚合）；`perm`/`referral`/`next` 可含行内 markdown（站点 `renderInline` 渲染）。`pipeline/tracker.md` 已退役成指路 stub。**新增/改公司：编辑 `data/tracker.json`；公司详情页仍读 `pipeline/companies/<slug>.md`（散文 dossier + 「当前 opening」「关键日期」段）。**
- **公司文件「当前 opening」段**：一行一岗 `- ⭐⭐⭐ **岗位名**（地点）— 说明 → [链接](url)`；嵌套子弹也算岗位。**说明行**用 `注：/备注：/含义：/入口：/暂按` 或 `⚠️/📋` 开头（会被岗位库过滤）；`❌` 开头且无链接 = "无对口岗"结论行；整体删除线/含"排除" = 已排除（默认隐藏）；**`📌` = 投递清单标记**（定下来要投的岗——/jobs 页可点选切换、写回源行，内推邮件弹窗自动预选、首页 SOP/速览/统计联动）；**`💚` = 心仪 / `🚫` = 不合适·不考虑**（用户态度标记，/jobs 页态度按钮循环 未定→💚→🚫 写回源行，支持按态度排序、"🚫 隐藏不合适"筛选）；**投递进度标记 `📮` 已投 / `🗣️` 面试中 / `🏆` Offer / `🛑` 被拒**（互斥，/pipeline 公司子条目的下拉写回源行）。标记位置都紧跟行首 `- `（多个标记如 `📌 💚 📮` 并存，解析时一并从标题剥离）。
- **岗位库 ↔ pipeline 联动**：`📌` 投递清单 = 单一事实源。/jobs 点 📌 → 该岗作为子条目出现在 **/pipeline 对应公司行下**（可展开/收起、标投递进度 📮🗣️🏆🛑、✕ 移除=取消 📌）；同一 📌 也驱动内推邮件弹窗预选、首页 SOP/统计。改投递进度只写 opening 源行，不动 tracker 状态列（公司级状态仍手动/下拉管）。联动副作用（写在 githubClient）：① 标 `📮已投` → 自动给同公司文件「投递记录」表补一行（去重）；② 标 `📮已投` 且该公司在 referrals 主表**恰好一条**渠道且状态尚早 → 自动推进该渠道到「已投递(日期)」（多条/0 条则不动，避免猜错）；③ /pipeline 公司「状态」旁据 📌 岗进度显示 `💡 已投/面试中/Offer` 提示（不覆盖状态下拉）；④ 首页「在招岗位」卡 + /agenda「📌 投递待办」+ 首页同名卡列出 📌-未投 / 🗣️面试中 岗。
- **pipeline 页实时层（v3.10，同 LiveInbox 模式）**：配 token 的浏览器挂载后直读仓库 `data/tracker.json` + 全部公司文件（并行 16 个 GET），「状态」「📌 子条目」「💡 进度提示」即时刷成最新——刚在 /jobs 点的 📌 不等重建就出现在 /pipeline；本会话已手改过的格带 dirty 标，不被实时数据覆盖；无 token / 读失败保持构建快照（页脚角标显示当前模式）。快照 0 📌 的公司子条目行也恒挂载（CSS `td:empty` 折叠），等实时层灌数据。
- **公司文件「关键日期」段**：表格（事件/日期时间/对接人/备注），日期 `YYYY-MM-DD` → /agenda 自动聚合倒计时；裸 bullet 带日期也能解析（旧格式兼容）。「投递记录」表（日期/岗位 req/渠道/状态/follow-up）记投递台账。「快记」段（站点追加）保持在文件末尾，Claude 定期归位。
- **referrals.md**：主表 ≥6 列（公司/内推人/联系方式/…），取行数最多那张；**第一列须全表唯一**（站点按它定位行）；状态列格式 `已联系(YYYY-MM-DD)`（站点推进按钮自动盖日期，超 3 天显示催办提示）。
- **角色与身份 = `data/profile.json`**：`{ schemaVersion, configured, ownerName, ownerInitials, motto, northStar, role, currentLevel, targetLevel, location, visaSponsorship, targetCompanies, createdAt }`。**当前激活角色** = `getActiveRole()`，优先级 `NEXT_PUBLIC_ROLE > profile.role > ds`；角色定义（轮次/板块/北极星模板）在 `src/config/roles.ts`（slug ∈ `ds/de/swe/pm/ml`）。站点身份由 `getSiteConfig()` 读 profile 合并（`NEXT_PUBLIC_* > profile.json > site.config 默认`）。`/onboard` 向导与 SETUP.md 都写这个文件并把 `configured` 设为 `true`。**备战内容一律按 `prep/<role>/...` 组织**（见下）。注意：`tracker.json` 里每家公司的 freetext `role` 是「这条 opening 的岗位名」，与上面的全局角色枚举是两回事，别混。
- **sprint-plan / 各 prep 文件**（位于 `prep/<role>/`，随当前角色解析；`prep/daily-routine.md` 与 `prep/briefs/` 跨角色共享于 `prep/` 根）：`- [ ]` / `- [x]` 勾选框 → 自动算进度；**站点可直接打勾**（按"全文件第 N 个任务行"定位，文本校验兜底）。sprint-plan 周标题格式 `## Week N（M/D–M/D）：…` → 首页"今日聚焦"卡靠它定位当前周。
- **prep/&lt;role&gt;/question-bank.md（练习台题库）**：`## 类别` → `### [id] 题目一行` → 题干补充（可选）→ 单独一行 `**要点**` → 要点内容。加题必须守这个格式；H2 类别尽量对齐该角色 `roles.ts` 的 `prepCategories.bankCategory`。
- **prep/&lt;role&gt;/practice-log.md**：4 列表（时间/题/自评/备注），站点自评自动追加行（按当前角色路径写）；Claude 据此找薄弱点。
- **journal.md**：每条 `## YYYY-MM-DD（…）— 标题`。
- **referral-outreach-templates.md「C. 渠道邮件模板」**：每模板 = `### 邮件模板：<渠道名>`（与 referrals.md 主表第一列一致；另有三个通用 key：`LinkedIn 连接请求`/`LinkedIn 陌生人 DM`/`熟人内推请求`，供缺口卡「🧭 解决」flow 用）+ `- to:`/`- subject:`/`- note:` 行 + 一个 ```text 代码块正文；占位符 `{{jobs}}`/`{{job_ids}}`/`{{job_title}}`/`{{job_location}}`/`{{company}}` 由站点弹窗自动填充。
- **tracker.md「Referral」列策略标记**（缺口卡写入）：`🔍LinkedIn找人中(日期)` / `🤝熟人引荐中(日期)` / `✖️放弃内推·直接网申(日期)`；`✅` 仍 = 已有渠道。
- **inbox frontmatter**：值后可带行尾 YAML 注释（`status: new  # …`），站点解析会剥掉——但新写入时尽量别依赖。
- **profile/resume/ 简历导出约定**：md 中含 `## Professional Experience` 行 = 简历文档 → 构建时 `tools/build-resume-exports.mjs` 自动出 `public/exports/<姓名>_Resume--<名>.{docx,html}` + manifest.json（`<姓名>` 取自简历首行 `# 标题`），/docs 索引「定位 · 简历」组与该文档详情页挂 ⬇️ 下载链接（docx 转 Google Doc 用；HTML 贴 gdoc / Ctrl+P 出 PDF）。**`## 〔` 开头的〔工作区注记〕节永不导出**。简历 md 须维持结构：`# 姓名` → 下一非空行 headline → 再下一行联系方式；`## 大节`；`### 公司行`；整行 `**…**` = 子小节标题；`- ` bullet；行内 `**粗**`/`*斜*`；改排版去脚本里改（docx+HTML 模板同文件）。
- **HANDOFF.md**（首页只取行动项，不再整段渲染——工程细节留 /docs/HANDOFF）：「🔄 进行中」段里的任务行（`- [ ]`）= 首页「📌 求职主线」卡；「⏳ 待用户决定」段（H2，解析器兼容 H3）顶层 bullet = 首页「待拍板」卡，**已拍板项以 `~~` 开头**留档（首页自动过滤、只计数）。

## 开发铁律：去标识化（De-identification）

OfferOS 是要分享出去的模板 —— **仓库不得包含源作者/任何他人的个人信息**（姓名、雇主、私人邮箱、他人的真实公司进度等）。

- **所有展示身份一律走 `getSiteConfig()` / `data/profile.json`，绝不写死**（这条规则正是 `Greeting` 那次泄漏的教训：组件别再硬编码名字/口号，从服务端 props 拿）。
- 模板态的样例数据只用**虚构占位**：候选人 Alex Rivera、公司 Northwind / Vertex Cloud / Helios Media、`@example.com` 邮箱。
- `tools/check-no-personal-info.mjs` 自动巡检（已接进 `npm run check` 与 `npm run build`）：源作者标识永远硬失败；模板态额外查通用雇主名、真人邮箱、占位完整性（`configured: true` 后这些放行——下游用户填自己的名字/公司是合法的）。**提交前 `npm run check` 必过。**

## 写通道（v2 交互）

- 站点所有写操作 = **浏览器直连 GitHub Contents API**（`src/lib/githubClient.ts`），fine-grained PAT 存 localStorage（/settings 配置，与 1p3a 扩展同一个）→ commit main → Vercel 自动重建（~1 分钟）。
- **结构化字段直改**（按上面契约精准替换单元格/勾选框/追加行）；**自由文本一律走 inbox**（📨 派活 → `type: request` + kind，SOP 见 [inbox/README](inbox/README.md)），由下个 Claude session 归位——客户端永不重排正文。

## 设计系统（2026-06-20 大改版：暖光 · Warm Momentum）

> 2026-06-20 全站重设计：信息架构按「求职旅程」重排，视觉换成 **暖光（Warm Momentum）** 全新 identity。
> **旧的液态玻璃三主题（glass/glass-dark/classic）已退役**，`src/app/themes/glass.css` 已删除，`ThemeToggle`/`THEME_INIT` 改成 light/dark 两套。

- **两主题**，顶栏太阳/月亮胶囊切换（存 `localStorage.jh_theme = "light" | "dark"`，`layout.tsx` 内联 `THEME_INIT` 预绘制防闪烁，默认跟随系统深浅；旧的 `glass*`/`classic` 值视为无效→回落系统）：
  - 默认（`:root` / `[data-theme="light"]`）= **暖光·浅**：暖瓷纸基底 `--bg:#FBF7F2` + 柔和光晕渐变 `--glow`，珊瑚 `--coral` 唯一主行动色，鼠尾草绿 `--sage` = on-track/完成，琥珀 `--amber` = 等待/临近。
  - `[data-theme="dark"]` = **暖光·夜**：同一套语义 token 换暗值。
  - **全部样式都在 `src/app/globals.css`** 一个文件（token + 组件类 + dark 覆盖 + 响应式 + reduced-motion）。
- **token 体系**（都在 `globals.css :root`，dark 在 `[data-theme="dark"]` 覆盖）：调色板（`--coral/-deep/-soft`、`--sage/-deep/-soft`、`--amber/-deep/-soft`、`--plum`、`--ink/-soft/-faint`、`--line`、`--bg/-2`、`--tile`）、形状（`--radius/-sm/-xs`、`--shadow/-lift`、`--ring`）、字号（`--t-xs … --t-3xl`、`--font` 圆体、`--mono`）。**旧语义 token（`--accent/--card/--green/--red/--gold/--tier1..3` 等）已重映射到暖光调色板**，所以老页面不改样式即自动焕新。
- **组件类**：bento 网格 `.bento` + `.c4/.c5/.c6/.c7/.c8/.c12` 跨列；瓦片 `.tile`、卡片 `.card`（同底）；首页专属 `.hero`（唯一下一步）、`.rail/.step`（阶段轨）、`.ring`（倒计时环，在 `Countdown.tsx`）、`.ontrack`、`.checklist`、`.events`、`.moves`、`.wins`、`.funnel`、`.tag`（球在你这边/等回复…）、`.stat.row`。通用 `.card/.stat/.btn/.btn-primary/.btn-ghost/.chip/.pill/.tier-badge/.field/table.data/.prose` 仍在，新组件复用即自动得到暖光皮肤。
- **信息架构（6 个旅程目的地，`layout.tsx` 的 `NAV`）**：今日`/`（bento「今日」首页，`page.tsx`）· 公司`/pipeline` · 备战`/prep` · Offers`/offers`（新，谈判主场，offer 前是预案空态）· 时间线`/timeline`（新，agenda+journal 合并）· ⚙️`/settings`。旧路由 `/jobs /referrals /practice /intel /agenda /journal /docs` 仍在、从相应页面内可达，只是不在顶栏。
- **不写死颜色**：新颜色先加 token 再用，禁止写死 rgba/hex 在组件里。已照顾 `-webkit-` 前缀、`prefers-reduced-motion`（关全部动画）、`:focus-visible` 焦点环、移动端栅格回退。
- 颜色语义沿用仓库 emoji 约定：🟢=green/sage · 🟡=amber · 🔴=red · 👑=gold/PERM day-1；梯队 🥇🥈🥉 各有底色徽章。文案与仓库同一口径（"梯队""下一步""待拍板"）。
- **壁纸**：/settings 上传仍可用（`src/lib/wallpaper.ts` + `layout.tsx` 的 `.wallpaper-layer` + `repoWallpaper()`，配 token 自动 commit `public/wallpaper.jpg` 全设备同步），暖光下作为可选背景照片 + 对比度纱罩。
- **视觉验收**：改样式后 `npx next start -p 3200` + `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tools/site-screenshot.mjs <out>`，对 **light/dark 两主题** 截图亲眼检查再 push（脚本已覆盖 14 个页面）。

## 本地开发

```bash
npm install && npm run dev   # http://localhost:3000
npm run build                # 部署前自检（Vercel 同款构建）
```
