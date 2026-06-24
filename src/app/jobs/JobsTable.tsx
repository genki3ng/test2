"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getToken, saveOpeningPin, saveOpeningAttitude } from "@/lib/githubClient";

export interface JobItem {
  company: string;
  slug: string;
  tier: number;
  stars: number;
  hot: boolean;
  pinned: boolean;
  attitude: "" | "love" | "no";
  excluded: boolean;
  title: string;
  location: string;
  anchor: string; // 写回定位用（行内链接或标题）
  html: string; // 已渲染好的原文行
  sectionDate: string;
}

// 态度循环：未定 → 💚 心仪 → 🚫 不合适 → 未定
const NEXT_ATT: Record<string, "" | "love" | "no"> = {
  "": "love",
  love: "no",
  no: "",
};
const ATT_ICON: Record<string, string> = { "": "·", love: "💚", no: "🚫" };
const attWeight = (a: string) => (a === "love" ? 2 : a === "no" ? 0 : 1);

export default function JobsTable({ jobs }: { jobs: JobItem[] }) {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("");
  const [company, setCompany] = useState("");
  const [sortBy, setSortBy] = useState(""); // "" 默认 / att 态度 / fit 契合 / co 公司 / new 最新
  const [showExcluded, setShowExcluded] = useState(false);
  const [hideNo, setHideNo] = useState(false);
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [pinOverride, setPinOverride] = useState<Record<string, boolean>>({});
  const [attOverride, setAttOverride] = useState<Record<string, "" | "love" | "no">>({});
  const [busyKey, setBusyKey] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setCanWrite(!!getToken());
    if (new URLSearchParams(location.search).has("pinned")) setOnlyPinned(true);
  }, []);

  const keyOf = (j: JobItem) => `${j.slug}|${j.anchor}`;
  const isPinned = (j: JobItem) => pinOverride[keyOf(j)] ?? j.pinned;
  const attOf = (j: JobItem): "" | "love" | "no" => attOverride[keyOf(j)] ?? j.attitude;

  const togglePin = async (j: JobItem) => {
    if (!canWrite || busyKey) return;
    const to = !isPinned(j);
    const key = keyOf(j);
    setBusyKey(key);
    setPinOverride((o) => ({ ...o, [key]: to }));
    setMsg("提交中…");
    try {
      await saveOpeningPin(j.slug, j.anchor, to, j.title);
      setMsg(to ? "📌 已加入投递清单（约 1 分钟后全站更新）" : "已移出投递清单");
    } catch (e) {
      setPinOverride((o) => ({ ...o, [key]: !to }));
      setMsg(`✗ ${e instanceof Error ? e.message : "提交失败"}`);
    } finally {
      setBusyKey("");
      setTimeout(() => setMsg(""), 6000);
    }
  };

  const cycleAttitude = async (j: JobItem) => {
    if (!canWrite || busyKey) return;
    const cur = attOf(j);
    const to = NEXT_ATT[cur];
    const key = keyOf(j);
    setBusyKey(key);
    setAttOverride((o) => ({ ...o, [key]: to }));
    setMsg("提交中…");
    try {
      await saveOpeningAttitude(j.slug, j.anchor, to, j.title);
      setMsg(
        to === "love"
          ? "💚 标为心仪（约 1 分钟后全站更新）"
          : to === "no"
          ? "🚫 标为不合适"
          : "已清除态度"
      );
    } catch (e) {
      setAttOverride((o) => ({ ...o, [key]: cur }));
      setMsg(`✗ ${e instanceof Error ? e.message : "提交失败"}`);
    } finally {
      setBusyKey("");
      setTimeout(() => setMsg(""), 6000);
    }
  };

  const companies = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.company))),
    [jobs]
  );
  const pinnedCount = jobs.filter((j) => !j.excluded && isPinned(j)).length;
  const loveCount = jobs.filter((j) => !j.excluded && attOf(j) === "love").length;

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const fit = (j: JobItem) => j.stars + (j.hot ? 3 : 0);
    const byDefault = (a: JobItem, b: JobItem) =>
      Number(isPinned(b)) - Number(isPinned(a)) ||
      attWeight(attOf(b)) - attWeight(attOf(a)) ||
      a.tier - b.tier ||
      fit(b) - fit(a) ||
      a.company.localeCompare(b.company);
    const sorters: Record<string, (a: JobItem, b: JobItem) => number> = {
      "": byDefault,
      att: (a, b) =>
        attWeight(attOf(b)) - attWeight(attOf(a)) ||
        Number(isPinned(b)) - Number(isPinned(a)) ||
        a.tier - b.tier ||
        fit(b) - fit(a),
      fit: (a, b) => fit(b) - fit(a) || a.tier - b.tier,
      co: (a, b) => a.company.localeCompare(b.company) || a.tier - b.tier,
      new: (a, b) => (b.sectionDate || "").localeCompare(a.sectionDate || ""),
    };
    return jobs
      .filter((j) => (showExcluded ? true : !j.excluded))
      .filter((j) => (hideNo ? attOf(j) !== "no" : true))
      .filter((j) => (onlyPinned ? isPinned(j) : true))
      .filter((j) => (tier ? j.tier === Number(tier) : true))
      .filter((j) => (company ? j.company === company : true))
      .filter((j) =>
        kw
          ? (j.title + j.location + j.company + j.html).toLowerCase().includes(kw)
          : true
      )
      .sort(sorters[sortBy] ?? byDefault);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, q, tier, company, sortBy, showExcluded, hideNo, onlyPinned, pinOverride, attOverride]);

  return (
    <>
      <div className="filters">
        <input
          placeholder="搜索岗位 / 地点 / 关键词…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} title="排序方式">
          <option value="">排序：默认（📌→💚→梯队→契合）</option>
          <option value="att">排序：态度（💚 心仪优先）</option>
          <option value="fit">排序：契合度（⭐🎯）</option>
          <option value="co">排序：按公司</option>
          <option value="new">排序：最近抓取</option>
        </select>
        <select value={tier} onChange={(e) => setTier(e.target.value)}>
          <option value="">全部梯队</option>
          <option value="1">🥇 第一梯队</option>
          <option value="2">🥈 第二梯队</option>
          <option value="3">🥉 第三梯队</option>
        </select>
        <select value={company} onChange={(e) => setCompany(e.target.value)}>
          <option value="">全部公司</option>
          {companies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="muted small" style={{ alignSelf: "center" }}>
          <input
            type="checkbox"
            checked={onlyPinned}
            onChange={(e) => setOnlyPinned(e.target.checked)}
          />{" "}
          📌 只看投递清单（{pinnedCount}）
        </label>
        <label className="muted small" style={{ alignSelf: "center" }}>
          <input
            type="checkbox"
            checked={hideNo}
            onChange={(e) => setHideNo(e.target.checked)}
          />{" "}
          🚫 隐藏不合适
        </label>
        <label className="muted small" style={{ alignSelf: "center" }}>
          <input
            type="checkbox"
            checked={showExcluded}
            onChange={(e) => setShowExcluded(e.target.checked)}
          />{" "}
          含已排除
        </label>
      </div>

      <p className="muted small">
        {filtered.length} 个岗位 · ⭐/🎯 = 各 session 扫岗判断 · 📌 = 投递清单（{pinnedCount}，**会显示在 pipeline 对应公司下、可标投递进度**）·
        💚 = 心仪（{loveCount}）/ 🚫 = 不合适
        {canWrite ? "，点行内按钮切换" : "——在 ⚙️ 设置配 token 后可直接点选"}
      </p>
      {msg && <p className="small">{msg}</p>}

      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>📌</th>
                <th title="态度：点击循环 未定→💚心仪→🚫不合适">态度</th>
                <th>公司</th>
                <th>契合</th>
                <th>岗位与说明（原文）</th>
                <th>地点</th>
                <th>抓取</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => (
                <tr key={keyOf(j)} style={j.excluded ? { opacity: 0.55 } : undefined}>
                  <td>
                    {!j.excluded && (
                      <button
                        className={`pin-btn ${isPinned(j) ? "on" : ""}`}
                        disabled={!canWrite || !!busyKey}
                        onClick={() => togglePin(j)}
                        title={
                          canWrite
                            ? isPinned(j)
                              ? "移出投递清单（也会从 pipeline 公司下移除）"
                              : "📌 加入投递清单 → 会显示在 pipeline 对应公司下（可在那标投递进度）；内推弹窗也自动预选"
                            : "在 ⚙️ 设置配 token 后可点选"
                        }
                      >
                        {isPinned(j) ? "📌" : "＋"}
                      </button>
                    )}
                  </td>
                  <td>
                    {!j.excluded && (
                      <button
                        className={`pin-btn att-${attOf(j) || "none"}`}
                        disabled={!canWrite || !!busyKey}
                        onClick={() => cycleAttitude(j)}
                        title={
                          canWrite
                            ? "点击循环：未定 → 💚 心仪 → 🚫 不合适"
                            : "在 ⚙️ 设置配 token 后可点选"
                        }
                      >
                        {ATT_ICON[attOf(j)]}
                      </button>
                    )}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link href={`/companies/${j.slug}`}>{j.company}</Link>{" "}
                    <span className={`tier-badge tier-${j.tier}`}>
                      {["", "一", "二", "三"][j.tier]}
                    </span>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {j.hot ? "🎯" : ""}
                    {"⭐".repeat(j.stars)}
                  </td>
                  <td dangerouslySetInnerHTML={{ __html: j.html }} />
                  <td className="muted">{j.location}</td>
                  <td className="muted small" style={{ whiteSpace: "nowrap" }}>
                    {j.sectionDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
