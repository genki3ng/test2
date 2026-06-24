"use client";

/** 打开全局「派活给 Claude」弹窗并预填内容 */
export default function AskButton({
  label,
  kind,
  topic,
  detail,
  className = "btn ghost mini",
}: {
  label: string;
  kind: string;
  topic?: string;
  detail?: string;
  className?: string;
}) {
  return (
    <button
      className={className}
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("ask-claude", { detail: { kind, topic, detail } })
        )
      }
    >
      {label}
    </button>
  );
}
