import type { Metadata } from "next";
import Link from "next/link";
import {
  getSprintProgress,
  getCompanyNotes,
  getActiveRole,
  readDoc,
  countCheckboxes,
  getTaskLines,
} from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";
import Prose from "@/components/Prose";

export const metadata: Metadata = { title: "备战" };

export default function PrepPage() {
  const role = getActiveRole();
  const base = `prep/${role.slug}`;
  const sprint = getSprintProgress();
  const notes = getCompanyNotes();
  const sprintMd = readDoc(`${base}/sprint-plan.md`) ?? readDoc("prep/sprint-plan.md") ?? "";
  const pct = sprint.total ? Math.round((sprint.done / sprint.total) * 100) : 0;

  const prepLinks: { rel: string; label: string }[] = [
    { rel: `${base}/README`, label: "备战总览（含「用 AI 备战面试」四步法）" },
    { rel: `${base}/question-bank`, label: "🏋️ 题库（去 /practice 练习台更顺手）" },
    { rel: `${base}/sprint-plan`, label: "🏃 冲刺计划（周计划 + 勾选）" },
    { rel: `${base}/mock-interview-bank`, label: "Mock 题库 + 自评" },
    { rel: `${base}/company-specific-prep`, label: "各公司定制考点" },
    ...role.prepCategories.map((c) => ({
      rel: `${base}/${c.dir}/README`,
      label: `${c.label} · 板块笔记`,
    })),
  ];

  return (
    <>
      <h1 className="page-title">📚 备战 · {role.shortLabel}</h1>
      <p className="page-sub">
        {role.label} 备战 —— 按轮次准备：{role.rounds.map((r) => r.label).join(" · ")} · 并行找内推。
      </p>

      <div className="grid grid-2 section">
        <div className="card">
          <div className="card-title">
            🏃 冲刺进度（勾选框统计）
            <span className="more muted">
              {sprint.done}/{sprint.total} · {pct}%
            </span>
          </div>
          <div className="bar" style={{ marginBottom: 14 }}>
            <i style={{ width: `${pct}%` }} />
          </div>
          <p className="muted small">
            勾选在 <Link href={`/docs/${base}/sprint-plan`}>{base}/sprint-plan.md</Link>{" "}
            里更新（让任意 session 改完 push 即可，这里自动刷新）。
          </p>
          <div className="card-title" style={{ marginTop: 18 }}>📂 备战材料</div>
          <ul>
            {prepLinks.map((l) => {
              const md = readDoc(l.rel + ".md");
              if (md === null) return null;
              const p = countCheckboxes(md);
              return (
                <li key={l.rel}>
                  <Link href={`/docs/${l.rel}`}>{l.label}</Link>
                  {p.total > 0 && (
                    <span className="muted small">
                      {" "}
                      （{p.done}/{p.total}）
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="card-title" style={{ marginTop: 18 }}>🗒 公司面经笔记（{notes.length} 家）</div>
          <ul>
            {notes.map((rel) => (
              <li key={rel}>
                <Link href={`/docs/${rel}`}>{rel.split("/").pop()}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="card-title">
            📋 sprint-plan.md 全文
            <span className="more muted small">有 token 时勾选框可直接点</span>
          </div>
          <Prose
            html={renderMarkdown(sprintMd, base)}
            path={`${base}/sprint-plan.md`}
            tasks={getTaskLines(sprintMd).map((t) => ({ text: t.text, checked: t.checked }))}
          />
        </div>
      </div>
    </>
  );
}
