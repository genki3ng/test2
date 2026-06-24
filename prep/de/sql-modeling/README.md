# SQL & 数据建模（DE 技术 + 建模轮）

> 目标：复杂 SQL 写得**又快又对、边写边讲**；数仓模型能**当场设计并讲清取舍**。这是 DE 最稳的拿分区——把窗口/留存/漏斗练成肌肉记忆，把建模讲成条件反射。
> 配套抽题：[../question-bank.md](../question-bank.md) 的「SQL & 数据建模」类（sm-01 ~ sm-06）。

## 计划

- 节奏：<每天/每周 N 题，按时间调整>
- 平台：LeetCode Database、StrataScratch、DataLemur；建模看《The Data Warehouse Toolkit》(Kimball) 的星型/SCD 章节。
- 用面经定位各公司 SQL 难度、方言（Snowflake/BigQuery/Spark SQL 语法差异）与高频场景。

---

## Cheatsheet 1：窗口函数（DE 高频核心）

窗口 = 不折叠行地"看一组"。语法骨架：`func() OVER (PARTITION BY ... ORDER BY ... frame)`。

| 函数 | 用途 |
|---|---|
| `ROW_NUMBER()` | 组内唯一序号——**去重、Top-N、gaps&islands** 的主力 |
| `RANK / DENSE_RANK` | 并列排名（RANK 跳号，DENSE 不跳） |
| `LAG / LEAD` | 取前/后一行——环比、求时间差、状态变化检测 |
| `SUM/AVG ... OVER` | 累计、移动平均（配 frame） |
| `FIRST_VALUE/LAST_VALUE/NTH` | 组内首末值（LAST_VALUE 要注意 frame，默认到当前行） |

**frame 的坑**：默认 frame 是 `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`，在 `ORDER BY` 有并列值时会把并列行一起算进来。要"逐行累计"显式写 `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`。

**`PARTITION BY` vs `GROUP BY`**：窗口保留每一行（加一列），`GROUP BY` 折叠成每组一行。求"每行相对其组"的指标用窗口；求"每组一个汇总"用 `GROUP BY`。

**gaps & islands**（连续区间）：`日期 - ROW_NUMBER() OVER (PARTITION BY user ORDER BY 日期)` 得到的差值，同一连续段内恒定 → 用它当分组键即可求最长连续活跃等。

## Cheatsheet 2：去重的三种场景与代价

1. **完全重复行** → `DISTINCT` 或 `GROUP BY 全列`。大表上触发全量 shuffle，贵。
2. **业务键重复、保留一条** → `ROW_NUMBER() OVER (PARTITION BY 主键 ORDER BY 更新时间 DESC) = 1`。**必须指定确定的排序键**，否则结果不可复现。Snowflake/BigQuery 可用 `QUALIFY` 直接过滤。
3. **去重计数** → `COUNT(DISTINCT x)`；超大基数且可容忍误差时用 `APPROX_COUNT_DISTINCT`（HyperLogLog）。

> DE 视角：查询里反复去重 = 上游有质量问题。根因（上游重发、at-least-once）应在管道里用幂等/dedup 解决，而不是每次查询补救。

## Cheatsheet 3：留存与漏斗

- **Cohort 留存**：以"首次行为日"为锚分群 → `LEFT JOIN` 后续活跃事件 → 按 `DATEDIFF` 落到第 N 日 → 分子/分母（cohort 规模）。
- **口径必澄清**：day-N 留存（恰好第 N 天活跃）vs N-day 留存（N 天内活跃过）；新用户 vs 全体。
- **漏斗**：每步 `COUNT(DISTINCT user)`，且要求**有序**——后一步发生在前一步之后（比较 `MIN(step_ts)` 或带时间约束的 self-join）。
- **优化**：大规模留存/漏斗常预聚合成"用户 × 步骤首次时间"宽表再算，避免反复扫事件流。

## Cheatsheet 4：维度建模

**事实表（facts）**：记录"发生的事件"，窄长，存度量（measure）+ 外键，按时间分区。三类：
- 事务事实（每笔交易一行）、周期快照（每天/每月一行余额类）、累积快照（一条业务流程多里程碑）。
- 度量可加性：完全可加 / 半可加（库存余额不能跨时间 SUM）/ 不可加（比率）——决定能否随便聚合。

**维度表（dimensions）**：描述"上下文"（用户/商品/门店/日期），宽短，存可读属性供切片下钻。

**星型 vs 雪花**：

| | 星型 | 雪花 |
|---|---|---|
| 结构 | 维度直接挂事实表（反范式） | 维度再拆子维度（规范化） |
| JOIN | 少、查询快 | 多、慢 |
| 存储 | 冗余多 | 省 |
| 选择 | **分析默认首选** | 维度极大/强一致性诉求时 |

**一致性维度（conformed dimension）**：跨多个事实表共用同一份维度（统一的日期维、用户维）= 企业级一致性的关键。

## Cheatsheet 5：缓慢变化维（SCD）

用户改了城市，历史订单的"用户城市"显示哪个？

| 类型 | 做法 | 取舍 |
|---|---|---|
| **Type 1** | 直接覆盖旧值 | 简单；丢历史，分析会被改写 |
| **Type 2** | 插新版本行 + `effective_from/to` + `is_current`（或版本号） | **最常用**，保留完整历史；事实表 JOIN 按事件时间落到对应有效区间 |
| **Type 3** | 加一列"前值"（current + previous） | 只留有限历史，适合"只关心上一版" |

- 实务常**混用**：易变且无分析价值的属性用 1，需追溯的关键属性用 2。
- **代理键（surrogate key）**：Type 2 下同一自然键有多行，用自增代理键做事实表外键，才能精确指向某时间版本。

## Cheatsheet 6：范式 vs 反范式、增量 vs 全量

- **范式（3NF）**：消冗余、写一致，适合采集层（ODS/OLTP）；分析时 JOIN 多。
- **反范式**：宽表预 JOIN、读快，适合服务层（mart/OLAP）；写放大、需同步冗余字段。
- **法则**：底层规范化保真，上层反范式提速；用分层（ODS→DWD→DWS→ADS 思路）兼得。
- **全量**：重算整表，简单、自愈（修 bug 重跑即对），但贵慢。
- **增量**：只处理新增/变更分区，快省，但需处理迟到数据、去重、回填。
- **折中**：增量为主 + 周期全量校正；增量务必**幂等**，重跑同分区结果一致。

## 题型清单（勾掉=已熟练）

- [ ] 窗口函数：累计/移动平均、环比（LAG）、Top-N（ROW_NUMBER）、排名
- [ ] gaps & islands（最长连续活跃）
- [ ] 去重三场景 + QUALIFY
- [ ] 留存（cohort）+ 漏斗（有序转化）
- [ ] 多表 JOIN（self-join、反连接、JOIN 爆炸防范）
- [ ] 维度建模口述：事实/维度、星型 vs 雪花、一致性维度
- [ ] SCD Type 1/2/3 + 代理键
- [ ] 范式 vs 反范式、增量 vs 全量

## 薄弱点（动态维护）

- <!-- 做错/卡壳的记这里，Claude 协助讲解 -->

## 各公司高频（按面经填）

- <公司>：<SQL 难度 / 方言 / 常考场景 / 建模深度>
