# inbox/ —— 收集箱

浏览器扩展 [tools/1p3a-recent-highlighter](../tools/1p3a-recent-highlighter/) 把你在网上捕获的
**面经 / JD / 签证信息 / 截图**直接存到这里（你登录的浏览器 → GitHub，绕过登录墙/Cloudflare）。

## 文件长这样

- 文字：`YYYY-MM-DD_HHMM_{type}_{slug}.md`，带 frontmatter：
  ```
  ---
  captured_at: 2026-06-03T21:34:25.000Z
  source_url: https://www.1point3acres.com/bbs/thread-...
  source_title: "[面试经验] 某公司 product ds 店面"
  type: [mianjing]      # mianjing 面经 / jd / visa / request 站点派活 / other
  tags: []              # 留给 Claude 填
  status: new           # Claude 处理后改 done
  ---
  <正文 / 粘贴的文字>
  ```
- 截图：同名 `.png`，并在 `.md` 里以 `![screenshot](...)` 引用。
- **站点派活**（网页指挥台 📨 按钮写入）：`type: [request]` + `kind:` 字段细分，见下方 SOP。

## 站点派活（type: request）按 kind 处理 SOP

| kind | Claude 处理动作 |
|---|---|
| 出题练习 | 按 [prep/question-bank.md](../prep/question-bank.md) 格式契约追加题目（参考 practice-log 薄弱点） |
| 准备材料 | 写/扩对应 prep 文件（cheatsheet 补节、新练习等） |
| Mock 面试 / 批改 | 按 [mock-interview-bank 自评表](../prep/mock-interview-bank.md) 6 维打分点评 → 结果记 practice-log + 坑点回填对应 cheatsheet |
| 扫岗/调研 | 按 [tools/web-reach.md](../tools/web-reach.md) 通路执行，更新公司文件/intel |
| 面试日程 | ① 记入公司文件「关键日期」表；② 生成面前速备包 `prep/briefs/YYYY-MM-DD-<co>-<round>.md`（pitch/考点 top5/必问含 PERM 话术/红线）；③ tracker 下一步加 `⏰MM-DD` |
| 投递记录 | 记入公司文件「投递记录」表（含 quota 记账）+ 同步 tracker 状态/referrals 状态 |
| 面试复盘 | 回填公司文件「逐轮记录」；`#卡壳` 拆成 prep 练习/题库新题；`#情报`（PERM/comp/流程）分发到 PERM 格 / comp-research / 关键日期 |
| 拍板决策 | 落实决定到 tracker/target/相关文件，清掉 HANDOFF 对应待拍板项 |
| 改简历 | 按 master.md tailor（记得删 IC6 标注） |
| 其他 | 自行判断归位 |

> 处理完统一：原件移 `archive/YYYY-MM/`（或 status: done），journal 记一条。

## Claude 每次开场要做的（见 CLAUDE.md 开场仪式）

1. 扫 `inbox/`，挑出 `status: new` 的项。
2. 读内容（含截图——能直接看图 OCR），**打标签 + 总结**，归档到对应位置：
   - 面经 → `prep/company-notes/<公司>.md`（或面经汇总）
   - JD → `intel/jd/`（按需新建）
   - 签证 → `visa/`（按需新建）
3. 处理完：原件移到 `inbox/archive/YYYY-MM/`（或把 frontmatter 的 `status` 改 `done`），并在
   [log/journal.md](../log/journal.md) 记一条。

> 这样你只管在浏览器里"收集"，剩下整理交给下次对话的 Claude。
