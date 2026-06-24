# HANDOFF.md — 进行中快照

最后更新：2026-01-15（**全新模板**：这是个干净的起步状态。先把它变成你自己的，再开始真正的求职。下个 session 先读这里。）

> 文件分工见 [CLAUDE.md](CLAUDE.md)。保持 <200 行，超了归档到 `handoff-archive/YYYY-MM.md`。
> 当前仓库里的数据（Alex Rivera + Northwind/Vertex Cloud/Helios Media）都是**虚构样例**，替换掉即可。

## ⏰ 临近 deadline（3 天内）

- 暂无。把你真实的面试/截止录进各公司「关键日期」表或 tracker「下一步」`⏰MM-DD`，这里和 /agenda 就会自动聚合。

## 🔄 进行中 / 下一步

> 这些 `- [ ]` 会出现在网站首页「求职主线」卡，可直接打勾。下面是**新用户的上手清单**——做完就删掉、换成你真实的求职任务。

- [ ] 跑站内 **`/onboard` 向导**（或把仓库交给 Claude/Codex 按 `SETUP.md`）：填名字、**目标角色（DS/DE/SWE/PM/ML）**、级别、地区、目标公司 → 自动写 `data/profile.json` + 重置 `data/tracker.json` + 重写 `profile/target.md`，并选好对应角色的备战题库
- [ ] 部署到 Vercel + 配 `SITE_PASSWORD`（或开 Vercel Authentication）+ `NEXT_PUBLIC_GITHUB_REPO`；在 /settings 配一个 fine-grained PAT（仅本仓库 Contents 读写）
- [ ] 把 `profile/candidate-profile.md` 换成你自己的；让 Claude 按你的背景写 `profile/resume/master.md`
- [ ] 让 Claude 按你的目标公司精炼当前角色的 `prep/<role>/question-bank.md`（喂 /practice 练习台）
- [ ] 装浏览器收集插件 `tools/web-clipper/`（任意网页的面经/JD 一键入 `inbox/`）

## ⏳ 待用户决定

> 未解决项 = 普通 bullet；已拍板项以 `~~` 开头留档（首页「待拍板」卡自动过滤）。

- 你的级别主攻方向？（Senior 主 / Staff 冲刺，还是别的）
- 地区/remote 偏好？是否需要 sponsorship？

## ✅ 已完成（最近）

- 2026-01-15：从模板初始化项目。
