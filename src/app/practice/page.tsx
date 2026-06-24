import type { Metadata } from "next";
import Link from "next/link";
import { getQuestionBank, getPracticeLog, getActiveRole } from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";
import PracticeApp, { PracticeQ, QStat } from "./PracticeApp";

export const metadata: Metadata = { title: "练习台" };

export default function PracticePage() {
  const role = getActiveRole();
  const base = `prep/${role.slug}`;
  const bank = getQuestionBank();
  const log = getPracticeLog();

  const questions: PracticeQ[] = bank.map((q) => ({
    id: q.id,
    category: q.category,
    qHtml: renderMarkdown(q.q, "prep"),
    aHtml: renderMarkdown(q.a, "prep"),
  }));

  const stats: Record<string, QStat> = {};
  for (const r of log) {
    const s = stats[r.qid] ?? { count: 0, last: "", lastTime: "" };
    s.count++;
    if (r.time >= s.lastTime) {
      s.last = r.grade;
      s.lastTime = r.time;
    }
    stats[r.qid] = s;
  }

  return (
    <>
      <h1 className="page-title">🏋️ 练习台 · {role.shortLabel}</h1>
      <p className="page-sub">
        题库 = <Link href={`/docs/${base}/question-bank`}>{base}/question-bank.md</Link>（{bank.length}{" "}
        题）· 自评自动写 <Link href={`/docs/${base}/practice-log`}>practice-log.md</Link>{" "}
        · 我会按记录找薄弱点出补强材料。流程：抽题 → 出声讲 → 看要点 → 自评（→ 可选交批改）。
      </p>
      <PracticeApp questions={questions} stats={stats} prepBase={base} />
    </>
  );
}
