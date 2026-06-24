"use client";

import { useEffect, useMemo, useState } from "react";
import { appendPracticeLog, getToken } from "@/lib/githubClient";

export interface PracticeQ {
  id: string;
  category: string;
  qHtml: string;
  aHtml: string;
}

export interface QStat {
  count: number;
  last: string; // 最近一次自评 emoji
  lastTime: string;
}

const GRADES = [
  { v: "😣", label: "😣 不会" },
  { v: "😐", label: "😐 磕绊" },
  { v: "😎", label: "😎 流畅" },
];

export default function PracticeApp({
  questions,
  stats,
  prepBase = "prep",
}: {
  questions: PracticeQ[];
  stats: Record<string, QStat>;
  prepBase?: string;
}) {
  const categories = useMemo(
    () => Array.from(new Set(questions.map((q) => q.category))),
    [questions]
  );
  const [cat, setCat] = useState("");
  const [cur, setCur] = useState<PracticeQ | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answer, setAnswer] = useState("");
  const [canWrite, setCanWrite] = useState(false);
  const [msg, setMsg] = useState("");
  const [local, setLocal] = useState<Record<string, string>>({}); // 本次会话新自评

  useEffect(() => setCanWrite(!!getToken()), []);

  const pool = cat ? questions.filter((q) => q.category === cat) : questions;
  const lastGrade = (id: string) => local[id] ?? stats[id]?.last ?? "";

  const pick = (q: PracticeQ) => {
    setCur(q);
    setRevealed(false);
    setAnswer("");
    setMsg("");
  };

  const random = () => {
    const weak = pool.filter((q) => lastGrade(q.id) !== "😎");
    const from = weak.length ? weak : pool;
    pick(from[Math.floor(Math.random() * from.length)]);
  };

  const grade = async (g: string) => {
    if (!cur) return;
    setLocal((m) => ({ ...m, [cur.id]: g }));
    if (!canWrite) {
      setMsg("已记在本页（配 token 后才会写入 practice-log）");
      return;
    }
    setMsg("提交中…");
    try {
      await appendPracticeLog(cur.id, g, "", `${prepBase}/practice-log.md`);
      setMsg("✓ 已写入 practice-log.md");
    } catch (e) {
      setMsg(`✗ ${e instanceof Error ? e.message : "失败"}`);
    }
  };

  const askReview = () => {
    if (!cur) return;
    window.dispatchEvent(
      new CustomEvent("ask-claude", {
        detail: {
          kind: "Mock 面试",
          topic: `批改我的口述答案 [${cur.id}]`,
          detail: `题目见 ${prepBase}/question-bank.md 的 [${cur.id}]。\n\n我的答案（口述转文字）：\n${answer || "（把你的答案粘到这里再提交）"}\n\n请按 mock-interview-bank 自评表打分点评，坑点回填对应 cheatsheet，并把结果记到 ${prepBase}/practice-log.md。`,
        },
      })
    );
  };

  const askMore = () => {
    const weak = questions
      .filter((q) => lastGrade(q.id) === "😣" || lastGrade(q.id) === "😐")
      .map((q) => q.id);
    window.dispatchEvent(
      new CustomEvent("ask-claude", {
        detail: {
          kind: "出题练习",
          topic: `往题库加题${cat ? `：${cat}` : ""}`,
          detail: `请按 question-bank.md 的格式契约追加题目。${
            weak.length ? `我的薄弱题：${weak.join("、")}——优先出同类变体。` : ""
          }`,
        },
      })
    );
  };

  return (
    <>
      <div className="chips" style={{ marginBottom: 12 }}>
        <button className={`chip ${cat === "" ? "on" : ""}`} onClick={() => setCat("")}>
          全部 {questions.length}
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={`chip ${cat === c ? "on" : ""}`}
            onClick={() => setCat(c)}
          >
            {c} {questions.filter((q) => q.category === c).length}
          </button>
        ))}
        <button className="btn" onClick={random}>
          🎲 抽一题（优先薄弱）
        </button>
        <button className="btn ghost" onClick={askMore}>
          📨 要更多题
        </button>
      </div>

      {cur ? (
        <div className="card section">
          <div className="card-title">
            <span className="pill gray">{cur.id}</span> {cur.category}
            {lastGrade(cur.id) && <span className="pill blue">上次 {lastGrade(cur.id)}</span>}
            <button className="more btn ghost mini" onClick={() => setCur(null)}>
              ✕ 关闭
            </button>
          </div>
          <div className="prose" dangerouslySetInnerHTML={{ __html: cur.qHtml }} />
          {!revealed ? (
            <p>
              <span className="muted small">先出声讲 2–5 分钟，再看要点 → </span>
              <button className="btn" onClick={() => setRevealed(true)}>
                显示要点
              </button>
            </p>
          ) : (
            <>
              <div className="answer prose" dangerouslySetInnerHTML={{ __html: cur.aHtml }} />
              <div style={{ margin: "12px 0" }}>
                <span className="muted small">自评：</span>{" "}
                {GRADES.map((g) => (
                  <button key={g.v} className="btn ghost" onClick={() => grade(g.v)}>
                    {g.label}
                  </button>
                ))}
                {msg && <span className="small" style={{ marginLeft: 8 }}>{msg}</span>}
              </div>
              <details>
                <summary className="muted small" style={{ cursor: "pointer" }}>
                  ✍️ 把口述答案交给 Claude 批改（6 维评分，次日出）
                </summary>
                <textarea
                  className="field"
                  rows={6}
                  placeholder="用手机语音听写/打字把你的口述贴进来…"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
                <button className="btn" onClick={askReview} disabled={!answer.trim()}>
                  📨 提交批改
                </button>
              </details>
            </>
          )}
        </div>
      ) : (
        <p className="muted small">点一道题开始，或 🎲 随机抽。</p>
      )}

      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>题</th>
                <th>类别</th>
                <th>题目</th>
                <th>练过</th>
                <th>最近自评</th>
              </tr>
            </thead>
            <tbody>
              {pool.map((q) => (
                <tr key={q.id} onClick={() => pick(q)} style={{ cursor: "pointer" }}>
                  <td className="muted small">{q.id}</td>
                  <td className="muted small" style={{ whiteSpace: "nowrap" }}>
                    {q.category}
                  </td>
                  <td dangerouslySetInnerHTML={{ __html: q.qHtml.replace(/<\/?p>/g, "") }} />
                  <td>{(stats[q.id]?.count ?? 0) + (local[q.id] ? 1 : 0) || ""}</td>
                  <td>{lastGrade(q.id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
