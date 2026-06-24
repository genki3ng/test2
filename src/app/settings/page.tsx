"use client";

import { useEffect, useState } from "react";
import {
  getToken,
  setToken,
  ghTestToken,
  REPO,
  syncWallpaperToRepo,
  removeWallpaperFromRepo,
} from "@/lib/githubClient";
import {
  getWallpaper,
  getRepoWallpaper,
  isWallpaperOff,
  markWallpaperSynced,
  clearWallpaperOff,
  saveWallpaper,
  fileToDataURL,
} from "@/lib/wallpaper";

function WallpaperCard() {
  const [wp, setWp] = useState<string | null>(null); // 本地副本/URL 壁纸
  const [repoWp, setRepoWp] = useState<string | null>(null); // 仓库壁纸（构建时烤入）
  const [off, setOff] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setWp(getWallpaper());
    setRepoWp(getRepoWallpaper());
    setOff(isWallpaperOff());
    setHasToken(!!getToken());
  }, []);

  const preview = wp ?? (off ? null : repoWp);

  const onFile = async (f: File | undefined) => {
    if (!f || busy) return;
    setBusy(true);
    setMsg("压缩中…");
    try {
      const data = await fileToDataURL(f);
      saveWallpaper(data); // 本设备即时生效
      setWp(data);
      setOff(false);
      if (getToken()) {
        setMsg("本设备已生效，正在同步到仓库…");
        try {
          await syncWallpaperToRepo(data);
          markWallpaperSynced();
          setMsg("✅ 已同步到仓库——约 1 分钟重建后，所有设备自动生效");
        } catch (e) {
          setMsg(
            `✅ 本设备已生效；✗ 仓库同步失败：${e instanceof Error ? e.message : "未知错误"}`
          );
        }
      } else {
        setMsg("✅ 已设置（仅本设备）。在上方配好 token 后再上传一次，即可同步所有设备。");
      }
    } catch (e) {
      setMsg("✗ " + (e instanceof Error ? e.message : "读取图片失败"));
    } finally {
      setBusy(false);
    }
  };

  const [url, setUrl] = useState("");
  const applyUrl = () => {
    try {
      saveWallpaper(url.trim());
      setWp(url.trim());
      setOff(false);
      setMsg("✅ 已设置 URL 壁纸（URL 壁纸仅存本设备，不同步）");
    } catch (e) {
      setMsg("✗ " + (e instanceof Error ? e.message : "失败"));
    }
  };

  const clear = async () => {
    if (busy) return;
    setBusy(true);
    try {
      saveWallpaper(null);
      setWp(null);
      setOff(isWallpaperOff());
      if (getToken() && repoWp) {
        setMsg("正在清除仓库壁纸…");
        try {
          await removeWallpaperFromRepo();
          setMsg("✅ 已清除（含仓库壁纸，约 1 分钟后所有设备恢复默认光池）");
        } catch (e) {
          setMsg(
            `本设备已清除；✗ 仓库壁纸清除失败：${e instanceof Error ? e.message : "未知错误"}`
          );
        }
      } else if (repoWp) {
        setMsg("已关闭本设备壁纸（仓库壁纸仍在，其它设备不受影响；配 token 后可一并清除）");
      } else {
        setMsg("已清除，恢复默认光池背景");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card section" style={{ maxWidth: 640 }}>
      <div className="card-title">🖼 玻璃壁纸</div>
      <p className="muted small">
        上传一张壁纸当背景，磨砂玻璃的模糊与折射在照片上最直观（仅<b>液玻主题</b>生效，建议横向大图）。
        {hasToken ? (
          <>已配 token：上传会自动 commit 到仓库，<b>约 1 分钟后所有设备同步生效</b>。</>
        ) : (
          <>未配 token：壁纸只存这台设备；配好上方 token 再上传即可全设备同步。</>
        )}
      </p>
      <input
        type="file"
        accept="image/*"
        disabled={busy}
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          className="field"
          style={{ margin: 0, flex: 1 }}
          placeholder="或粘贴图片 URL（https://…，仅本设备）"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          className="btn"
          disabled={!/^https?:\/\//.test(url) || busy}
          onClick={applyUrl}
        >
          应用
        </button>
      </div>
      {preview && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              height: 110,
              borderRadius: 12,
              backgroundImage: `url("${preview.replace(/"/g, '\\"')}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              border: "1px solid var(--line)",
            }}
          />
          <p className="muted small" style={{ margin: "6px 0 0" }}>
            当前来源：{wp ? "本设备" : "仓库（全设备共享）"}
          </p>
          <button className="btn ghost" style={{ marginTop: 8 }} disabled={busy} onClick={clear}>
            清除壁纸
          </button>
        </div>
      )}
      {!preview && off && repoWp && (
        <p className="muted small">
          本设备已关闭壁纸（仓库壁纸仍在）。重新上传或
          <button
            className="btn mini ghost"
            onClick={() => {
              clearWallpaperOff();
              location.reload();
            }}
          >
            恢复仓库壁纸
          </button>
        </p>
      )}
      {msg && <p className="small" style={{ marginBottom: 0 }}>{msg}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [token, setTok] = useState("");
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setTok(getToken());
    setSaved(!!getToken());
  }, []);

  const save = () => {
    setToken(token);
    setSaved(!!token);
    setMsg(token ? "已保存到本浏览器 localStorage（不入库）" : "已清除");
  };

  const test = async () => {
    setMsg("测试中…");
    try {
      setToken(token);
      setMsg("✅ " + (await ghTestToken()));
      setSaved(!!token);
    } catch (e) {
      setMsg("✗ " + (e instanceof Error ? e.message : "失败"));
    }
  };

  return (
    <>
      <h1 className="page-title">⚙️ 设置</h1>
      <p className="page-sub">配置写通道后，全站交互功能解锁（勾任务、改状态、练习自评、派活给 Claude）。</p>

      <div className="card section" style={{ maxWidth: 640 }}>
        <div className="card-title">GitHub Token（写通道）</div>
        <p className="muted small">
          所有写操作 = 浏览器直接 commit 到 <code>{REPO}</code> 的 main 分支 →
          Vercel 自动重建（约 1 分钟生效）。token 只存在<b>这台设备的浏览器</b>里。
        </p>
        <input
          className="field"
          type="password"
          placeholder="github_pat_…"
          value={token}
          onChange={(e) => setTok(e.target.value)}
        />
        <div style={{ marginTop: 10 }}>
          <button className="btn" onClick={save}>
            保存
          </button>{" "}
          <button className="btn ghost" onClick={test}>
            测试连接
          </button>{" "}
          {saved && (
            <button
              className="btn ghost"
              onClick={() => {
                setTok("");
                setToken("");
                setSaved(false);
                setMsg("已清除");
              }}
            >
              清除
            </button>
          )}
        </div>
        {msg && <p className="small" style={{ marginBottom: 0 }}>{msg}</p>}
      </div>

      <WallpaperCard />

      <div className="card" style={{ maxWidth: 640 }}>
        <div className="card-title">怎么拿 token</div>
        <ol className="small" style={{ paddingLeft: 18, margin: 0 }}>
          <li>
            <b>给 1p3a 浏览器扩展配过的那个 fine-grained PAT 直接复用即可</b>
            （同样的权限需求）。
          </li>
          <li>
            没有的话：GitHub → Settings → Developer settings → Fine-grained
            tokens → Generate new token → Repository access 只选{" "}
            <code>{REPO}</code> → Permissions → Contents：<b>Read and write</b>。
          </li>
          <li>手机/平板要用的话，在那台设备的浏览器里也存一次。</li>
        </ol>
      </div>
    </>
  );
}
