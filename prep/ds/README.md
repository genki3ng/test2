# 准备（Prep）— Data Scientist 版

> 📌 **当前冲刺**：练手前 2–3 周计划见 [sprint-plan.md](sprint-plan.md)（统计/实验快擦亮 + 产品 Sense 重点投入）。
> 🎤 [mock-interview-bank.md](mock-interview-bank.md)（题库+自评表）｜🎯 [company-specific-prep.md](company-specific-prep.md)（各公司定制题）。
> 按 **Data Scientist（DS）** title 组织。默认面向 **Product / Analytics DS** 方向。
> ⚠️ 如果你要投的是 **ML / 建模型 DS**（偏算法/深度学习），考点不同，告诉 Claude，框架要换。

## 四大板块

| 板块 | 目录 | 重点 |
|---|---|---|
| SQL & Python（技术轮） | [sql-python/](sql-python/) | 复杂查询、window/聚合、数据清洗、Python 数据操作 |
| 统计 & 实验（分析执行） | [stats-experimentation/](stats-experimentation/) | 概率统计、假设检验、**A/B 实验设计与解读** |
| 产品 Sense & 指标（分析推理） | [product-sense/](product-sense/) | 定义指标、诊断指标变化、目标设定、取舍 |
| 行为面 Behavioral | [behavioral/](behavioral/) | 英文 STAR、跨职能影响、数据驱动决策 |
| 公司面经 | [company-notes/](company-notes/) | 收集各公司面经，反推考点 |

## 典型 DS 面试轮次（Product/Analytics 方向）

多数大厂 DS 大同小异：

1. **Technical（SQL + Python）**：给数据表/场景，写查询取数、做指标计算；Python 做数据处理。
2. **Analytical Execution（统计 & 实验）**：概率题、假设检验、设计并解读 A/B 实验、样本量/功效、辛普森悖论等坑。
3. **Analytical Reasoning / Product Sense（产品分析）**：为某产品定义成功指标、诊断"某指标掉了 5% 怎么查"、目标拆解与取舍。
4. **Behavioral**：经历、跨职能协作（与 PM/Eng）、影响力、模糊问题中带方向。

## IC5 vs IC6（DS 级别侧重）

- **技术（SQL/Python）**：两级都要扎实、写得快、沟通清楚；IC6 不一定题更难，但要稳。
- **统计/实验**：IC6 更强调**实验方法论的判断**（坑、取舍、何时不该做实验）与对业务的影响，不只是算对。
- **产品 Sense**：IC6 权重高——要从**业务/战略**高度定义指标、框定模糊问题、推动跨团队决策；IC5 侧重把单个分析做扎实。
- **Behavioral**：IC6 重 **影响力 / 跨职能领导 / 把模糊问题带出方向**；IC5 重 ownership 与协作。
- 简历与定位也按目标级别突出对应信号 → [candidate-profile.md](../profile/candidate-profile.md)

## 推荐资源 / 书单（DS）

> 强调**平时积累、非临时抱佛脚**。

| 主题 | 书 / 资源 | 用处 |
|---|---|---|
| 统计基础 | **Statistical Inference** — Casella & Berger | foundation 与原理；bootstrap、delta method |
| 因果推断 | **Causal Inference: The Mixtape** — Scott Cunningham | 面试足够，example 多、讲解优秀 |
| 因果推断（进阶） | **ML & Causal Inference: A Short Course**（Stanford，YouTube） | 想深入 causal 研究的宝藏 lecture |
| 产品 Sense | **Ace the Data Science Interview** — Kevin Huo & Nick Singh | product sense 框架极好、可套用、example 多 |
| 产品分析 | **Lean Analytics** — Alistair Croll | 各行业 metrics 体系（two-sided market / SaaS / social network 怎么 define key metrics） |
| A/B 实验 | **Trustworthy Online Controlled Experiments** — Ron Kohavi | A/B testing 圣经，反复读有不同体会 |

- **用 AI 研究目标公司**：让 Claude 梳理目标公司 business chain（收入/客户/行业）+ 结合书里 industry-wise metrics → 推导该产品主要 metrics 与可能考点。

## 用 AI 备战面试（实操）

1. **先把大方向做对**：面试题是简化过、有标准解的。**最先且最容易拿分的是大方向**——该公司核心业务、核心 metrics、north-star。别一上来抠细节。问 Claude："X 公司是 three-sided market 吗？每个 side 服务什么？north-star metric 是什么？"
2. **吃透目标组 + JD**：让 Claude 列该组业务的 painpoint，**再不停 deep dive**，把抽象问题具体化成可能的面试题。
3. **找 paper / blog 补差异化**：让 Claude 推荐该公司核心 DS 问题的 paper/blog（如有网络干扰的 A/B 逻辑、收入长尾大额时的观测因果等）。
4. **过一轮就疯狂挖信息**：从上一轮 interviewer 那里问该组的 challenge / 具体怎么做，**问出来就赚**，对后续轮次帮助巨大。

核心：**会问问题 > 知识本身**。

## 工作流

1. 选定目标公司 → 去 [company-notes](company-notes/) 收集面经 → 反推该公司 DS 考点（偏 product 还是偏 ML？SQL 难度？实验深度？）。
2. 把考点拆进 sql-python / stats-experimentation / product-sense / behavioral 的 TODO。
3. 每场面试后回填面经与反思到对应 [公司文件](../pipeline/companies/)。
