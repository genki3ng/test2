"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, sendRequestToClaude } from "@/lib/githubClient";

const KINDS = [
  "出题练习",
  "准备材料",
  "Mock 面试",
  "扫岗/调研",
  "面试日程",
  "投递记录",
  "面试复盘",
  "拍板决策",
  "改简历",
  "其他",
];

/**
 * 全局"派活给 Claude"：写一条 status:new 请求进 inbox/，
 * 下个 Claude session 开场扫 inbox 时自动处理（CLAUDE.md 仪式第 5 步）。
 */
export default function AskClaude() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [kind, setKind] = useState(KINDS[0]);
  const [topic, setTopic] = useState("");
  const [detail, setDetail] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setHasToken(!!getToken());
  }, [open]);

  // 其它组件可通过自定义事件预填并打开（如练习页"要更多题"）
  useEffect(() => {
    const fn = (e: Event) => {
      const d = (e as CustomEvent).detail ?? {};
      if (d.kind) setKind(d.kind);
      if (d.topic) setTopic(d.topic);
      if (d.detail) setDetail(d.detail);
      setState("idle");
      setOpen(true);
    };
    window.addEventListener("ask-claude", fn);
    return () => window.removeEventListener("ask-claude", fn);
  }, []);

  if (pathname === "/login") return null;

  const submit = async () => {
    if (!topic.trim()) {
      setMsg("先写一句标题");
      return;
    }
    setState("saving");
    setMsg("");
    try {
      const path = await sendRequestToClaude({
        topic,
        detail,
        kind,
        context: pathname ?? "",
      });
      setState("done");
      setMsg(path);
      setTopic("");
      setDetail("");
    } catch (e) {
      setState("error");
      setMsg(e instanceof Error ? e.message : "提交失败");
    }
  };

  return (
    <>
      <button className="ask-fab" onClick={() => setOpen(true)} title="派活给 Claude">
        📨 派活
      </button>
      {open && (
        <div className="modal-mask" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="card-title">📨 派活给 Claude</div>
            <p className="muted small" style={{ marginTop: 0 }}>
              写进仓库 <code>inbox/</code>（status: new）——下个 Claude session
              开场自动认领处理，结果会出现在对应页面/文档里。
            </p>
            {!hasToken ? (
              <p>
                需要先在 <a href="/settings">⚙️ 设置</a> 里配 GitHub token（与
                1p3a 扩展同一个即可）。
              </p>
            ) : state === "done" ? (
              <div>
                <p>
                  ✅ 已入收件箱：<code className="small">{msg}</code>
                </p>
                <p className="muted small">
                  首页「📥 收件箱」卡（实时）立即可见；正在进行的 Claude session
                  也会处理。急的话直接开个对话说"扫 inbox"。
                </p>
                <button className="btn" onClick={() => setState("idle")}>
                  再派一条
                </button>{" "}
                <button className="btn ghost" onClick={() => setOpen(false)}>
                  关闭
                </button>
              </div>
            ) : (
              <>
                <div className="chips">
                  {KINDS.map((k) => (
                    <button
                      key={k}
                      className={`chip ${k === kind ? "on" : ""}`}
                      onClick={() => setKind(k)}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <input
                  className="field"
                  placeholder="一句话标题（如：按 Northwind 出 5 道实验设计题）"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
                <textarea
                  className="field"
                  rows={5}
                  placeholder="补充说明（可选）：背景、想要的形式、参考链接…"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                />
                {msg && <p className="login-err small">{msg}</p>}
                <div>
                  <button className="btn" onClick={submit} disabled={state === "saving"}>
                    {state === "saving" ? "提交中…" : "提交"}
                  </button>{" "}
                  <button className="btn ghost" onClick={() => setOpen(false)}>
                    取消
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
