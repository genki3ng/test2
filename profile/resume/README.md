# 简历 Resume

> 你的简历都放这里。**master.md = 主简历**；按公司 tailor 时复制成 `<company>-<role>.md`（如 `northwind-staff-growth.md`）。

## 自动导出（无需手动转格式）

任何包含 `## Professional Experience` 行的 `.md`，构建时都会被 `tools/build-resume-exports.mjs` 导出成：

- **docx**（传 Google Drive 双击即转 Google Doc）
- **打印版 HTML**（贴进 gdoc 保格式 / 浏览器 Ctrl+P 直接存 PDF）

下载链接出现在站内 `/docs` 的「定位 · 简历」组与该简历的文档详情页。导出件落在 `public/exports/`（已 gitignore、被密码门盖住）。

## 格式约定（解析器靠它）

```
# 你的名字
一句话 headline（职位 · 方向）
联系方式（邮箱 · 电话 · 城市 · LinkedIn）

## 大节标题（如 Summary / Skills / Professional Experience / Education）
### 公司 — 职位（年份）
- bullet，行内可用 **加粗** / *斜体*
```

- `## 〔` 开头的〔工作区注记〕节**永不导出**（用来放给自己/Claude 的备注）。
- 最终发出去的 PDF 建议重命名为 `你的名字_Resume.pdf`（别带目标公司名）。

> 让 Claude 帮你：「按候选人背景把 master 简历写出来」「针对 Northwind 这个 JD tailor 一版」。
