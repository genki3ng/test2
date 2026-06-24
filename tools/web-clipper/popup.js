/* 依赖 gh.js（先于本文件加载）：GH_DEFAULTS / saveCapture / grabFromPage / ghHeaders 等 */

/* ============ 高亮设置（chrome.storage.sync）============ */

const HL_DEFAULTS = {
  enabled: true,
  recentDays: 3,
  weekDays: 7,
  basis: "start",
  dimOthers: false,
  showBadge: true,
};
const hlCheckboxes = ["enabled", "dimOthers", "showBadge"];
const hlNumbers = ["recentDays", "weekDays"];
const hlSelects = ["basis"];

chrome.storage.sync.get(HL_DEFAULTS, (s) => {
  hlCheckboxes.forEach((id) => (document.getElementById(id).checked = s[id]));
  hlNumbers.forEach((id) => (document.getElementById(id).value = s[id]));
  hlSelects.forEach((id) => (document.getElementById(id).value = s[id]));
});

function saveHl() {
  const out = {};
  hlCheckboxes.forEach((id) => (out[id] = document.getElementById(id).checked));
  hlNumbers.forEach((id) => {
    const v = parseInt(document.getElementById(id).value, 10);
    out[id] = isNaN(v) ? HL_DEFAULTS[id] : Math.max(0, v);
  });
  hlSelects.forEach((id) => (out[id] = document.getElementById(id).value));
  chrome.storage.sync.set(out);
}
[...hlCheckboxes, ...hlNumbers, ...hlSelects].forEach((id) => {
  const el = document.getElementById(id);
  el.addEventListener("change", saveHl);
  if (hlNumbers.includes(id)) el.addEventListener("input", saveHl);
});

/* ============ 类型：打勾样式但互斥 ============ */
document.querySelectorAll("#types input").forEach((cb) => {
  cb.addEventListener("change", () => {
    document.querySelectorAll("#types input").forEach((o) => {
      if (o !== cb) o.checked = false;
    });
    cb.checked = true;
  });
});
function getCheckedTypes() {
  const checked = Array.from(
    document.querySelectorAll("#types input:checked")
  ).map((i) => i.value);
  return checked.length ? checked : ["other"];
}

/* ============ GitHub 设置（chrome.storage.local）============ */
const ghFields = Object.keys(GH_DEFAULTS); // 来自 gh.js

function updateInboxLink(cfg) {
  const a = document.getElementById("inboxLink");
  const branch = cfg.ghBranch || "main";
  const path = (cfg.ghPath || "inbox").replace(/\/+$/, "");
  if (cfg.ghOwner && cfg.ghRepo) {
    a.href = `https://github.com/${cfg.ghOwner}/${cfg.ghRepo}/tree/${branch}/${path}`;
  }
}

chrome.storage.local.get(GH_DEFAULTS, (s) => {
  const cfg = { ...GH_DEFAULTS, ...s };
  ghFields.forEach((id) => (document.getElementById(id).value = cfg[id]));
  if (!cfg.ghToken) document.getElementById("ghDetails").open = true;
  updateInboxLink(cfg);
});

function readCfgFromForm() {
  const cfg = {};
  ghFields.forEach((id) => (cfg[id] = document.getElementById(id).value.trim()));
  cfg.ghBranch = cfg.ghBranch || "main";
  cfg.ghPath = (cfg.ghPath || "inbox").replace(/\/+$/, "");
  return new Promise((r) => chrome.storage.local.set(cfg, () => r(cfg)));
}

document.getElementById("btnSaveCfg").addEventListener("click", async () => {
  const cfg = await readCfgFromForm();
  updateInboxLink(cfg);
  setStatus("cfgStatus", "已保存设置", "ok");
});

document.getElementById("btnTest").addEventListener("click", async () => {
  try {
    const cfg = await readCfgFromForm();
    const res = await fetch(
      `https://api.github.com/repos/${cfg.ghOwner}/${cfg.ghRepo}`,
      { headers: ghHeaders(cfg.ghToken) }
    );
    setStatus(
      "cfgStatus",
      res.ok ? "连接成功 ✓ 仓库可写" : `失败：HTTP ${res.status}`,
      res.ok ? "ok" : "err"
    );
  } catch (e) {
    setStatus("cfgStatus", "失败：" + e.message, "err");
  }
});

/* ============ 收集 ============ */
let pendingImage = null; // { base64, ext }
let pageInfo = { url: "", title: "" };

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (tab) {
    pageInfo = { url: tab.url || "", title: tab.title || "" };
    document.getElementById("src").textContent =
      "来源：" + (tab.title || tab.url || "—");
  }
});

// 粘贴图片 -> 暂存
document.getElementById("clipText").addEventListener("paste", (e) => {
  const items = e.clipboardData && e.clipboardData.items;
  if (!items) return;
  for (const it of items) {
    if (it.type && it.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        pendingImage = {
          base64: reader.result.split(",")[1],
          ext: (it.type.split("/")[1] || "png").replace("jpeg", "jpg"),
        };
        setStatus("clipStatus", "已附带粘贴的图片，保存时一起上传", "ok");
      };
      reader.readAsDataURL(it.getAsFile());
    }
  }
});

// 抓正文/选中
document.getElementById("btnGrab").addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: grabFromPage,
    });
    document.getElementById("clipText").value = result.text || "";
    pageInfo = { url: result.url, title: result.title };
    document.getElementById("src").textContent = "来源：" + (result.title || result.url);
    setStatus("clipStatus", `已抓取（${result.mode}），可编辑后保存`, "ok");
  } catch (e) {
    setStatus("clipStatus", "抓取失败：" + e.message, "err");
  }
});

// 截整页
document.getElementById("btnShot").addEventListener("click", async () => {
  try {
    setStatus("clipStatus", "正在滚动截整页…", "");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    pendingImage = { base64: await captureFullPage(tab.id), ext: "png" };
    setStatus("clipStatus", "整页截图完成，保存时一起上传", "ok");
  } catch (e) {
    setStatus("clipStatus", "整页截图失败：" + e.message, "err");
  }
});

// 仅可见区
document.getElementById("btnShotView").addEventListener("click", async () => {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(undefined, { format: "png" });
    pendingImage = { base64: dataUrl.split(",")[1], ext: "png" };
    setStatus("clipStatus", "已截可见区，保存时一起上传", "ok");
  } catch (e) {
    setStatus("clipStatus", "截图失败：" + e.message, "err");
  }
});

// ⚡ 正文 + 整页 一键收集 —— 交给后台执行（v0.5 修复：以前跑在弹窗里，
// 弹窗一关（点页面任意处）就静默中断、没存也没提示）
document.getElementById("btnBoth").addEventListener("click", async () => {
  try {
    await readCfgFromForm();
    chrome.runtime.sendMessage(
      { type: "l3a-capture-both", types: getCheckedTypes() },
      (resp) => {
        // 弹窗若已关闭，这个回调不会跑——没关系，后台用图标角标报结果
        if (chrome.runtime.lastError) return;
        if (resp && resp.ok) setStatus("clipStatus", `已保存 ${resp.path} ✓`, "ok");
        else if (resp) setStatus("clipStatus", "失败：" + resp.error, "err");
      }
    );
    setStatus(
      "clipStatus",
      "已交给后台 ✓ 可关弹窗。截图滚动那几秒别切走标签页；图标 …→✓ 即成功，! 为失败",
      "ok"
    );
  } catch (e) {
    setStatus("clipStatus", "失败：" + e.message, "err");
  }
});

// 保存上面准备好的内容（文字 + 可能的图片）
document.getElementById("btnSave").addEventListener("click", async () => {
  const text = document.getElementById("clipText").value.trim();
  if (!text && !pendingImage) {
    setStatus("clipStatus", "没有内容：先抓取/粘贴文字，或截图/粘贴图片", "err");
    return;
  }
  try {
    await readCfgFromForm();
    const path = await saveCapture({
      types: getCheckedTypes(),
      text,
      image: pendingImage,
      pageInfo,
    });
    setStatus("clipStatus", `已保存 ${path} ✓`, "ok");
    document.getElementById("clipText").value = "";
    pendingImage = null;
  } catch (e) {
    setStatus("clipStatus", "保存失败：" + e.message, "err");
  }
});

/* ============ 整页截图（popup 版：DOM canvas + Image）============ */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const loadImg = (src) =>
  new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });

async function captureFullPage(tabId) {
  const runInPage = (func, args) =>
    chrome.scripting.executeScript({ target: { tabId }, func, args });
  // v0.5.1+：支持内部滚动容器页面（同 background.js）
  const metrics = async () =>
    (
      await runInPage(() => {
        const doc = document.scrollingElement || document.documentElement;
        let el = document.querySelector("[data-l3a-scroll]");
        if (!el) {
          el = doc;
          if (doc.scrollHeight <= window.innerHeight + 8) {
            let best = null;
            for (const e of document.querySelectorAll("body *")) {
              if (e.clientHeight < window.innerHeight * 0.5) continue;
              const cs = getComputedStyle(e);
              if (!/(auto|scroll|overlay)/.test(cs.overflowY)) continue;
              if (
                e.scrollHeight > e.clientHeight + 200 &&
                (!best || e.scrollHeight > best.scrollHeight)
              )
                best = e;
            }
            if (best) {
              best.setAttribute("data-l3a-scroll", "1");
              el = best;
            }
          }
        }
        const isDoc = el === doc || el === document.body;
        return {
          scrollH: el.scrollHeight,
          viewH: isDoc ? window.innerHeight : el.clientHeight,
          viewW: window.innerWidth,
          dpr: window.devicePixelRatio || 1,
          y: isDoc ? window.scrollY : el.scrollTop,
          top: isDoc ? 0 : Math.max(0, Math.round(el.getBoundingClientRect().top)),
        };
      })
    )[0].result;
  const scrollPage = (yy) =>
    runInPage((y2) => {
      const el = document.querySelector("[data-l3a-scroll]");
      if (el) el.scrollTop = y2;
      else window.scrollTo(0, y2);
    }, [yy]);
  const hideFixed = () =>
    runInPage(() => {
      document.querySelectorAll("body *").forEach((el) => {
        const p = getComputedStyle(el).position;
        if (p === "fixed" || p === "sticky") {
          el.setAttribute("data-l3a-vis", el.style.visibility || "");
          el.style.setProperty("visibility", "hidden", "important");
        }
      });
    });
  const restoreFixed = () =>
    runInPage(() => {
      document.querySelectorAll("[data-l3a-vis]").forEach((el) => {
        const v = el.getAttribute("data-l3a-vis");
        if (v) el.style.visibility = v;
        else el.style.removeProperty("visibility");
        el.removeAttribute("data-l3a-vis");
      });
      document
        .querySelectorAll("[data-l3a-scroll]")
        .forEach((el) => el.removeAttribute("data-l3a-scroll"));
    });

  const m0 = await metrics();
  const maxH = Math.min(m0.scrollH, 24000);
  const headerH = m0.top;
  const canvas = document.createElement("canvas");
  canvas.width = m0.viewW * m0.dpr;
  canvas.height = (headerH + maxH) * m0.dpr;
  const ctx = canvas.getContext("2d");

  let target = 0;
  let lastY = -1;
  try {
    for (let n = 0; n < 50; n++) {
      await scrollPage(target);
      await sleep(350);
      const m = await metrics();
      let dataUrl;
      try {
        dataUrl = await chrome.tabs.captureVisibleTab(undefined, { format: "png" });
      } catch (e) {
        await sleep(600);
        dataUrl = await chrome.tabs.captureVisibleTab(undefined, { format: "png" });
      }
      const img = await loadImg(dataUrl);
      if (headerH > 0) {
        if (n === 0) ctx.drawImage(img, 0, 0);
        else
          ctx.drawImage(
            img,
            0, Math.round(headerH * m.dpr), img.width, Math.round(m.viewH * m.dpr),
            0, Math.round((headerH + m.y) * m.dpr), img.width, Math.round(m.viewH * m.dpr)
          );
      } else {
        ctx.drawImage(img, 0, Math.round(m.y * m.dpr));
      }
      if (m.y <= lastY || m.y + m.viewH >= maxH) break;
      lastY = m.y;
      target = m.y + m.viewH;
      if (n === 0) await hideFixed(); // 首屏保留 fixed/sticky，之后隐藏避免重复
    }
  } finally {
    await restoreFixed();
    await scrollPage(m0.y);
  }
  return canvas.toDataURL("image/png").split(",")[1];
}

function setStatus(id, msg, kind) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = "status " + (kind || "");
}
