/* background service worker：右键菜单收集 + 快捷键整页收集 */

importScripts("gh.js");

const TYPES = [
  ["mianjing", "面经"],
  ["jd", "JD/职位"],
  ["visa", "签证/身份"],
  ["other", "其他"],
];

// 右键菜单：选中文字 → 子菜单选类型 → 存 inbox
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "l3a-parent",
      title: "收集选中文字 → OfferOS inbox",
      contexts: ["selection"],
    });
    TYPES.forEach(([v, label]) =>
      chrome.contextMenus.create({
        id: "l3a-" + v,
        parentId: "l3a-parent",
        title: label,
        contexts: ["selection"],
      })
    );
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (typeof info.menuItemId !== "string") return;
  if (!info.menuItemId.startsWith("l3a-") || info.menuItemId === "l3a-parent") return;
  const type = info.menuItemId.slice(4);
  try {
    const path = await saveCapture({
      types: [type],
      text: info.selectionText || "",
      image: null,
      pageInfo: { url: tab && tab.url, title: tab && tab.title },
    });
    flashBadge("✓", "#1aab4b");
    console.log("[1p3a] 已保存", path);
  } catch (e) {
    flashBadge("!", "#d33");
    console.error("[1p3a] 收集失败", e);
  }
});

// 整页+正文 一键收集（后台执行，popup 关掉也不中断上传）
async function captureBothInBackground(types) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  flashBadge("…", "#888", 120000);
  try {
    const [{ result: grab }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: grabFromPage,
    });
    const base64 = await captureFullPageWorker(tab.id);
    const path = await saveCapture({
      types: types && types.length ? types : ["mianjing"],
      text: grab.text,
      image: { base64, ext: "png" },
      pageInfo: { url: grab.url, title: grab.title },
    });
    flashBadge("✓", "#1aab4b", 6000);
    console.log("[1p3a] 整页已保存", path);
    return path;
  } catch (e) {
    flashBadge("!", "#d33", 8000);
    console.error("[1p3a] 整页收集失败", e);
    throw e;
  }
}

// 快捷键：整页截图 + 正文 一键存（默认 Alt+Shift+S，类型按面经）
chrome.commands.onCommand.addListener(async (cmd) => {
  if (cmd !== "capture-fullpage") return;
  await captureBothInBackground(["mianjing"]).catch(() => {});
});

// popup 的 ⚡ 按钮 → 转后台执行（修复：以前跑在 popup 里，弹窗一关就静默中断）
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "l3a-capture-both") {
    captureBothInBackground(msg.types)
      .then((path) => sendResponse({ ok: true, path }))
      .catch((e) => sendResponse({ ok: false, error: String(e && e.message || e) }));
    return true; // 异步 sendResponse
  }
});

let badgeTimer = null;
function flashBadge(text, color, ms = 4000) {
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text });
  if (badgeTimer) clearTimeout(badgeTimer);
  badgeTimer = setTimeout(() => chrome.action.setBadgeText({ text: "" }), ms);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 整页截图（service worker 版：OffscreenCanvas + createImageBitmap）
async function captureFullPageWorker(tabId) {
  const runInPage = (func, args) =>
    chrome.scripting.executeScript({ target: { tabId }, func, args });
  // v0.5.1：支持"窗口不滚、内部容器滚"的页面（如 1p3a /interview/guides/）
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
  const headerH = m0.top; // 内滚容器上方的静态页头高度（窗口滚动时为 0）
  const canvas = new OffscreenCanvas(
    Math.round(m0.viewW * m0.dpr),
    Math.round((headerH + maxH) * m0.dpr)
  );
  const ctx = canvas.getContext("2d");

  // 滚动截图要求目标标签页保持可见：每步校验，切走则中断报错（角标 !），避免截到别的页面
  const tabInfo = await chrome.tabs.get(tabId);
  const winId = tabInfo.windowId;
  const assertVisible = async () => {
    const t = await chrome.tabs.get(tabId);
    if (!t.active) throw new Error("截图期间标签页被切走，已中断（重截请停留在该页几秒）");
  };

  let target = 0;
  let lastY = -1;
  try {
    for (let n = 0; n < 50; n++) {
      await scrollPage(target);
      await sleep(350);
      await assertVisible();
      const m = await metrics();
      let dataUrl;
      try {
        dataUrl = await chrome.tabs.captureVisibleTab(winId, { format: "png" });
      } catch (e) {
        await sleep(600);
        await assertVisible();
        dataUrl = await chrome.tabs.captureVisibleTab(winId, { format: "png" });
      }
      const blob = await (await fetch(dataUrl)).blob();
      const bmp = await createImageBitmap(blob);
      if (headerH > 0) {
        // 内滚容器：首帧画整窗（含页头），后续只取容器区域、按 scrollTop 拼
        if (n === 0) ctx.drawImage(bmp, 0, 0);
        else
          ctx.drawImage(
            bmp,
            0, Math.round(headerH * m.dpr), bmp.width, Math.round(m.viewH * m.dpr),
            0, Math.round((headerH + m.y) * m.dpr), bmp.width, Math.round(m.viewH * m.dpr)
          );
      } else {
        ctx.drawImage(bmp, 0, Math.round(m.y * m.dpr));
      }
      if (m.y <= lastY || m.y + m.viewH >= maxH) break;
      lastY = m.y;
      target = m.y + m.viewH;
      if (n === 0) await hideFixed();
    }
  } finally {
    await restoreFixed();
    await scrollPage(m0.y);
  }

  const outBlob = await canvas.convertToBlob({ type: "image/png" });
  return abToB64(await outBlob.arrayBuffer());
}

function abToB64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}
