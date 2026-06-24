# 统计 & 实验（DS 分析执行轮 / Analytical Execution）

> 📄 一页可背：[cheatsheet-power-variance.md](cheatsheet-power-variance.md)（功效五者关系 + 方差缩减 + bootstrap 陷阱）。
> 📄 [cheatsheet-causal-inference.md](cheatsheet-causal-inference.md)（PSM/DiD/RDD + mixed/FE/RE + 何时不做实验）｜📄 [model-explain-cheatsheet.md](model-explain-cheatsheet.md)（线性/逻辑/树 口述）｜📄 [cheatsheet-abtest-pitfalls.md](cheatsheet-abtest-pitfalls.md)（SRM/peeking/novelty/干扰 等坑）。
> DS 区别于纯分析师的关键轮。考：概率统计基本功 + **A/B 实验的设计与解读**。
> 答题习惯：先讲假设/思路，再算，最后回到业务含义与局限。

## 概率 & 统计清单

- [ ] 概率基础：条件概率、贝叶斯、期望/方差、常见分布
- [ ] 抽样与中心极限定理、置信区间
- [ ] 假设检验：t 检验、卡方、p 值的正确解读、第一/二类错误
- [ ] 功效分析 / 样本量计算
- [ ] 回归基础：线性/逻辑回归、系数解读、共线性、过拟合
- [ ] 相关 ≠ 因果；混杂变量；辛普森悖论
- [ ] 估计与偏差：选择偏差、幸存者偏差

## A/B 实验清单（DS 重头）

- [ ] 实验设计：随机化单元、对照/处理、最小可检测效应(MDE)、样本量、时长
- [ ] 指标体系：主指标 / 护栏指标(guardrail) / 反向指标
- [ ] 解读结果：显著性 vs 实际意义、置信区间、多重比较
- [ ] 常见坑：novelty effect、网络效应/干扰、SRM(样本比例失衡)、peeking、辛普森悖论
- [ ] 何时**不该**做实验 / 实验不可行时的替代（准实验、diff-in-diff、回归不连续）
- [ ] 实验结论 → 决策建议（ship / 不 ship / 迭代）

## 练习与坑点（动态维护）

- <!-- 做错/卡壳/有意思的题记这里，Claude 协助讲解 -->

## 各公司侧重（按面经填）

- <公司>：<更偏概率题 / 实验设计 / 因果推断？深度如何>
