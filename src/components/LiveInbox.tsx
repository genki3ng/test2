"use client";

import { useEffect, useState } from "react";
import { getToken, ghListDir, ghGetFile } from "@/lib/githubClient";

export interface InboxLite {
  file: string;
  title: string;
  type: string;
  kind: string;
  date: string;
}

/**
 * 收件箱实时卡：构建时数据先显示；配了 token 的浏览器挂载后直接读仓库 inbox/，
 * 刚派的活几秒内就能看到（不用等 Vercel 重建）。
 */
export default function LiveInbox({ initial }: { initial: InboxLite[] }) {
  const [items, setItems] = useState<InboxLite[]>(initial);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!getToken()) return;
    (async () => {
      try {
        const files = await ghListDir("inbox");
        const mds = files
          .filter((f) => f.name.endsWith(".md") && f.name.toLowerCase() !== "readme.md")
          .slice(-8); // 最多实时读 8 个，防 API 滥用
        const out: InboxLite[] = [];
        for (const f of mds) {
          const got = await ghGetFile(f.path);
          if (!got) continue;
          const fm = got.content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
          const pick = (key: string) => {
            const raw =
              fm?.[1].match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1].trim() ?? "";
            const quoted = raw.match(/^"(.*)"/);
            if (quoted) return quoted[1];
            return raw.replace(/\s+#.*$/, "").trim();
          };
          if (pick("status") !== "new") continue;
          out.push({
            file: f.name,
            title: pick("source_title") || f.name,
            type: pick("type").replace(/[[\]]/g, ""),
            kind: pick("kind"),
            date: f.name.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "",
          });
        }
        setItems(out.reverse());
        setLive(true);
      } catch {
        /* 实时读失败就保留构建时数据 */
      }
    })();
  }, []);

  return (
    <>
      {items.length ? (
        <ul className="next-list">
          {items.map((i) => (
            <li key={i.file}>
              <span className="who">
                <span className="pill amber">{i.kind || i.type || "new"}</span>
              </span>
              <span>
                {i.title} <span className="muted small">{i.date}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">
          已清空 ✅（📨 派活 / 浏览器扩展收集都会进这里，下个 Claude session 开场自动处理）
        </p>
      )}
      <p className="muted small" style={{ margin: "6px 0 0" }}>
        {live
          ? "↻ 实时（直接读仓库，刚派的活立即可见）"
          : "构建时快照——刚派的活约 1 分钟重建后出现；配 token 后此卡变实时"}
      </p>
    </>
  );
}
