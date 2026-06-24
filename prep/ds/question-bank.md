# 题库（Question Bank）

> 网页指挥台（练习页）读本文件。
> **格式契约**（解析器依赖，勿破坏）：`## 类别` → `### [id] 题目一行` → 题干补充（可选多行）→ 单独一行 `**要点**` → 要点内容（到下一题为止）。
> 自评记录自动落 [practice-log.md](practice-log.md)；要加题/换方向 → 站点「📨 派活」或对 Claude 直说。
> 下面是一套通用 DS 题（SQL/Python · 统计实验 · 产品 sense · 行为面），可直接练；想换成更贴你目标公司的题 → 对 Claude 说，或走站点「📨 派活」。

## SQL & Python

### [sql-01] events(user_id, event_date, event_type)：求 D1/D7 留存曲线
**要点**
- 模式：首访 cohort（`MIN(event_date)` per user）→ self-join/EXISTS 看 D+1、D+7 是否活跃 → 除以 cohort 规模。
- 口述时先讲思路再写；注意去重（DISTINCT user）、留存定义（当天 vs 窗口内）。
- 参考：[warmup-problems](sql-python/warmup-problems.md)

### [sql-02] 每个 category 收入 top 3 产品 + 占类目收入百分比
**要点**
- `SUM(revenue) GROUP BY category, product` → `ROW_NUMBER() OVER (PARTITION BY category ORDER BY rev DESC)` ≤3 + `rev / SUM(rev) OVER (PARTITION BY category)`。
- 细节：tie 处理（RANK vs ROW_NUMBER 说一句）、percent 在过滤 top3 前算。

### [sql-03] 连续登录 ≥3 天的用户（gaps-and-islands）
**要点**
- 经典：`event_date - ROW_NUMBER() OVER (PARTITION BY user ORDER BY event_date)` 同组常数 → GROUP BY 组长度 ≥3。
- 先 DISTINCT user+date；讲清为什么差值在连续段内不变。

### [sql-04] 漏斗 view→add_to_cart→purchase 各步转化，按渠道拆
**要点**
- 用户级打 flag（MAX(CASE WHEN…)）→ 按渠道聚合 `SUM(purchase)/SUM(add_to_cart)` 等。
- 提一句口径：时间窗约束（view 后 7 天内购买）、严格顺序漏斗 vs 宽松口径。

### [sql-05] Python：DataFrame 算各组 CUPED 校正后均值
**要点**
- `theta = cov(Y, X_pre) / var(X_pre)`；`Y_cuped = Y − theta·(X_pre − mean(X_pre))`；再 groupby 实验组均值。
- 讲原理一句话：用前期协变量解释掉一部分方差，无偏且方差更小。

### [sql-06] 配送 marketplace SQL：orders(order_id, consumer_id, merchant_id, courier_id, created_at, delivered_at, gov, is_subscriber)
① 各 merchant 月 GOV + 环比%；② 订阅会员 vs 非订阅的 30 天复购率；③ 各 region 配送时长 p90
**要点**
- **① 月 GOV 环比**：`DATE_TRUNC('month', created_at)` 分组 `SUM(gov)`；环比 `LAG(SUM(gov)) OVER (PARTITION BY merchant_id ORDER BY month)`，`(cur−prev)/prev`。
- **② 复购率**：标每单"30 天内是否有下一单"（`LEAD(created_at) OVER (PARTITION BY consumer_id ORDER BY created_at)` 比 `created_at + 30d`）；按 `is_subscriber` 分组 = 复购用户数 / 用户数（**分子分母分开 `COUNT(DISTINCT)` 再除**，别行级平均）。
- **③ p90 配送时长**：`PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY delivered_at − created_at)`，按 region（join courier→region 维表）。
- **坑**：维表 join **fan-out**（一单别翻倍）；`delivered_at` 为 NULL（未送达）要排除；除零（merchant 首月无 prev）；时区。
- 答题：先问 schema/粒度/去重键 → 写骨架再填 → 主动报边界 → 自查 fan-out & 分母。

## 统计与实验

### [se-01] 设计 A/B 测"结账按钮从蓝改绿是否提升转化"——样本量、时长、指标、坑全讲
**要点**
- **澄清**：转化定义？基线 p？预期效应（MDE）？流量多大？
- **样本量**：16 法则 `n/组 ≈ 16·p(1−p)/Δ²`（α=.05 双侧、power 80%）。现场代数：p=10%、MDE=1pp → 每组 ~1.44 万。
- **时长**：≥1–2 个完整业务周期（周内效应）；不提前偷看（peeking）。
- **指标**：主=结账转化率；护栏=收入/单、退款、页面报错、延迟；诊断=点击率分步漏斗。
- **坑**：SRM 检查、novelty effect、多设备同用户、分流单位=用户而非 session。
- 参考：[功效·方差](stats-experimentation/cheatsheet-power-variance.md) · [A/B 坑](stats-experimentation/cheatsheet-abtest-pitfalls.md)

### [se-02] 实验只有 +0.3% lift、p=0.04，要不要 ship？
**要点**
- 显著 ≠ 重要：先问 **0.3% 值多少钱**（×受众×年化）vs 实现/维护成本。
- 检查：power 是否够（效应小→可能就是真小）；CI 宽度；护栏有没有掉；分段有没有反向（Simpson）。
- 长期：novelty/primacy？可做 holdback 验证持续性。
- 决策框架收尾：value > cost 且护栏干净 → ship；否则迭代或放弃。"带着预估金额去和 PM 对齐"——回到业务。

### [se-03] 要测一个有网络效应的功能（如群聊邀请），普通 A/B 为什么偏？怎么设计？
**要点**
- **SUTVA 破坏**：treatment 用户影响 control 用户（邀请跨组）→ 效应被稀释/污染，常**低估**。
- 设计：**cluster randomization**（按社交圈/地理分桶）、**switchback**（时间片轮换，适合 marketplace）、graph cluster、或 ego-cluster。
- trade-off：cluster 减少有效样本量（ICC↑ → 方差↑）→ 需要更大规模或更长时间。
- 参考：[因果 cheatsheet](stats-experimentation/cheatsheet-causal-inference.md)

### [se-04] 没法随机化（如定价），怎么估因果效应？PSM/DiD/RDD 怎么选？
**要点**
- **DiD**：有干预前后 + 可比对照组（平行趋势假设，要画 pre-trend 验证）。
- **PSM**：观测混杂可建模（unconfoundedness），按倾向分匹配；坑=未观测混杂、common support。
- **RDD**：有清晰阈值规则（如满 $35 免运费）→ 阈值附近局部随机；坑=只识别局部效应、操纵阈值。
- 选择逻辑一句话：有时间维度对照→DiD；有阈值→RDD；都没有但混杂可观测→PSM/加权。各配 1 个工作实例。

### [se-05] "Can bootstrap reduce variance?" + ratio 指标怎么算方差
**要点**
- **不能**。bootstrap 是**估计**统计量抽样分布/方差的工具，不改变估计量本身的方差。能"降方差"的是 CUPED、分层、回归调整等。
- ratio 指标（如人均收入，分流单位=用户但指标=session 级）：用 **delta method** 近似方差，或对用户级聚合后再算；直接按 session 算会**低估方差**（相关性）。
- 加分：主动讲 CUPED——用实验前协变量回归调整，方差降 ~30–50%，等价于更小样本量。

### [se-06] 实验跑到一半看着显著了，能停吗？（peeking）
**要点**
- 不能按固定样本量检验反复看——**第一类错误膨胀**（看 5 次 α≈14%）。
- 正确做法：① 预定样本量跑满；② 要提前停 → **sequential testing**（O'Brien-Fleming、mSPRT、always-valid p）；③ 平台层面给 always-valid CI。
- 顺带讲 SRM：每次看数据先查分流比例 χ²，SRM 说明分流坏了，结果全不可信。

### [se-07] PSM、DiD、mixed model 各 2 分钟口述（怎么用 + 适用 + 陷阱）
练熟到能在白板边画边讲。
**要点**
- 每个按四段式：**场景 → 假设 → 步骤 → 陷阱**。
- PSM：估倾向分→匹配/加权→平衡性检查（SMD<0.1）→敏感性分析。陷阱：未观测混杂。
- DiD：平行趋势图→双重差分回归（含个体/时间 FE）→event study 验证。陷阱：treatment 时点异质、spillover。
- mixed model：重复测量/分组数据，fixed effect=感兴趣的均值效应，random effect=组间异质（如用户/市场随机截距）。何时用：纵向数据、cluster 内相关。
- 参考：[因果 cheatsheet](stats-experimentation/cheatsheet-causal-inference.md) 二节

### [se-08] 什么时候不该做实验？不可行时的替代方案
**要点**
- 不该/不能：伦理或品牌风险（涨价、宕机）、网络效应全局功能、样本太少/效应太慢（年留存）、不可逆动作。
- 替代梯队：准实验（DiD/RDD/合成控制）→ 观测因果（PSM/IV）→ holdout 市场（geo test/MMM 校准）→ 前后对比+时序模型（最弱，讲明置信度低）。
- 举一个你熟悉领域的例子（如广告增量测量里 holdout/geo 实验与 MMM 互相校准）。

### [se-09] Attribution 和 incrementality 有什么区别？为什么 last-click 会高估广告？
**要点**
- **attribution = 给已发生的转化分信用**（last/first/linear/data-driven Shapley/Markov）——全是**相关性分配**，不回答「这笔转化本来会不会发生」。
- **incrementality = 因果增量** = treated 转化率 − holdout 转化率；只有它告诉你哪些转化是广告**真正带来的**。
- last-click 高估机制：广告**专挑本来就最可能转化的人**投（selection bias）→ 把「本来就会买」的人算成广告功劳。
- 钩子句：*"Attribution measures correlation, incrementality measures causation."* 真理 = holdout / PSA / ghost ads。
- 参考：[因果速学 Part 3](stats-experimentation/study-causal-from-experiments.md)

### [se-10] 没法跑 holdout 时怎么测广告增量？MMM 什么时候可信？
**要点**
- 梯队：**geo / matched-market 实验**（按城市随机，cluster randomization）→ 观测因果（PSM/IPW on exposure，讲 unconfoundedness 风险）→ **MMM** → 最后 pre/post+时序（最弱）。每层报假设+不确定性。
- **MMM**：top-down 回归 `sales ~ Σ channel spend`，含 **adstock**（滞后衰减）+ **saturation**（边际递减）。优点=隐私友好/全渠道/做预算分配；缺点=**相关性非因果**（共线性、季节混杂、低频数据）。
- 现代做法：**用实验/geo-test 校准 MMM 先验**（如 Robyn、Meridian 等开源框架）→ 二者互补不替代。
- 诚实口径：以 experiment-based incrementality 为主；MMM 理解其结构与局限，不单独信未校准的 MMM。
- 参考：[因果速学 Part 3.3](stats-experimentation/study-causal-from-experiments.md)

## 产品 Sense

### [ps-01] 为 Instagram Reels / YouTube Shorts 定义成功指标
**要点**
- 套路：**澄清范围 → 业务目标 → 北极星+驱动+护栏 → 取舍**（[范答](product-sense/practice-define-metrics.md)）。
- 北极星：**满意观看时长/用户**（裸 watch time 会被刷——看完率/long-click/survey 加权）。
- 驱动：DAU、人均 session、完成率、推荐 CTR（配点击后满意）、D7/D30 留存、**创作者侧供给**（多边飞轮）。
- 护栏：举报/踩、regretted watch、对长视频/Feed 的 cannibalization、延迟。
- 取舍：短期时长 vs 长期留存；别忘了说"会被操纵的指标不配当北极星"。

### [ps-02] DoorDash 某城市配送时长变长了，怎么诊断？
**要点**
- 先**澄清+量化**：多长？多久了？突变还是渐变？（突变→找 event；渐变→找 mix shift）
- **拆解漏斗**：下单→商家接单→出餐→骑手接单→取餐→送达，定位哪段变长。
- **供需**：骑手在线时长/订单比（供给不足最常见）、天气/大促/新区扩张。
- **mix shift**：订单构成变化（远距离/大单/新商家占比）——总量恶化可能每段都没变（Simpson）。
- 收尾给行动：短期调度/定价杠杆，长期供给运营；附监控指标。
- 参考：[ratio 诊断 7 步](product-sense/diagnose-ratio-metric.md) · [marketplace 指标](product-sense/cheatsheet-marketplace-metrics.md)

### [ps-03] 某 ratio 指标掉了 5%，结构化排查
**要点**
- 7 步框架：**①澄清定义/幅度/时点 → ②数据质量（logging/管道先排除）→ ③分子还是分母动了 → ④内部 mix shift（Simpson）→ ⑤分段定位（平台/地区/新老用户/渠道）→ ⑥外部事件（发版/节假日/竞品/政策）→ ⑦量化归因+建议**。
- 关键 move：分母涨也会让 ratio 掉（新用户涌入稀释）——**先问分子分母**，面试官就在等这个。
- 参考：[diagnose-ratio-metric](product-sense/diagnose-ratio-metric.md)（含 3 题范答）

### [ps-04] 该不该给 Uber 上线"拼车"功能？用数据论证
**要点**
- 框架：**目标（谁的价值）→ 机会规模 → 实验设计 → 指标体系 → 取舍建议**。
- 三边影响：乘客（便宜 vs 时长↑）、司机（单价↓ vs 利用率↑）、平台（单均毛利 vs 总单量、供给效率）。
- 实验：**switchback/城市级**（拼车改变 marketplace 动态，用户级 A/B 会偏）。
- 指标：完成单量、每司机小时收入、乘客等待/绕路时长、留存；护栏=取消率、评分。
- 取舍收尾：低密度城市可能负向——分城市推。

### [ps-05] 怎么衡量"推送通知"的价值且不惹恼用户？
**要点**
- **增量**：holdout 不发组（长期 holdout 测累计效应），别用打开率自嗨——打开≠增量活跃。
- 价值=带来的**增量 DAU/转化**；成本=**关推送率、卸载率、通知疲劳**（护栏）。
- 频控实验找边际拐点：第 N 条通知的边际增量 vs 边际退订。
- 加分：通知是"借未来的留存"——看 30/60 天 LTV 级影响而不是当日 CTR。

### [ps-06] 为一个新 AI 功能（AI 客服/AI 摘要）定义成功与风险指标
**要点**
- 成功：**任务完成率/解决率**（非用量虚荣指标）、采纳率、edit distance/接受率（生成质量行为代理）、节省时长、CSAT。
- 质量评估：**LLM-as-judge + 人工抽检**双轨、golden set 回归；线上 A/B 看业务终点指标。
- 风险/护栏：幻觉率/事实错误投诉、升级人工率、延迟与成本（$/会话）、安全违规。
- 若有相关经验：用一句话举例你怎么定 acceptance / 质量指标（很加分）。

### [ps-07] 两边 marketplace（DoorDash/Airbnb/Uber）的指标体系怎么搭？
**要点**
- 三层：**需求侧**（MAU、转化、频次、留存）/ **供给侧**（活跃供给、利用率、供给留存）/ **撮合健康**（匹配率、等待时长、fill rate、流动性）。
- 北极星=完成交易量（可持续口径，剔补贴）；**约束=供需平衡**——单侧优化必反噬。
- 经典问法变体：补贴该给哪边？→ 看哪侧是瓶颈（constrained side）+ 弹性。
- 参考：[marketplace cheatsheet](product-sense/cheatsheet-marketplace-metrics.md)

### [ps-08] 外卖平台上线会员订阅（月费，类似 DashPass），怎么衡量它表现好不好？
> 三边 marketplace 样板题。三方 = 消费者 / 商家 / 配送方（骑手）。
**要点**
- **先澄清**：目标 = retention？GOV？margin？看绝对值还是**增量**？哪个用户群？时间窗？
- **北极星**：订阅用户的**增量 GOV / 增量订单**（非绝对值——警惕选择偏差："本来就高频的人才会订"）。
- **支撑**：渗透率、续订/churn、订阅 vs 非订阅下单频次（**holdout / 倾向得分匹配去选择偏差**）、AOV、单位经济（补贴 vs 增量利润）。
- **三方护栏**：消费者体验 / 商家单量履约 / 配送方供给与 ETA——别一方受益、另两方受损。
- **测因果**：订阅 **holdout / geo(switchback) 实验**；看 **novelty** 是否长期衰减；查 **cannibalization**（给本就会下单的人发福利）。
- **建议 + tradeoff**：定价/权益调整 → 说清业务影响 + 网络效应/利润权衡。
- 框架：澄清 → 结构(三方+飞轮+单位经济) → 指标(北极星+护栏) → ≥2 假设 → 数据 → 实验/因果 → 建议+影响+tradeoff（全程 think out loud、像对话）。

## 行为面

### [bh-01] Tell me about yourself（TMAY，60–90 秒）
**要点**
- 三段式（在 [behavioral](behavioral/README.md) 里定稿）：现职定位（角色 + 方向，一句话）→ 2 个代表成就（量级脱敏口径）→ 为什么找下一站（成长/方向叙事）→ 为什么这家。
- 自查：≤90 秒、无内部代号、和简历数字一致。

### [bh-02] 一次用数据改变了 PM/领导的决定
**要点**
- 选一个"数据推翻直觉"的 STAR；结构：决策背景→你的分析（方法一句话）→ 关键证据 → 对方被什么说服 → 结果量化。
- 考点是 **influence**：突出"怎么讲给非技术人听"与 stakeholder 推进，不是炫技术。

### [bh-03] 一次失败/判断错了，怎么补救、学到什么
**要点**
- 选一个真失败 + 真教训，别"我太追求完美"那种假失败。
- 结构：错在哪（自己的判断，不甩锅）→ 发现信号 → 止损动作 → 制度化改进（之后怎么防）。

### [bh-04] 跨职能冲突 / 和 eng/PM 意见不合
**要点**
- 要点：先讲**对方立场的合理性** → 用数据/标准把分歧客观化 → 找共同目标收敛 → 关系结果（之后合作更顺）。
- 忌：说成"我对他错我赢了"。

### [bh-05] 模糊问题、没人给方向时你怎么做
**要点**
- 对标高级别（Staff/IC6）期望：**自己定义问题**——先收敛目标（和利益方对齐"成功长什么样"）→ 拆解可验证假设 → 快速 MVP 分析定方向 → 滚动汇报。
- 配实例：从 0 建标准/平台类项目最贴。

### [bh-06] 为什么离开现公司 / 为什么我们公司
**要点**
- 正向叙事：想把核心强项（某方法/某领域深度）带到新业务场景 + 该公司具体吸引点（产品/数据文化/岗位方向，**做功课点名**）。
- 不说：签证/身份等私人因素、政治、对现/前公司的负面评价。每家公司提前备一句定制版（[company-specific-prep](company-specific-prep.md)）。
