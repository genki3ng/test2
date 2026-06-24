#!/usr/bin/env node
// 构建期简历导出件生成器（npm run build 第一步自动跑；本地手动：node tools/build-resume-exports.mjs）
// 约定（入 STYLEGUIDE「数据格式契约」）：
//   - profile/resume/*.md 中含 `## Professional Experience` 行 = 简历文档 → 自动导出
//   - 输出 public/exports/<姓名>_Resume--<basename>.{docx,html} + manifest.json（姓名取自简历首行 `# 标题`）
//     （public/exports/ 在 .gitignore，构建期现做；站点密码门 middleware 盖住该路径）
//   - 遇 `## 〔` 开头的节（工作区注记）即停止——注记永不导出
//   - 结构：# 姓名 → 下一非空行 = headline → 再下一行 = 联系方式；## 大节；### 公司行；
//     整行 **…** = 子小节标题；- bullet；行内 **加粗** / *斜体*；--- 与 > 引用行跳过
// 改排版：HTML 模板与 docx 渲染都在本文件，两边同改。

import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { Document, Packer, Paragraph, TextRun, BorderStyle } from "docx";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "profile", "resume");
const OUT_DIR = path.join(ROOT, "public", "exports");
const MARKER = "## Professional Experience";

/** 简历首行 `# 姓名` → 文件名前缀（如 "Alex Rivera" → "Alex_Rivera_Resume--"）；取不到则用 "Resume--"。 */
function filePrefix(nodes) {
  const name = nodes.find((n) => n.type === "name")?.text || "";
  const clean = name.replace(/[^A-Za-z0-9一-龥]+/g, "_").replace(/^_+|_+$/g, "");
  return clean ? `${clean}_Resume--` : "Resume--";
}

/* ---------- 解析：md → 节点流 ---------- */

function parseResume(src) {
  const nodes = [];
  let expect = null; // "headline" → "contact" → null
  for (const raw of src.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("## 〔")) break; // 工作区注记：不导出
    if (!line || line === "---" || line.startsWith(">")) continue;
    if (line.startsWith("# ")) {
      nodes.push({ type: "name", text: line.slice(2) });
      expect = "headline";
      continue;
    }
    if (expect === "headline") {
      nodes.push({ type: "headline", text: line });
      expect = "contact";
      continue;
    }
    if (expect === "contact") {
      nodes.push({ type: "contact", text: line });
      expect = null;
      continue;
    }
    if (line.startsWith("## ")) {
      nodes.push({ type: "h2", text: line.slice(3) });
      continue;
    }
    if (line.startsWith("### ")) {
      nodes.push({ type: "h3", text: line.slice(4) });
      continue;
    }
    if (/^\*\*[^*]+\*\*$/.test(line)) {
      nodes.push({ type: "subhead", text: line });
      continue;
    }
    if (line.startsWith("- ")) {
      nodes.push({ type: "bullet", text: line.slice(2) });
      continue;
    }
    nodes.push({ type: "para", text: line });
  }
  return nodes;
}

/* ---------- 渲染①：docx ---------- */

// 行内 markdown（**bold**、*italic*）→ TextRun[]
function runs(text, extra = {}) {
  const out = [];
  text.split("**").forEach((part, i) => {
    const bold = i % 2 === 1;
    part.split(/\*([^*]+)\*/).forEach((seg, j) => {
      if (!seg) return;
      out.push(new TextRun({ text: seg, bold: bold || extra.bold, italics: j % 2 === 1, ...extra.run }));
    });
  });
  return out;
}

function toDocx(nodes) {
  const children = nodes.map((n) => {
    switch (n.type) {
      case "name":
        return new Paragraph({
          children: [new TextRun({ text: n.text, bold: true, size: 34 })],
          spacing: { after: 30 },
        });
      case "headline":
        return new Paragraph({ children: runs(n.text, { run: { size: 20 } }), spacing: { after: 30 } });
      case "contact":
        return new Paragraph({
          children: runs(n.text, { run: { size: 18, color: "333333" } }),
          spacing: { after: 80 },
        });
      case "h2":
        return new Paragraph({
          children: [new TextRun({ text: n.text.toUpperCase(), bold: true, size: 19 })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "444444", space: 2 } },
          spacing: { before: 160, after: 60 },
        });
      case "h3":
        return new Paragraph({
          children: [new TextRun({ text: n.text, bold: true, size: 20 })],
          spacing: { before: 110, after: 20 },
        });
      case "subhead":
        return new Paragraph({ children: runs(n.text), spacing: { before: 80, after: 20 } });
      case "bullet":
        return new Paragraph({
          children: runs(n.text),
          bullet: { level: 0 },
          indent: { left: 280, hanging: 160 },
          spacing: { after: 25 },
        });
      default:
        return new Paragraph({ children: runs(n.text), spacing: { after: 40 } });
    }
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 19 }, // 9.5pt
          paragraph: { spacing: { line: 276 } }, // ~1.15 行距
        },
      },
    },
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, // 0.5in
      children,
    }],
  });
  return Packer.toBuffer(doc);
}

/* ---------- 渲染②：打印版 HTML（letter / 0.5in，浏览器 Ctrl+P 可直出 PDF） ---------- */

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inlineHtml = (text) =>
  esc(text)
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/\*([^*]+)\*/g, "<i>$1</i>");

const HTML_CSS = `
  @page { size: letter; margin: 0.5in; }
  html, body { margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 1.28;
         color: #1a1a1a; max-width: 7.5in; margin: 0 auto; padding: 24px 12px; }
  @media print { body { padding: 0; max-width: none; } }
  h1 { font-size: 17pt; margin: 0 0 2pt 0; letter-spacing: 0.5px; }
  .headline { font-size: 10pt; font-weight: bold; margin: 0 0 2pt 0; }
  .contact { font-size: 9pt; color: #333; margin: 0 0 6pt 0; }
  h2 { font-size: 9.5pt; text-transform: uppercase; letter-spacing: 1.2px;
       border-bottom: 1px solid #444; padding-bottom: 1pt; margin: 9pt 0 4pt 0; }
  h3 { font-size: 10pt; margin: 6pt 0 0 0; }
  p { margin: 2pt 0; }
  ul { margin: 2pt 0 4pt 0; padding-left: 16px; }
  li { margin: 0 0 1.5pt 0; }
  .subhead { font-weight: bold; margin: 4pt 0 1pt 0; }
`;

function toHtml(nodes) {
  const out = [];
  let inList = false;
  const closeList = () => { if (inList) { out.push("</ul>"); inList = false; } };
  for (const n of nodes) {
    if (n.type === "bullet") {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`  <li>${inlineHtml(n.text)}</li>`);
      continue;
    }
    closeList();
    switch (n.type) {
      case "name": out.push(`<h1>${inlineHtml(n.text)}</h1>`); break;
      case "headline": out.push(`<p class="headline">${inlineHtml(n.text)}</p>`); break;
      case "contact": out.push(`<p class="contact">${inlineHtml(n.text)}</p>`); break;
      case "h2": out.push(`<h2>${inlineHtml(n.text)}</h2>`); break;
      case "h3": out.push(`<h3>${inlineHtml(n.text)}</h3>`); break;
      case "subhead": out.push(`<p class="subhead">${inlineHtml(n.text)}</p>`); break;
      default: out.push(`<p>${inlineHtml(n.text)}</p>`);
    }
  }
  closeList();
  const name = nodes.find((n) => n.type === "name")?.text ?? "Resume";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(name)} — Resume</title>
<style>${HTML_CSS}</style>
</head>
<body>

${out.join("\n")}

</body>
</html>
`;
}

/* ---------- 主流程 ---------- */

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const files = readdirSync(SRC_DIR).filter((f) => f.endsWith(".md"));
const manifest = { generatedAt: new Date().toISOString(), files: [] };

for (const file of files) {
  const src = readFileSync(path.join(SRC_DIR, file), "utf8");
  if (!src.includes(MARKER)) continue; // 非简历文档（README/review/linkedin 等）
  const base = file.replace(/\.md$/, "");
  try {
    const nodes = parseResume(src);
    const outBase = `${filePrefix(nodes)}${base}`;
    writeFileSync(path.join(OUT_DIR, `${outBase}.docx`), await toDocx(nodes));
    writeFileSync(path.join(OUT_DIR, `${outBase}.html`), toHtml(nodes));
    manifest.files.push({
      source: `profile/resume/${file}`,
      label: base,
      docx: `/exports/${outBase}.docx`,
      html: `/exports/${outBase}.html`,
    });
    console.log(`[resume-exports] ${file} → ${outBase}.{docx,html}`);
  } catch (err) {
    console.error(`[resume-exports] FAILED ${file}: ${err?.message ?? err}`); // 单文件失败不挡构建
  }
}

writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`[resume-exports] manifest: ${manifest.files.length} 份简历`);
