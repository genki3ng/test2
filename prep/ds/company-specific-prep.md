# 各公司定制题：面试重点 + 我的角度

> 每家目标公司开一段，给：**业务域 → 面试重点 → 2–3 条"可能问 + 我的角度" → ⚠️ 注意**。结合该公司业务 + 你简历的强项。
> 🔵 **confirmed** = 有 JD/面经支撑；⚪ **inferred** = 按业务域/口碑推断，**待面经核实**（别当定论）。
> 用法：投/面某家前过一遍对应段；面后把真实题回填对应 [pipeline/companies/*.md](../pipeline/companies/)。
> 下面 3 段是**示例**（虚构公司，演示怎么写）——把它们换成你自己的目标公司。

---

## Northwind ⚪inferred（电商 / 双边 marketplace 示例）
- **域**：在线零售 + 第三方卖家 marketplace（买家 / 卖家两边）。
- **面试重点（推断）**：转化漏斗、GMV/AOV、搜索与推荐、双边健康指标、A/B 实验。
- 可能问 + 角度：
  - ① "诊断 GMV 或转化率下降" → ratio 7 步诊断 + 内部 mix shift（新老用户/品类占比）。
  - ② "为买卖双边定义健康指标 + liquidity" → listing 被购率、search→purchase、双边留存。
  - ③ "搜索排序改动怎么评估" → A/B + 护栏（卖家曝光公平、退货率）。
- ⚠️ 先确认目标组是 product/analytics 而非偏 ML 的排序团队；抓真实 JD/面经核实。

## Vertex Cloud ⚪inferred（B2B SaaS / 数据云 示例）
- **域**：企业级数据 / AI 云平台，**用量付费（consumption）+ PLG**。
- **面试重点（推断）**：B2B SaaS 指标（**NRR 净收入留存、consumption、expansion、churn**）、严谨 SQL、漏斗 + 销售线索。
- 可能问 + 角度：
  - ① "定义 consumption 健康度 / 预测 expansion 或 churn" → 用量 cohort、NRR 拆解、领先指标。
  - ② "高难度但干净的 SQL 取数" → 先问口径（如何定义 active account / seat），再写。
  - ③ "定价或打包改动怎么评估" → 准实验（无法随机时 DiD/匹配）+ 单位经济。
- ⚠️ B2B 样本少、客户异质大；强调稳健口径与因果谨慎，别硬套用户级 A/B。

## Helios Media 🔵confirmed（社交 / 流媒体 + 广告 示例）
- **域**：内容平台（feed / 短视频）+ 广告变现。
- **面试重点**：**实验设计与方法论**、engagement / 内容健康指标、广告测量与增量。
- 可能问 + 角度：
  - ① "为某 feed / 视频功能定义成功指标" → 满意观看时长（防刷）、留存、创作者供给侧。
  - ② "设计或批判一个广告 / engagement 实验" → 样本量、护栏、长期 holdout、novelty、网络干扰 → cluster/geo。
  - ③ "测广告增量价值" → incrementality（holdout/ghost ads）vs last-click，护栏=用户体验。
- ⚠️ 认准目标组（product/analytics vs ML analytics）；实验文化强的公司会深挖 A/B 进阶坑（SRM/peeking/novelty）。

---
## 速用清单
- [ ] 投/面前，过对应公司段（confirmed 的优先深准备）。
- [ ] ⚪inferred 的，**面前去抓真实面经**（用扩展存进 inbox，Claude 处理）→ 升级成 confirmed。
- [ ] 面后真实题回填 [pipeline/companies/*.md](../pipeline/companies/)。
