# 准备（Prep）— Data Engineer 版

> 📌 **当前冲刺**：练手前 2–3 周计划见 [sprint-plan.md](sprint-plan.md)（SQL&建模快打底 + 管道设计重点投入）。
> 🧪 抽题练习 → [question-bank.md](question-bank.md)（喂 /practice 练习台）｜🎤 [mock-interview-bank.md](mock-interview-bank.md)（题库+自评表）｜🎯 [company-specific-prep.md](company-specific-prep.md)（各公司定制题）。
> 按 **Data Engineer（DE）** title 组织。重点是**用可靠、可扩展、低成本的数据系统支撑分析与产品**。

## 四大板块

| 板块 | 目录 | 重点 |
|---|---|---|
| SQL & 数据建模 | [sql-modeling/](sql-modeling/) | 窗口函数、去重、留存/漏斗、维度建模（星型/雪花、SCD）、范式取舍、增量 vs 全量 |
| Coding（Python/Spark） | [coding-spark/](coding-spark/) | Python 数据处理、Spark（shuffle、倾斜、broadcast、分区/并行度、宽窄依赖）、复杂度与内存 |
| 管道 / 系统设计 | [pipeline-design/](pipeline-design/) | 批 vs 流、分区、幂等、回填、数据质量与 SLA、调度 DAG、文件格式、CDC、lakehouse |
| 行为面 Behavioral | [behavioral/](behavioral/) | 英文 STAR、跨团队协作、数据事故复盘、ownership |

## 典型 DE 面试轮次

多数大厂 / 数据团队的 DE 面试由这四类轮次组成（叫法略有差异）：

1. **SQL & Data Modeling（技术 + 建模）**：给数据表/业务场景，写复杂 SQL（窗口、留存、漏斗、去重），并设计/评判一个数仓模型（事实/维度表、星型 vs 雪花、SCD）。考"取数对不对"和"模型合不合理"。
2. **Coding（Python / Spark）**：Python 做数据处理（流式、去重、合并大数据源，讲复杂度与内存）；分布式侧考 Spark——shuffle、数据倾斜、broadcast join、分区与并行度、宽窄依赖。
3. **Pipeline / System Design（管道/系统设计）**：端到端设计一条数据管道——批还是流、怎么分区、幂等与回填、数据质量与 SLA、调度/DAG、CDC、文件格式与 lakehouse。**高级岗的分水岭**。
4. **Behavioral（行为面）**：项目 ownership、跨团队协作（上游业务库团队 / 下游分析与产品）、数据事故复盘、在模糊需求中带出方向。

## 资深岗（高级 / 主任级）侧重

- **设计权重更高**：不只"能写出来"，而是讲清 trade-off、规模、成本、可靠性、可维护性，以及"何时不该这么做"。
- **可靠性思维**：幂等、可回填、数据质量护栏、SLA/SLO、血缘与数据契约是默认要求，不是加分项。
- **跨团队影响力**：推动数据契约、统一口径、立规范，而非一次性救火。
- **行为面**重 ownership 与系统性预防（修流程，不只修这一次）。

## 用 AI 备战面试（四步法）

1. **抽题**：在 [/practice](/practice) 抽一道 DE 题库（[question-bank.md](question-bank.md)）里的题。
2. **出声讲**：限时口述思路与答案，**先别看要点**——模拟真实压力。
3. **看要点 + 自评**：对照题目的 `**要点**` 给自己打分 😣/😐/😎（自动写进 [practice-log.md](practice-log.md)）。
4. **交批改（可选）**：把你的答案丢给 Claude，按 DE rubric 批改、指出硬伤、补薄弱点，并就你卡壳处再出 2 道追问。

> 核心心法：**会问澄清问题 > 直接堆知识**。DE 面试里"先澄清数据规模/延迟要求/口径/边界"几乎总是对的开局。

## 备战流程

1. 选定目标公司 → 抓面经（用扩展存进 [inbox/](../../inbox/)，Claude 处理）→ 反推该公司 DE 考点（SQL 难度？是否重 Spark？建模深度？设计权重？技术栈 Airflow/Snowflake/Databricks…？）。
2. 把考点拆进 sql-modeling / coding-spark / pipeline-design / behavioral 的 TODO 与 [sprint-plan.md](sprint-plan.md)。
3. 每场面试后把真实题回填对应 [pipeline/companies/*.md](../../pipeline/companies/) 与 [company-specific-prep.md](company-specific-prep.md)。

> 收到 prep guide / 面经（PDF、截图、贴文）→ 让 Claude 出速备包进 [briefs/](../briefs/)，并从中**出练习题进 [question-bank.md](question-bank.md)**（守 [STYLEGUIDE](../../STYLEGUIDE.md) 的格式契约）。
