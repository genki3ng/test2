/**
 * 角色注册表 —— OfferOS 的「多职位」核心。
 *
 * 纯数据 + 类型，无 fs / 无 DOM，客户端与服务端都可 import（onboarding 向导也用它渲染选项）。
 * 每个角色定义：展示名、面试轮次（taxonomy）、备战板块（= prep/<slug>/ 下的子目录）、
 * 北极星模板、级别预设、tracker 里岗位标题默认值。
 *
 * 当前激活角色由 src/lib/data.ts 的 getActiveRole() 解析：
 *   NEXT_PUBLIC_ROLE 环境变量  >  data/profile.json 的 role 字段  >  DEFAULT_ROLE
 *
 * 备战内容按 prep/<slug>/ 组织（见 STYLEGUIDE「prep 目录约定」）。改动 slug / 子目录名时，
 * prep/ 下对应目录要一起改，否则 /prep、/practice、/docs 解析不到。
 */

export type RoleSlug = "ds" | "de" | "swe" | "pm" | "ml";

/** 一个备战板块 = prep/<role>/<dir>/ 下的一组笔记 */
export interface PrepCategory {
  /** prep/<role>/ 下的子目录名 */
  dir: string;
  /** /docs 分组标题 + /prep 板块标题 */
  label: string;
  /** 对应 question-bank.md 里的 H2 分类（让 /practice 分类与备战板块对齐） */
  bankCategory: string;
}

/** 一个面试轮次 */
export interface RoleRound {
  key: string;
  label: string;
  blurb: string;
}

export interface RoleConfig {
  slug: RoleSlug;
  /** 完整职位名，如 "Data Scientist" */
  label: string;
  /** 紧凑徽标，如 "DS" */
  shortLabel: string;
  /** 一句话定位（onboarding 选项里展示） */
  blurb: string;
  /** tracker 录入新公司时的默认岗位标题 */
  defaultRoleTitle: string;
  /** 北极星模板，{level} 用 profile 的目标级别填充 */
  northStarTemplate: string;
  /** 级别预设（onboarding 下拉，外加自由输入兜底） */
  levelPresets: string[];
  /** 典型面试轮次，按顺序 —— 驱动备战骨架 + 速备包 */
  rounds: RoleRound[];
  /** 备战板块 = prep/<slug>/ 下的子目录（含各自的 behavioral） */
  prepCategories: PrepCategory[];
}

export const ROLES: Record<RoleSlug, RoleConfig> = {
  ds: {
    slug: "ds",
    label: "Data Scientist",
    shortLabel: "DS",
    blurb: "Product / Analytics 方向：SQL、统计实验、产品 sense、行为面",
    defaultRoleTitle: "Data Scientist",
    northStarTemplate: "目标 {level} DS · remote 友好 · 优化总包 · 3 个月内拿 offer",
    levelPresets: ["Mid (IC4)", "Senior (IC5)", "Staff (IC6)", "Principal (IC7+)"],
    rounds: [
      { key: "technical", label: "Technical (SQL + Python)", blurb: "写查询取数、算指标、Python 数据处理" },
      { key: "analytics", label: "Analytical Execution (统计 & 实验)", blurb: "概率、假设检验、A/B 设计与解读、功效、Simpson" },
      { key: "product", label: "Product Sense (分析推理)", blurb: "定义成功指标、诊断指标变化、目标拆解与取舍" },
      { key: "behavioral", label: "Behavioral", blurb: "STAR、跨职能影响、数据驱动决策" },
    ],
    prepCategories: [
      { dir: "sql-python", label: "SQL/Python", bankCategory: "SQL & Python" },
      { dir: "stats-experimentation", label: "统计与实验", bankCategory: "统计与实验" },
      { dir: "product-sense", label: "产品 Sense", bankCategory: "产品 Sense" },
      { dir: "behavioral", label: "行为面", bankCategory: "行为面" },
    ],
  },

  de: {
    slug: "de",
    label: "Data Engineer",
    shortLabel: "DE",
    blurb: "数据建模、SQL、Spark/管道、批流系统设计",
    defaultRoleTitle: "Data Engineer",
    northStarTemplate: "目标 {level} DE · 数据平台/技术栈对口 · 优化总包 · 3 个月内拿 offer",
    levelPresets: ["Mid (IC4)", "Senior (IC5)", "Staff (IC6)", "Principal (IC7+)"],
    rounds: [
      { key: "sql-modeling", label: "SQL & Data Modeling", blurb: "复杂 SQL、维度建模、范式/反范式、慢变维" },
      { key: "coding", label: "Coding (Python/Spark)", blurb: "数据处理、Spark/分布式、复杂度与内存" },
      { key: "pipeline", label: "Pipeline / System Design", blurb: "批+流、分区、幂等、回填、调度与数据质量" },
      { key: "behavioral", label: "Behavioral", blurb: "STAR、跨团队协作、ownership" },
    ],
    prepCategories: [
      { dir: "sql-modeling", label: "SQL & 数据建模", bankCategory: "SQL & 数据建模" },
      { dir: "coding-spark", label: "Coding (Python/Spark)", bankCategory: "Coding" },
      { dir: "pipeline-design", label: "管道 & 系统设计", bankCategory: "数据系统设计" },
      { dir: "behavioral", label: "行为面", bankCategory: "行为面" },
    ],
  },

  swe: {
    slug: "swe",
    label: "Software Engineer",
    shortLabel: "SWE",
    blurb: "算法编码、系统设计、OOD、行为面",
    defaultRoleTitle: "Software Engineer",
    northStarTemplate: "目标 {level} SWE · 团队/技术栈对口 · 优化总包 · 3 个月内拿 offer",
    levelPresets: ["Mid (E4/IC3)", "Senior (E5/IC4)", "Staff (E6/IC5)", "Principal (E7+)"],
    rounds: [
      { key: "coding", label: "Coding (DS&A)", blurb: "数据结构与算法、edge case、时间/空间复杂度" },
      { key: "system-design", label: "System Design", blurb: "需求澄清→估算→组件→数据模型→瓶颈与取舍" },
      { key: "ood", label: "OOD / LLD", blurb: "类设计、接口、并发、API 设计" },
      { key: "behavioral", label: "Behavioral", blurb: "STAR、协作、ownership、冲突处理" },
    ],
    prepCategories: [
      { dir: "coding", label: "Coding / DS&A", bankCategory: "算法与数据结构" },
      { dir: "system-design", label: "系统设计", bankCategory: "系统设计" },
      { dir: "ood", label: "OOD / LLD", bankCategory: "OOD/LLD" },
      { dir: "behavioral", label: "行为面", bankCategory: "行为面" },
    ],
  },

  pm: {
    slug: "pm",
    label: "Product Manager",
    shortLabel: "PM",
    blurb: "产品设计/sense、指标与估算、战略执行、领导力",
    defaultRoleTitle: "Product Manager",
    northStarTemplate: "目标 {level} PM · 业务/产品方向对口 · 优化总包 · 3 个月内拿 offer",
    levelPresets: ["APM / PM", "Senior PM", "Group PM / Staff", "Director+"],
    rounds: [
      { key: "product-design", label: "Product Sense / Design", blurb: "用户洞察、痛点、方案取舍与优先级" },
      { key: "analytical", label: "Analytical (metrics & estimation)", blurb: "成功指标、估算、漏斗诊断、取舍量化" },
      { key: "strategy", label: "Strategy / Execution", blurb: "市场/竞品、GTM、路线图、跨职能推进" },
      { key: "behavioral", label: "Behavioral / Leadership", blurb: "STAR、影响力、冲突、向上沟通" },
    ],
    prepCategories: [
      { dir: "product-design", label: "产品设计/Sense", bankCategory: "产品设计" },
      { dir: "analytical-metrics", label: "指标与估算", bankCategory: "指标与分析" },
      { dir: "strategy-execution", label: "战略与执行", bankCategory: "战略与执行" },
      { dir: "behavioral", label: "行为面/领导力", bankCategory: "行为面" },
    ],
  },

  ml: {
    slug: "ml",
    label: "Machine Learning Engineer",
    shortLabel: "MLE",
    blurb: "算法编码、ML 系统设计、ML 深广度、行为面",
    defaultRoleTitle: "Machine Learning Engineer",
    northStarTemplate: "目标 {level} MLE · ML 方向对口 · 优化总包 · 3 个月内拿 offer",
    levelPresets: ["Mid (E4)", "Senior (E5)", "Staff (E6)", "Principal (E7+)"],
    rounds: [
      { key: "coding", label: "Coding (DS&A)", blurb: "数据结构与算法、复杂度（与 SWE 同源）" },
      { key: "ml-system-design", label: "ML System Design", blurb: "推荐/排序/特征平台、训练-服务、在线/离线一致性" },
      { key: "ml-fundamentals", label: "ML Breadth/Depth", blurb: "建模、评估指标、过拟合、训练细节、经典/深度" },
      { key: "behavioral", label: "Behavioral", blurb: "STAR、协作、ownership" },
    ],
    prepCategories: [
      { dir: "coding", label: "Coding / DS&A", bankCategory: "算法与数据结构" },
      { dir: "ml-system-design", label: "ML 系统设计", bankCategory: "ML 系统设计" },
      { dir: "ml-fundamentals", label: "ML 基础（建模/评估）", bankCategory: "ML 基础" },
      { dir: "behavioral", label: "行为面", bankCategory: "行为面" },
    ],
  },
};

export const DEFAULT_ROLE: RoleSlug = "ds";

export const ROLE_SLUGS = Object.keys(ROLES) as RoleSlug[];

export function isRoleSlug(s: string | undefined | null): s is RoleSlug {
  return !!s && Object.prototype.hasOwnProperty.call(ROLES, s);
}

/** 取角色配置；非法/未设置 → 回退 DEFAULT_ROLE，保证构建不挂。 */
export function getRole(slug: string | undefined | null): RoleConfig {
  return isRoleSlug(slug) ? ROLES[slug] : ROLES[DEFAULT_ROLE];
}
