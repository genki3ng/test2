/*
 * 1p3a 最新帖高亮 —— content script
 *
 * 在 1point3acres（Discuz! 论坛）的版块列表页，根据“发帖时间”或“最后回复时间”
 * 给每一行打上 age（多少天前），并按阈值高亮：
 *   age <= recentDays  -> 强高亮（l3a-recent）
 *   age <= weekDays    -> 弱高亮（l3a-week）
 *
 * 设置存在 chrome.storage.sync，popup 改动后通过 storage.onChanged 实时重扫。
 */

const DEFAULTS = {
  enabled: true,
  recentDays: 3, // 强高亮阈值
  weekDays: 7, // 弱高亮阈值
  basis: "start", // 'start' = 发帖时间 / 'last' = 最后回复时间
  dimOthers: false, // 是否把不命中的帖子变灰
  showBadge: true, // 是否在标题旁显示“N天前”徽章
};

let settings = { ...DEFAULTS };

/* ---------- 日期解析 ---------- */

// 把 Discuz 的时间文本/title 解析成 Date；解析不出返回 null
function parseDate(raw) {
  if (!raw) return null;
  const s = raw.trim();
  const now = new Date();

  // 绝对时间，带年份： 2024-6-17 / 2026-6-1 10:30 / 2026-06-01 10:30:00
  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    return new Date(
      +m[1], +m[2] - 1, +m[3],
      m[4] ? +m[4] : 0, m[5] ? +m[5] : 0, m[6] ? +m[6] : 0
    );
  }

  // 不带年份： 6-1 12:00（按今年算）
  m = s.match(/^(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})/);
  if (m) {
    return new Date(now.getFullYear(), +m[1] - 1, +m[2], +m[3], +m[4]);
  }

  // 相对时间
  if (/刚刚|秒前/.test(s)) return now;
  m = s.match(/(\d+)\s*分钟前/);
  if (m) return new Date(now - +m[1] * 60e3);
  m = s.match(/(\d+)\s*小时前/);
  if (m) return new Date(now - +m[1] * 3600e3);
  m = s.match(/(\d+)\s*天前/);
  if (m) return new Date(now - +m[1] * 86400e3);
  m = s.match(/(\d+)\s*周前/);
  if (m) return new Date(now - +m[1] * 7 * 86400e3);
  m = s.match(/(\d+)\s*个?月前/);
  if (m) return new Date(now - +m[1] * 30 * 86400e3);
  if (/昨天/.test(s)) return new Date(now - 86400e3);
  if (/前天/.test(s)) return new Date(now - 2 * 86400e3);

  return null;
}

// 从一个 td.by 单元格里取出时间（优先 title 属性的绝对时间）
function dateFromByCell(td) {
  if (!td) return null;
  const titled = td.querySelector("[title]");
  if (titled) {
    const d = parseDate(titled.getAttribute("title"));
    if (d) return d;
  }
  const em = td.querySelector("em");
  if (em) {
    const d = parseDate(em.textContent);
    if (d) return d;
  }
  return parseDate(td.textContent);
}

function ageInDays(date) {
  return (Date.now() - date.getTime()) / 86400e3;
}

function humanAge(days) {
  if (days < 1 / 24) return "刚刚";
  if (days < 1) return Math.round(days * 24) + "小时";
  return Math.round(days) + "天";
}

/* ---------- 选择行 & 时间单元格 ---------- */

function getThreadRows() {
  const table =
    document.getElementById("threadlisttableid") || document;
  return table.querySelectorAll(
    'tbody[id^="normalthread_"], tbody[id^="stickthread_"]'
  );
}

// 返回该行用于判断的时间单元格：发帖时间=第一个 td.by，最后回复=第二个 td.by
function pickByCell(tbody) {
  const byCells = tbody.querySelectorAll("td.by");
  if (!byCells.length) return null;
  if (settings.basis === "last" && byCells.length >= 2) return byCells[1];
  return byCells[0];
}

/* ---------- 应用 / 清除高亮 ---------- */

function clearRow(tbody) {
  tbody.classList.remove("l3a-recent", "l3a-week", "l3a-dim");
  const old = tbody.querySelector(".l3a-badge");
  if (old) old.remove();
}

function applyToRow(tbody) {
  clearRow(tbody);
  const td = pickByCell(tbody);
  const date = dateFromByCell(td);
  if (!date || isNaN(date)) return;

  const days = ageInDays(date);
  let level = null;
  if (days <= settings.recentDays) level = "recent";
  else if (days <= settings.weekDays) level = "week";

  if (level) {
    tbody.classList.add(level === "recent" ? "l3a-recent" : "l3a-week");
  } else if (settings.dimOthers) {
    tbody.classList.add("l3a-dim");
  }

  if (settings.showBadge && level) {
    const titleCell = tbody.querySelector("th");
    if (titleCell) {
      const badge = document.createElement("span");
      badge.className =
        "l3a-badge " + (level === "recent" ? "l3a-badge-recent" : "l3a-badge-week");
      badge.textContent = humanAge(days) + "前";
      titleCell.appendChild(badge);
    }
  }
}

function scan() {
  const rows = getThreadRows();
  if (!settings.enabled) {
    rows.forEach(clearRow);
    return;
  }
  rows.forEach(applyToRow);
}

/* ---------- 只在版块列表页运行 ---------- */

function isForumDisplayPage() {
  const u = location.href;
  if (/\/forum-\d+-\d+\.html/.test(u)) return true;
  if (/mod=forumdisplay/.test(u)) return true;
  return false;
}

/* ---------- 启动 ---------- */

function init() {
  if (!isForumDisplayPage()) return;
  chrome.storage.sync.get(DEFAULTS, (stored) => {
    settings = { ...DEFAULTS, ...stored };
    scan();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    for (const k in changes) settings[k] = changes[k].newValue;
    scan();
  });

  watchAjaxPagination();
}

/* Discuz 的“下一页/页码”走 AJAX 换列表不刷新页面 → 监听 DOM 变化重扫。
 * 防自激：只看新增节点，且跳过我们自己插入的 .l3a-badge。 */
let scanTimer = null;
function scheduleScan() {
  if (scanTimer) return;
  scanTimer = setTimeout(() => {
    scanTimer = null;
    scan();
  }, 250);
}

function watchAjaxPagination() {
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.classList && n.classList.contains("l3a-badge")) continue;
        if (
          (n.matches &&
            n.matches(
              'tbody[id^="normalthread_"], tbody[id^="stickthread_"], #threadlisttableid, table, form'
            )) ||
          (n.querySelector && n.querySelector('tbody[id^="normalthread_"]'))
        ) {
          scheduleScan();
          return;
        }
      }
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

init();
