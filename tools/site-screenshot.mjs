// 站点视觉验收脚本：对两套主题（暖光·浅 / 暖光·夜）截图。
// 用法：npx next start -p 3200 &  然后
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tools/site-screenshot.mjs [outDir]
import { chromium } from "playwright";
const out = process.argv[2] ?? "/tmp/shots";
const base = process.env.SITE_URL ?? "http://localhost:3200";
const pages = [
  ["/", "home"],
  ["/pipeline", "pipeline"],
  ["/jobs", "jobs"],
  ["/prep", "prep"],
  ["/practice", "practice"],
  ["/agenda", "agenda"],
  ["/referrals", "referrals"],
  ["/offers", "offers"],
  ["/timeline", "timeline"],
  ["/intel", "intel"],
  ["/journal", "journal"],
  ["/docs", "docs"],
  ["/settings", "settings"],
  ["/companies/tiktok", "company"],
];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1320, height: 980 }, deviceScaleFactor: 1.5 });
const page = await ctx.newPage();
for (const theme of ["light", "dark"]) {
  await page.addInitScript((t) => localStorage.setItem("jh_theme", t), theme);
  for (const [path, name] of pages) {
    try {
      await page.goto(base + path, { waitUntil: "load" });
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${out}/${theme}-${name}.png`, fullPage: name === "home" });
    } catch (e) {
      console.log("skip", theme, name, String(e).slice(0, 80));
    }
  }
}
await browser.close();
console.log("screenshots →", out);
