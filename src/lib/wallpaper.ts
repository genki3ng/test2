"use client";

/**
 * 玻璃壁纸（液玻主题背景层），双层来源：
 * - 仓库壁纸 `public/wallpaper.jpg`：设置页上传时经写通道 commit，Vercel 重建后**全设备生效**
 *   （构建时烤进 <html data-repo-wallpaper>，浏览端无需 token）；
 * - 本设备 localStorage：上传后即时生效的本地副本 / URL 壁纸 / 无 token 时的退路。
 * 优先级：本地副本 > 仓库壁纸；本地副本带 synced 标记时，重建后自动让位给仓库版并释放配额。
 */

const KEY = "jh_wallpaper";
const SYNCED_KEY = "jh_wallpaper_synced"; // 本地副本已 commit 进仓库（重建后可丢弃）
const OFF_KEY = "jh_wallpaper_off"; // 本设备明确关闭壁纸（压过仓库壁纸）

export function getWallpaper(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** 构建时烤进 html 的仓库壁纸地址（如 /wallpaper.jpg?v=abc123；无则 null） */
export function getRepoWallpaper(): string | null {
  if (typeof window === "undefined") return null;
  return document.documentElement.dataset.repoWallpaper || null;
}

export function isWallpaperOff(): boolean {
  try {
    return localStorage.getItem(OFF_KEY) === "1";
  } catch {
    return false;
  }
}

export function markWallpaperSynced() {
  try {
    localStorage.setItem(SYNCED_KEY, "1");
  } catch {
    /* 标记丢了也不影响显示，只是本地副本不会自动让位 */
  }
}

/** 撤销"本设备关闭壁纸"，让仓库壁纸重新生效 */
export function clearWallpaperOff() {
  try {
    localStorage.removeItem(OFF_KEY);
  } catch {}
}

export function applyWallpaper(v: string | null) {
  const el = document.documentElement;
  if (v) {
    el.style.setProperty("--wallpaper", `url("${v.replace(/"/g, '\\"')}")`);
    el.dataset.wallpaper = "1";
  } else {
    el.style.removeProperty("--wallpaper");
    delete el.dataset.wallpaper;
  }
}

export function saveWallpaper(v: string | null) {
  try {
    if (v) {
      localStorage.setItem(KEY, v);
      localStorage.removeItem(SYNCED_KEY);
      localStorage.removeItem(OFF_KEY);
    } else {
      localStorage.removeItem(KEY);
      localStorage.removeItem(SYNCED_KEY);
      // 仓库还有壁纸时，记住"本设备关闭"，否则下次刷新又被仓库版盖回来
      if (getRepoWallpaper()) localStorage.setItem(OFF_KEY, "1");
      else localStorage.removeItem(OFF_KEY);
    }
  } catch {
    throw new Error("保存失败：压缩后仍超出浏览器本地存储配额，换张小一点的图");
  }
  applyWallpaper(v);
}

/** 图片文件 → 压缩 JPEG dataURL（限最长边，控制 localStorage 体积与仓库文件大小） */
export async function fileToDataURL(
  file: File,
  maxDim = 2400,
  quality = 0.82
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}
