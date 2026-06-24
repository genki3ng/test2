# 准备（Prep）— Software Engineer 版

> 📌 **当前冲刺**：练手前 2–3 周计划见 [sprint-plan.md](sprint-plan.md)（Coding 每天保温 + System Design 重点投入）。
> 🎯 抽题练习读 [question-bank.md](question-bank.md)（喂 /practice 练习台）｜🎤 [mock-interview-bank.md](mock-interview-bank.md)（题库+自评表）｜🏢 [company-specific-prep.md](company-specific-prep.md)（各公司定制）。
> 按 **Software Engineer（SWE）** title 组织。下面四大板块即多数大厂 SWE 的标准轮次。
> ⚠️ 不同岗位侧重不同：前端/后端/基础架构/ML Infra 的 System Design 与语言要求不一样；新毕业 vs 资深，System Design / OOD 权重差很多。确认目标 JD 后告诉 Claude，框架按需调。

## 四大板块（= 标准面试轮次）

| 板块 | 目录 | 重点 |
|---|---|---|
| **Coding（DS&A）** | [coding/](coding/) | 算法与数据结构：数组/哈希/双指针/滑窗/二分/BFS-DFS/回溯/DP/堆/图 + 复杂度 + edge case |
| **System Design** | [system-design/](system-design/) | 大型分布式系统设计：需求澄清→估算→API→数据模型→组件→扩展（缓存/分片/复制/MQ/一致性/限流） |
| **OOD / LLD** | [ood/](ood/) | 面向对象/低层设计：类建模、SOLID、设计模式、并发要点（停车场/电梯/图书馆） |
| **Behavioral** | [behavioral/](behavioral/) | STAR、技术 ownership、冲突/分歧、跨团队协作、失败复盘 |

## 典型 SWE 面试轮次

多数大厂 onsite/虚拟 onsite 由这几类轮次拼成（具体数量按公司/级别变）：

1. **Coding（DS&A）×1–3**：白板/共享编辑器现场写中等难度算法题，边写边讲；考的是问题分解、正确性、复杂度、沟通，而非偏题怪题。
2. **System Design ×0–2**：给一个大型系统（短链、Feed、聊天、限流器…），从需求澄清到可扩展架构。**中高级（含资深）必考，权重高**；新毕业常没有或很浅。
3. **OOD / LLD ×0–1**：面向对象建模（停车场、电梯…），考类设计、SOLID、设计模式、可扩展性，有时带并发。部分公司并入 coding 轮。
4. **Behavioral ×1**：经历、协作、冲突、ownership、失败复盘；资深岗更重影响力与跨团队领导。

> 先确认目标公司的**轮次构成**（去 [company-specific-prep.md](company-specific-prep.md) 收集面经反推）再分配精力——别在不考的板块上浪费时间。

## 用 AI 备战的 4 步法（核心循环）

每道题、每个板块都跑这个循环，**重在「自己先讲」而非「看答案」**：

1. **抽题**：从 [question-bank.md](question-bank.md) 抽一道（或在 /practice 练习台随机抽），先别看要点。
2. **出声讲**：限时 2–5 分钟（coding 25–35 分钟）出声把思路/解法讲一遍——**说出来**比心里想暴露的漏洞多 10 倍。
3. **看要点 + 自评**：对照题目下的「要点」（评分锚点，非标准答案），按 😣 不会 / 😐 磕绊 / 😎 流畅 自评，自动落 [practice-log.md](practice-log.md)。
4. **（可选）交批改**：把你的口述/代码贴给 Claude，让它当面试官挑硬伤、追问、给更优解与 follow-up。

> Claude 会读 [practice-log.md](practice-log.md) 找你的薄弱题型，针对性出补强材料。**会暴露弱点 > 刷题数量。**

## 节奏建议

- **Coding 像练琴**：每天少量、长期保手感，比临考突击有效得多。
- **System Design / OOD 重「讲清取舍」**：不是背架构，是能现场推导并解释 why。多做录音复盘。
- **Behavioral 别裸考**：定稿 2–3 个强 STAR 故事，能从不同角度复述。

## 工作流

1. 选定目标公司 → 去 [company-specific-prep.md](company-specific-prep.md) / 面经收集，反推该公司 SWE 考点（几轮 coding？有无 system design / OOD？语言/领域偏好？难度？）。
2. 把考点拆进 coding / system-design / ood / behavioral 的 TODO 与 [sprint-plan.md](sprint-plan.md)。
3. 每天跑 4 步循环，practice-log 攒数据。
4. 每场面试后把真实题回填对应 [pipeline/companies/*.md](../../pipeline/companies/) 与 [company-specific-prep.md](company-specific-prep.md)。

## 推荐资源（按需，别贪多）

| 主题 | 资源 | 用处 |
|---|---|---|
| Coding 刷题 | LeetCode（按 tag/公司高频）、NeetCode 150 / Blind 75 | 覆盖高频题型，按薄弱点刷而非盲刷 |
| Coding 模式 | 「Grokking the Coding Interview」(模式归类) | 把题归到滑窗/双指针/BFS 等模式，举一反三 |
| System Design | 「System Design Interview」(Alex Xu, vol 1&2)、DDIA《数据密集型应用系统设计》 | 框架 + 经典题；DDIA 补一致性/复制/分片原理 |
| OOD | 「Grokking the OOD Interview」、设计模式（GoF / Head First） | 类建模套路 + 常用模式 |
| Behavioral | STAR 框架 + 自己经历盘点 | 故事质量靠自己挖，框架只是壳 |
