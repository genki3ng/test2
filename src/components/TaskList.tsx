"use client";

import { useEffect, useState } from "react";
import { getToken, saveTaskToggle } from "@/lib/githubClient";

export interface TaskItem {
  idx: number; // 在源文件全部任务行中的序号（saveTaskToggle 定位用）
  text: string; // 源文件任务行原文（提交校验用）
  html?: string; // 渲染用 HTML（缺省 = 纯文本去 markdown 标记）
  checked: boolean; // 构建时状态
}

const strip = (s: string) =>
  s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*`]/g, "");

/**
 * 可双向勾选的任务列表（防误勾设计）：
 * - 打勾后任务留在原位划线显示，点勾选框即可撤销；
 * - 构建时已完成的折叠进「已完成」，同样可以取消勾选——误勾的永远找得回；
 * - 无 token 时只读。
 */
export default function TaskList({
  path,
  items,
  limit,
  doneLabel = "已完成",
  emptyText,
}: {
  path: string;
  items: TaskItem[];
  limit?: number;
  doneLabel?: string;
  emptyText?: string;
}) {
  const [canWrite, setCanWrite] = useState(false);
  const [live, setLive] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setCanWrite(!!getToken()), []);

  const isChecked = (t: TaskItem) => live[t.idx] ?? t.checked;

  const toggle = async (t: TaskItem) => {
    if (!canWrite || busy) return;
    const to = !isChecked(t);
    setBusy(true);
    setLive((d) => ({ ...d, [t.idx]: to }));
    setMsg("提交中…");
    try {
      await saveTaskToggle(path, t.idx, t.text, to);
      setMsg(
        to
          ? "✓ 已完成（误勾再点一下即撤销），约 1 分钟后全站更新"
          : "✓ 已撤销，约 1 分钟后全站更新"
      );
    } catch (e) {
      setLive((d) => ({ ...d, [t.idx]: !to }));
      setMsg(`✗ ${e instanceof Error ? e.message : "提交失败"}`);
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(""), 6000);
    }
  };

  const row = (t: TaskItem) => (
    <li key={t.idx} className="today-task">
      <input
        type="checkbox"
        checked={isChecked(t)}
        disabled={!canWrite || busy}
        onChange={() => toggle(t)}
        title={
          canWrite
            ? "勾 / 取消 = 直接 commit 源文件"
            : "在 ⚙️ 设置里配 token 后可直接打勾"
        }
      />
      {t.html ? (
        <span
          className={isChecked(t) ? "task-done" : undefined}
          dangerouslySetInnerHTML={{ __html: t.html }}
        />
      ) : (
        <span className={isChecked(t) ? "task-done" : undefined}>
          {strip(t.text)}
        </span>
      )}
    </li>
  );

  const open = items.filter((t) => !t.checked);
  const done = items.filter((t) => t.checked);
  const show = limit ? open.slice(0, limit) : open;

  return (
    <div>
      {show.length ? (
        <ul className="task-list">{show.map(row)}</ul>
      ) : (
        emptyText && <p className="muted">{emptyText}</p>
      )}
      {limit && open.length > limit && (
        <p className="muted small">…还有 {open.length - limit} 项未列出</p>
      )}
      {done.length > 0 && (
        <details className="fold">
          <summary>
            ✅ {doneLabel} {done.length} 项（误勾的来这里取消）
          </summary>
          <ul className="task-list">{done.map(row)}</ul>
        </details>
      )}
      {msg && <div className="save-msg">{msg}</div>}
    </div>
  );
}
