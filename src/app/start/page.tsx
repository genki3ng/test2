import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = { title: "新手上路 · Getting Started" };

const STEPS = [
  {
    n: 1,
    t: "拿到代码",
    d: "在 GitHub 点「Use this template」或 Fork，生成你自己的私有仓库。",
  },
  {
    n: 2,
    t: "部署到 Vercel",
    d: "把仓库连到 Vercel——之后每次 push 到 main 都会自动重建上线。markdown 就是数据库，没有别的后端。",
  },
  {
    n: 3,
    t: "加把锁",
    d: "在 Vercel 配环境变量 SITE_PASSWORD（或开 Vercel Authentication），否则你的求职数据是公开可见的。",
  },
  {
    n: 4,
    t: "配成你的身份",
    d: "改 src/site.config.ts：名字、头像缩写、北极星、你的 owner/repo。想在网站上直接编辑/派活，再到 ⚙️ 设置里填一个 fine-grained PAT（只给这个仓库 Contents 读写，存在浏览器本地、不入库）。",
  },
  {
    n: 5,
    t: "填上你自己",
    d: "把 profile/、pipeline/、strategy/ 里的虚构样例换成你的真实情况——可以直接让 Claude 帮你写。",
  },
];

const LOOP = [
  { k: "开场", v: "对 Claude 说「读 CLAUDE.md 和 HANDOFF.md，复述现状」——它立刻知道你进行到哪。" },
  { k: "推进", v: "直接说要做啥：出 SQL / 统计 / 产品 sense 题、按公司 tailor 简历、扫岗、起草内推邮件、整理面经、复盘面试。" },
  { k: "看板", v: "在网站上勾任务、改公司状态、内推一键推进、📨 派活（写进 inbox/，下个 session 自动处理）。" },
  { k: "收尾", v: "让 Claude 更新 HANDOFF.md + 记一条 journal + commit & push。Vercel 自动重建，网站即刻同步。" },
  { k: "随时随地", v: "在 claude.ai/code 接上这个仓库，手机/网页也能指挥，无需本地环境。" },
];

const REPLACE = [
  { f: "profile/candidate-profile.md", why: "你的背景与成就（简历和行为面故事的底料）", href: "/docs/profile/candidate-profile" },
  { f: "profile/target.md", why: "你的北极星与硬约束（投哪、接哪个 offer 都对照它）", href: "/docs/profile/target" },
  { f: "profile/resume/master.md", why: "master 简历——构建时自动导出 docx / HTML / PDF", href: "/docs/profile/resume/master" },
  { f: "data/tracker.json + pipeline/companies/*.md", why: "你的目标公司与各家进度", href: "/pipeline" },
  { f: "pipeline/referrals.md", why: "你的内推渠道", href: "/referrals" },
  { f: "prep/*", why: "题库与笔记——现在是空模板，让 Claude 按你的目标公司生成", href: "/prep" },
];

export default function StartPage() {
  return (
    <>
      <h1 className="page-title">🚀 新手上路 · Getting Started</h1>
      <p className="page-sub">
        把这个指挥台从 0 变成「你的」求职作战室，以及之后每天怎么和 Claude 协作。
      </p>

      <div className="card section">
        <div className="card-title">这是什么</div>
        <ul>
          <li>一个 <b>「你 + Claude」协作的求职管理系统</b>：计划 / 准备 / 投递 / 内推 / 面试 / 谈判 / 复盘，每一步 Claude 都帮你。</li>
          <li>仓库里的 <b>markdown 文件就是数据库</b>；这个网站是只读看板 + 轻量交互，真正干活在 Claude Code 的对话里。</li>
          <li>三个记忆文件让任何新会话都能接上：<code>CLAUDE.md</code>（长期约定）· <code>HANDOFF.md</code>（进行中快照）· <code>log/journal.md</code>（历史流水）。</li>
        </ul>
      </div>

      <h2 className="page-title" style={{ fontSize: "1.15rem", marginTop: 28 }}>从 0 开始（5 步）</h2>
      <div className="grid grid-2 section">
        {STEPS.map((s) => (
          <section className="tile" key={s.n}>
            <div className="tile-head">
              <span className="tile-title">
                <span className="ic" style={{ fontWeight: 700 }}>{s.n}</span>
                {s.t}
              </span>
            </div>
            <p className="muted" style={{ margin: 0 }}>{s.d}</p>
          </section>
        ))}
      </div>

      <div className="card section">
        <div className="card-title">之后每天怎么交互（the loop）</div>
        <ul className="checklist">
          {LOOP.map((l) => (
            <li key={l.k} style={{ alignItems: "flex-start" }}>
              <span className="txt">
                <b>{l.k}</b>
                <div className="muted small" style={{ fontWeight: 400, marginTop: 2 }}>{l.v}</div>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card section">
        <div className="card-title">把样例换成你自己的</div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>文件</th><th>是什么</th></tr>
            </thead>
            <tbody>
              {REPLACE.map((r) => (
                <tr key={r.f}>
                  <td style={{ minWidth: 240 }}><Link href={r.href}><code>{r.f}</code></Link></td>
                  <td>{r.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="muted small section">
        当前仓库里的人物 <b>{siteConfig.ownerName}</b> 和示例公司（Northwind / Vertex Cloud / Helios Media）都是<b>虚构占位</b>，放心删改。
        更详细的说明见 <Link href="/docs/GETTING-STARTED">GETTING-STARTED.md</Link> 与{" "}
        <Link href="/docs/CLAUDE">CLAUDE.md</Link>。
      </p>
    </>
  );
}
