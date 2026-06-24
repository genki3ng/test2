# Coding（Python / Spark）— DE 编码轮

> 目标：Python 把数据处理写得干净、能讲**复杂度与内存约束**；Spark 能现场讲清**shuffle / 倾斜 / broadcast / 分区** 的来龙去脉与优化。DE 编码题一般比 SWE 浅在算法、深在"工程与规模"。
> 配套抽题：[../question-bank.md](../question-bank.md) 的「Coding」类（cd-01 ~ cd-04）。

## 计划

- 节奏：<每天/每周 N 题，按时间调整>
- Python：练流式处理、生成器、`collections`（Counter/defaultdict）、`heapq`、pandas 分块；偶尔的 DS&A 小题。
- Spark：理解执行模型（DAG/stage/task），会读 Spark UI 定位瓶颈；练倾斜与 join 优化。

---

## Cheatsheet 1：Python 数据处理的"工程"思维

面试官真正在看的不是语法，而是你对**规模与内存**的敏感度。

- **流式优先**：能 `for line in file:` / 生成器逐条处理就不要 `read()` / `readlines()` 全量进内存。
- **超内存数据集**：① pandas `read_csv(chunksize=)` 分块；② `hash(key) % N` 分桶到临时文件再逐桶处理（外部分治）；③ 直接上 Spark / DuckDB / Polars，别死磕单机。
- **常用武器**：`collections.Counter`（计数）、`defaultdict`（聚合）、`heapq.nlargest(K, ...)`（Top-K，O(n log K)）、`itertools`（惰性管道）。
- **总能讲清复杂度**：时间 + 空间。Top-K 用堆是 O(n log K) 优于全排序 O(n log n)；哈希聚合 O(n) 时间、O(唯一键) 空间。
- **边界主动列**：空值、重复主键、类型不一致（"1" vs 1）、大小写/空格、时区、超大单值（热点 key）。

**经典题：超大日志 Top-K** → 流式读 + 必要时哈希分桶 + 每桶最小堆求 Top-K。这正是 MapReduce/Spark 的 word-count，单机答完可引申到分布式。

## Cheatsheet 2：Spark 执行模型（必背骨架）

```
Application → Jobs（每个 action 触发）→ Stages（被 shuffle 切开）→ Tasks（= 分区数，并行单元）
```

- **transformation 惰性**（map/filter/join…只构图不执行），**action 触发**（count/collect/save…）。
- **窄依赖**：父分区 → 子分区一对一/多对一（`map`/`filter`/`union`），无需跨节点传数据，可在同一 stage 流水线执行。
- **宽依赖**：子分区依赖多个父分区（`groupByKey`/`join`/`distinct`/`repartition`），**触发 shuffle** → 落盘 + 网络传输 + 序列化，是 **stage 边界**与主要瓶颈。
- 看 DAG 时：**每个 shuffle = 一道 stage 边界**；优化的本质 = 减少 shuffle 的数据量与次数。

## Cheatsheet 3：shuffle 优化与 join 策略

**减少 shuffle 数据量**：
- 过滤/列裁剪**前置**（先 filter、select 需要的列，再 join/聚合）。
- map 端预聚合：`reduceByKey` / `aggregateByKey` 优于 `groupByKey`（后者把所有值搬过网络）。
- 用列存 + 谓词下推（Parquet）让引擎少读。

**Join 策略**：

| 策略 | 何时用 | 代价 |
|---|---|---|
| **Broadcast join** | 一边足够小（`spark.sql.autoBroadcastJoinThreshold`，默认 10MB） | 小表广播到各 executor，**无 shuffle**，最快 |
| Sort-merge join | 两边都大 | 双边 shuffle + 排序 |
| Shuffle hash join | 一边中等 | 单边建哈希表 |

> 手动广播：`broadcast(df_small)`。小表 join 大表却走了 sort-merge，往往是统计信息缺失或超过阈值——是高频优化点。

## Cheatsheet 4：数据倾斜（data skew）—— 高频追问

**症状**：Spark UI 里某 stage 个别 task 耗时/输入远超中位数，其余早完、整体被拖。

**定位**：Spark UI task 分布；或 `df.groupBy(key).count().orderBy(desc("count"))` 抽样看热点 key。

**解法**（能说出 2–3 种即过关）：
1. **加盐两阶段聚合**：热点 key 拼随机后缀 `key_0..key_n` 打散 → 局部聚合 → 去盐 → 二次聚合。
2. **Broadcast join** 消除大表-小表 join 的 shuffle（小表侧无所谓倾斜）。
3. **AQE（Adaptive Query Execution）**：`spark.sql.adaptive.enabled` + `skewJoin.enabled`，运行时自动拆分倾斜分区、合并小分区、动态选 join。
4. 大表-大表单边热点：对热点 key **单独处理**再 union（skew join 思路）。

## Cheatsheet 5：分区与并行度、内存

- **分区数 = 并行度上限**。`spark.sql.shuffle.partitions`（默认 200）按数据量调：太少 → 单 task 过大/OOM；太多 → 调度开销 + 小文件爆炸。
- 经验：分区数约总核数的 **2–4 倍**；目标单分区 ~128–256MB。
- **`repartition`**（带 shuffle、能增能减、均匀）vs **`coalesce`**（无 shuffle、只能减、可能不均）——写出大表前常 `coalesce`/`repartition` 控小文件。
- **`cache/persist`** 复用多次的中间结果；注意存储级别与内存压力，别盲目 cache。
- **OOM 常因**：倾斜、分区过大、`collect()` 把全量拉回 driver、笛卡尔积/join 爆炸——避免 `collect` 大数据。

## 题型清单（勾掉=已熟练）

- [ ] 流式 Top-K / 外部分桶（超内存）
- [ ] 合并 + 去重大数据源（冲突解决规则）
- [ ] pandas：chunksize 分块、groupby/merge/pivot
- [ ] Spark：宽窄依赖、stage/shuffle 能画能讲
- [ ] Spark：倾斜定位 + ≥2 种解法（加盐 / broadcast / AQE）
- [ ] Spark：三种 join 策略与选择
- [ ] 分区/并行度/coalesce vs repartition、小文件问题
- [ ] 复杂度与内存：每题都能讲时间+空间

## 薄弱点（动态维护）

- <!-- 卡壳的记这里 -->

## 各公司高频（按面经填）

- <公司>：<是否手撕 Spark / Python 难度 / 是否有 take-home>
