# Mock 面试题库 + 自评表

> 用法：每场 mock 选**1 个轮次**，计时模拟（找同行/interviewing.io，或自己录音自答）。答完用下方**自评表**打分、记坑。
> 目标：每周至少 2 场（建议 1 实验 + 1 产品 sense）。题按 DS Product/Analytics + 你的目标公司校准。

## 如何跑一场 45 分钟 mock
1. 随机抽 1 题，**先澄清 2–3 个问题**再答（别急着冲）。
2. 出声讲思路（结构化），计时。
3. 录音/录屏。结束按自评表打分，把卡壳点记进对应 cheat sheet 的"练习与坑点"。
4. 隔天复看录音——**听自己有没有啰嗦/漏护栏/没回到业务**。

---

## A. SQL / Python（技术轮）
1. 给 `events(user_id, event_date, event_type)`，求**7 日留存曲线**（D1/D7）。→ 参 [warmup-problems](sql-python/warmup-problems.md)。
2. 每个 `category` 收入 **top 3 产品** + 占该类目收入百分比（window + 比例）。
3. 求**连续登录 ≥3 天**的用户（gaps-and-islands：`date - ROW_NUMBER()`）。
4. 漏斗转化：`view→add_to_cart→purchase` 各步留存率，按渠道拆。
5. Python：给一张 DataFrame，算各组的 **CUPED 校正后均值**（groupby + 协变量回归思路）。

## B. 统计 & 实验（分析执行轮）
1. 设计一个 A/B 测"把结账按钮从蓝改绿是否提升转化"——**样本量、时长、主/护栏指标、坑**全讲。
2. 实验只有 **+0.3% lift、p=0.04**，要不要 ship？（实际意义 vs 显著、功效、护栏、长期）
3. 你想测一个**会产生网络效应**的功能（如群聊邀请）。为什么普通 A/B 会偏？怎么设计？（→ cluster/switchback，[因果 cheat sheet](stats-experimentation/cheatsheet-causal-inference.md)）
4. 没法随机化（定价），怎么估因果？（PSM/DiD/RDD 选哪个 + 假设）
5. "can bootstrap reduce variance?" + 怎么给 ratio 指标算方差。（→ [功效/方差 cheat sheet](stats-experimentation/cheatsheet-power-variance.md)）
6. 实验跑到一半看着显著了，能停吗？（peeking → [A/B 坑 cheat sheet](stats-experimentation/cheatsheet-abtest-pitfalls.md)）

## C. 产品 Sense（分析推理轮）
1. 为 **Instagram Reels / YouTube Shorts** 定义成功指标。（→ [practice-define-metrics](product-sense/practice-define-metrics.md)）
2. **DoorDash 某城市配送时长变长了**，怎么诊断？
3. **某 ratio 指标掉了 5%**，结构化排查。（→ [diagnose-ratio-metric](product-sense/diagnose-ratio-metric.md)）
4. 该不该给 Uber 上线"拼车"功能？用数据论证。（marketplace 取舍 → [marketplace cheat sheet](product-sense/cheatsheet-marketplace-metrics.md)）
5. 怎么衡量"通知"功能的价值且不惹恼用户？（增量 + 关推送护栏）
6. 为一个**新的 AI 功能**（如 AI 客服/摘要）定义成功 & 风险指标。（若有 AI/ML 相关经验可结合）

## D. Behavioral（行为面）
> 用你定稿的 STAR + TMAY（[behavioral/README](behavioral/README.md)）。常见触发：
1. Tell me about yourself.（TMAY，60–90s）
2. 最有影响力的项目 / 你最自豪的分析。
3. 一次**用数据改变了别人/PM/领导的决定**。
4. 一次**失败 / 判断错了**，怎么补救、学到什么。
5. 跨职能冲突 / 和 eng/PM 意见不合。
6. 模糊问题、没人给方向时你怎么做。
7. 为什么离开现公司 / 为什么这家公司。（注意保密 + 正向叙事）

---

## 自评表（每场打分，1–5）

| 维度 | 看什么 | 分 |
|---|---|---|
| **澄清** | 答前问了范围/目标/假设？ | |
| **结构** | 有没有框架、不跳步、不啰嗦 | |
| **技术正确** | 统计/SQL/因果有没有硬伤 | |
| **业务连接** | 回到 metric/决策/影响，而非纯技术 | |
| **护栏/取舍** | 主动提坑、counter-metric、trade-off | |
| **沟通** | 清楚、节奏、听得懂、互动 | |

- 本场最大 1 个坑：
- 下次改 1 件事：

> 行为面一致性自查：你的几个 STAR 之间数字/职责别打架；和产品/实验轮举的例子**别自相矛盾**；全部脱敏（无内部代号/同事名/未公开数字）。
