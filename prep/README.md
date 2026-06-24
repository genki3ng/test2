# 备战（Prep）— 多角色

备战内容按**目标角色**组织，每个角色一个独立的 pack：`prep/<role>/`。
当前激活的角色由 `data/profile.json` 的 `role` 字段（或 `NEXT_PUBLIC_ROLE` 环境变量）决定，
站点的 `/prep`、`/practice`、`/docs` 会自动指向对应角色的 pack。onboarding 向导（`/onboard`）
会帮你选定角色。

## 角色 packs

| 角色 | 目录 | 典型轮次 |
|---|---|---|
| **Data Scientist (DS)** | [`prep/ds/`](ds/README) | Technical(SQL+Python) · 统计&实验 · Product Sense · Behavioral |
| **Data Engineer (DE)** | [`prep/de/`](de/README) | SQL&建模 · Coding(Python/Spark) · 管道/系统设计 · Behavioral |
| **Software Engineer (SWE)** | [`prep/swe/`](swe/README) | Coding(DS&A) · System Design · OOD/LLD · Behavioral |
| **Product Manager (PM)** | [`prep/pm/`](pm/README) | Product Sense/Design · 指标&估算 · 战略/执行 · Behavioral |
| **ML Engineer (MLE)** | [`prep/ml/`](ml/README) | Coding(DS&A) · ML 系统设计 · ML 深广度 · Behavioral |

> 角色定义（轮次 + 板块 + 北极星模板）在 [`src/config/roles.ts`](../src/config/roles.ts)。

## 每个 pack 的结构

```
prep/<role>/
  README.md                # 该角色备战总览（含「用 AI 备战面试」四步法）
  question-bank.md         # 题库（喂 /practice 练习台；守格式契约）
  practice-log.md          # 练习自评日志（/practice 自动追加）
  sprint-plan.md           # 2–3 周冲刺周计划（勾选框 → 首页进度）
  mock-interview-bank.md   # Mock 题 + 自评
  company-specific-prep.md # 各公司定制考点
  company-notes/           # 公司面经笔记
  <板块子目录>/             # 各轮次的笔记/cheatsheet（见上表）
```

## 共享材料（不分角色）

- [`daily-routine.md`](daily-routine) — 每个 session 的四步 SOP（首页 DailyGuide 用）
- [`briefs/`](briefs/_TEMPLATE) — 面前速备包（按公司/轮次，临场前看）

## 用 AI 备战（通用四步法）

1. **抽题**：在 [/practice](/practice) 抽一道当前角色题库里的题。
2. **出声讲**：限时口述思路与答案，别看要点。
3. **看要点 + 自评**：对照 `**要点**`，给自己打分（自动写进 `practice-log.md`）。
4. **交批改（可选）**：把答案丢给 Claude，按该角色 rubric 批改、补薄弱点。

> 收到 prep guide / 面经（PDF、截图、贴文）→ 让 Claude 出速备包进 `briefs/`，
> 并从中**出练习题进当前角色的 `question-bank.md`**（守 [STYLEGUIDE](../STYLEGUIDE) 的格式契约）。
