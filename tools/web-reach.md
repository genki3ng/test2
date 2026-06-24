# web-reach.md — 云端 session 抓取能力清单（2026-06-10 实测）

> 起因：评估 [Agent-Reach](https://github.com/Panniantong/Agent-Reach)（见文末评估）。**真正值钱的不是那个包，而是这页验证过的通路**。全部在 claude.ai/code 云端容器实测通过；本地 session 外网关闭、不适用。

## ✅ 已验证通路（按找工作价值排序）

| 通路 | 方法 | 实测结果 |
|---|---|---|
| **LinkedIn 职位页** | `curl https://r.jina.ai/https://www.linkedin.com/jobs/view/<id>/` | ✅ 游客视图全文：JD 正文 + 薪资带 + hybrid/签证条款（多家公司职位页实测成功，~45KB md） |
| **LinkedIn 职位搜索** | `curl https://r.jina.ai/https://www.linkedin.com/jobs/search?keywords=...&location=...` | ✅ 游客视图一页 ~60 个职位链接（公司质量混杂，可加 f_C= 公司过滤） |
| **Workday 站职位列表** | `POST https://<tenant>.wd5.myworkdayjobs.com/wday/cxs/<tenant>/<site>/jobs`，JSON body `{"appliedFacets":{},"limit":20,"offset":0,"searchText":"..."}`，翻页改 offset | ✅ 很多大厂用 Workday；`<tenant>`/`<site>` 看目标公司 careers 域名 |
| **Workday 职位详情** | `GET <同host>/wday/cxs/<tenant>/<site>/job/<externalPath>`，Accept: application/json | ✅ 返回 title/location/jobDescription 全文 JSON |
| **通用 ATS（自建 careers API）** | 不少公司自建 careers 后端，`POST .../loadSearchJobsResults` 之类（header 常需 `x-csrf-token: x`，body 带 query/limit/page） | ✅ 返回匹配 JD；注意各家头衔差异（如有的把 DS 叫 "Scientist"） |
| **Greenhouse 板** | `GET https://boards-api.greenhouse.io/v1/boards/<board>/jobs`（详情加 `?content=true` 或 /jobs/<id>） | ✅ 大量公司用 Greenhouse；`<board>` 通常 = 公司名（个别带后缀，如 `<co>usa`），看其公开申请页 URL |
| **Ashby 板** | `GET https://api.ashbyhq.com/posting-api/job-board/<org>` | ✅ 返回全量岗位 JSON（title/location/jobUrl） |
| **referral 分享页（部分公司）** | 有的公司 careers 提供带内推 token 的分享 URL（卡片含 Job ID + 描述），经 Jina 渲染可读 | ✅ 视公司而定；主搜索页通常匹配质量更好 |
| **Phenom 平台站** | 经 Jina 渲染 `<careers-host>/search-results?keywords=...&from=N`（每页 ~10 条） | ✅ 列表+链接可得（常不含真实地点） |
| **JD 详情（地点真相）** | 抓 JD 页原始 HTML 里的 **JSON-LD 结构化数据**（`<script type="application/ld+json">`，含 jobLocation/资历/正文） | ✅ 有些平台列表与 jina 渲染**都不显示真实地点**——**判地点只能信 JSON-LD** |
| **Eightfold 平台站** | `<company>.eightfold.ai` / explore.jobs.<company>.net | ✅ 可抓列表 |
| **任意网页（含 JS SPA 部分渲染）** | `curl https://r.jina.ai/<URL>` | ✅ 返回干净 markdown；Workday 列表页能渲染骨架但**异步职位列表常停在 Loading**（用上面 cxs API 替代） |
| **Exa 全网语义搜索** | `npm i -g mcporter`（容器每次要装）→ 在 repo 根目录 `mcporter call 'exa.web_search_exa(query: "...", numResults: 5)'`；配置已入库 `config/mcporter.json`（无密钥） | ✅ 免费无 Key；另有 `web_fetch_exa` 读页；query 支持 `category:company / category:people`（LinkedIn 语义搜索） |

## ❌ 验证不可行（别再试）

- **有 Cloudflare challenge 的社区站（如某些面经论坛）**：连 Jina Reader 都 403（"Just a moment..."）→ 唯一通路仍是用户浏览器里的 [Web Clipper 扩展](web-clipper/) 存 inbox/。
- **被 Akamai 等强 WAF 全挡的官网**：`Jina 也 403` → 只能 LinkedIn 游客搜索侧写或用户浏览器。
- **LinkedIn 个人 Profile / 登录态内容**：未验证可行，默认仍按"抓不了"处理（职位页 ≠ Profile）。
- **agent-reach 官方安装**（`pip install agent-reach` / GitHub zip）：PyPI 根本没发包；从源码装会撞 hatchling wheel 构建错误（pyproject 的 force-include 把 guides/skill/scripts 重复打包）。要用得先删 pyproject 里 `[tool.hatch.build.targets.wheel.force-include]` 块。

## ⚠️ 边界与礼貌

- r.jina.ai 免费无 Key 有 IP 级限流（约 20 rpm）——逐条抓 JD 没问题，别并发轰。
- 这些都是公开页面/公开 API 的低频读取；保持小批量、加 sleep，别做成批量爬虫。
- 需要 Cookie 的渠道（Twitter/小红书/linkedin-mcp 浏览器自动化）**不建议碰**：要交真实账号 Cookie，LinkedIn 封号风险高，对找工作收益低（职位页游客视图已够用）。

## 复用脚本

- 扫岗脚本范式（Workday cxs / 自建 ATS）核心就是上表的 POST + 翻页 + 按 title 过滤；需要时让 Claude 现写 10 行 python，别维护一坨脚本。

## 附：Agent-Reach 项目评估（2026-06-10）

- **是什么**：不是爬虫，是"装机脚手架"——帮 Agent 一键装好一批上游开源工具（Jina Reader / yt-dlp / twitter-cli / rdt-cli / Exa MCP / linkedin-mcp…）并注册 SKILL.md，`agent-reach doctor` 体检各渠道。
- **实测**：修掉打包 bug 后装上 v1.4.0，doctor 正常（开箱 3/16：网页/RSS/V2EX）；它的 skill 会自动写进 `~/.claude/skills/`。
- **结论**：找工作高频通路（Jina/Exa/职位站 API）已萃取进上表、零依赖可用；其余社交/视频渠道与找工作无关。有 Cloudflare challenge 的社区站它也没辙。
- **快照已入库（2026-06-10，用户要求）**：打过补丁的源码在 [tools/agent-reach/](agent-reach/)，任何云端 session 跑 `bash tools/agent-reach/setup.sh` 一条命令装好（实测 clean 容器 → doctor 5/16 渠道：网页/RSS/V2EX/Exa/公众号；yt-dlp 在 venv 里）。详见 [tools/agent-reach/VENDOR.md](agent-reach/VENDOR.md)。
- 若未来要社交舆情（公司风评、裁员消息），装完后再按 doctor 提示补对应 CLI（记得用小号 Cookie）。
