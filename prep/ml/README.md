# 准备（Prep）— Machine Learning Engineer 版

> 📌 **当前冲刺**：练手前 2–3 周计划见 [sprint-plan.md](sprint-plan.md)（ML 系统设计是胜负手 + 基础擦亮 + Coding 保温）。
> 🧠 [question-bank.md](question-bank.md)（练习台 /practice 题库）｜🎤 [mock-interview-bank.md](mock-interview-bank.md)（mock 题+自评表）｜🎯 [company-specific-prep.md](company-specific-prep.md)（各公司定制题）。
> 按 **Machine Learning Engineer（MLE）** title 组织。
> ⚠️ MLE 方向差异大（推荐/排序、NLP、CV、Infra/Platform）。先看目标 JD/组别偏哪块，告诉 Claude，系统设计与深度题要按方向换。

## 四大板块

| 板块 | 目录 | 重点 |
|---|---|---|
| Coding（DS&A） | [coding/](coding/) | 数组/哈希/双指针/BFS-DFS/DP/堆 + 复杂度（与 SWE 同源，精简版） |
| ML System Design | [ml-system-design/](ml-system-design/) | 推荐/排序、特征平台、训练-服务一致、在线/离线评估、A/B、上线监控/回滚 |
| ML Breadth/Depth（基础） | [ml-fundamentals/](ml-fundamentals/) | 偏差方差、正则、评估指标、树 vs 网络、embedding、损失、类别不平衡、特征工程 |
| Behavioral 行为面 | [behavioral/](behavioral/) | STAR、跨团队协作、模型上线事故复盘、ownership |

## 典型 MLE 面试轮次

多数大厂 MLE onsite 大同小异，4 类轮次：

1. **Coding（DS&A）**：与 SWE 同源的算法题（数据结构、双指针、图、DP、堆），要求边写边讲、报准复杂度、覆盖 edge case。通常深度比纯 SWE 略浅，但仍要稳。
2. **ML System Design**：给一个真实场景（推荐流、搜索排序、欺诈检测、信息流去重），从**澄清需求 → 数据与特征 → 召回+精排架构 → 离线/在线评估 → A/B → 上线监控与回滚**走一遍。胜负手在这里。
3. **ML Breadth/Depth（深广度）**：建模与基础原理——偏差方差、过拟合/正则、评估指标怎么选、损失函数、类别不平衡、树模型 vs 神经网络、embedding；可能就你简历里的项目深挖训练细节。
4. **Behavioral**：经历、跨职能协作（与 PM/数据/平台/对端工程）、模型上线事故复盘、ownership、处理模糊与冲突。

## 四步 AI 备战法（喂 /practice 练习台）

每道题循环这四步，比「读答案」有效得多：

1. **抽题**：去练习台 [/practice] 抽一道 [question-bank.md](question-bank.md) 的题（或自选薄弱板块）。
2. **出声讲**：2–5 分钟出声把思路/设计讲一遍，**像在面试里对着面试官**——讲结构、讲取舍，别只在脑子里过。
3. **看要点 + 自评**：对照题目的 `**要点**` 查漏，点自评（😣 不会 / 😐 磕绊 / 😎 流畅）→ 自动落 [practice-log.md](practice-log.md)。
4. **（可选）交批改**：把你的口述/草稿丢给 Claude 要批改——指出硬伤、补你漏掉的取舍、追问 follow-up，逼出深度。

Claude 据 practice-log 的自评找薄弱点，针对性出补强材料与新题。

## 级别侧重（Senior vs Staff）

- **Coding**：两级都要扎实、写得快、沟通清楚；Staff 不一定题更难，但要稳、要讲清取舍。
- **ML System Design**：Staff 权重最高——要从**系统/业务**高度做取舍（漏斗各层、延迟预算、训练-服务一致、监控与回滚），框定模糊问题、推动跨团队；Senior 侧重把单个系统设计扎实、组件清楚。
- **ML 深广度**：Staff 强调**判断与取舍**（为什么这样建模、何时不该上深度模型）、对线上影响负责；Senior 侧重原理正确、训练细节扎实。
- **Behavioral**：Staff 重影响力/跨职能领导/把模糊带出方向；Senior 重 ownership 与协作。

## 用 AI 备战面试（实操）

1. **先把大方向做对**：搞清目标公司核心业务、ML 在哪儿创造价值、核心指标与北极星。别一上来抠细节。
2. **吃透目标组 + JD**：让 Claude 列该组的 ML painpoint（推荐？排序？NLP？CV？平台？），把抽象问题具体化成可能的系统设计题。
3. **找 paper / blog 补差异化**：让 Claude 推荐该公司核心 ML 问题的工程博客/论文（如大规模 embedding 检索、多目标排序、特征平台、模型监控）。
4. **过一轮就疯狂挖信息**：从上一轮面试官那问该组的 challenge / 实际怎么做，问出来就赚，对后续轮次帮助巨大。

核心：**会问问题 + 讲清取舍 > 背知识本身**。

## 工作流

1. 选定目标公司 → 收集面经，反推该公司 MLE 考点（偏系统设计还是深度？Coding 难度？哪个 ML 方向？）。
2. 把考点拆进 coding / ml-system-design / ml-fundamentals / behavioral 的 TODO。
3. 用四步 AI 备战法刷 [question-bank.md](question-bank.md)，自评落 [practice-log.md](practice-log.md)。
4. 每场面试后回填真实题与反思到对应 [公司文件](../../pipeline/companies/)。
