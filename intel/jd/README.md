# intel/jd/ —— JD 归档

抓到的目标岗位 JD 全文存这里，一岗一文件，命名 `<company-slug>-<role-slug>.md`。

## 格式约定（站点解析依赖）

- 标题行：`# JD：<公司> — <岗位>`
- 顶部元数据用 bullet，键名保留（站点会解析显示）：
  - `- **级别**：…`
  - `- **地点**：…`
  - `- **薪酬**：…`
  - （可选）`- **团队**：…` / `- **JD 链接**：…` / `- **抓取日期**：…`
- 正文随意：职责 / 要求 / 契合度分析等。

## 怎么用

- 公司文件 [pipeline/companies/<slug>.md](../../pipeline/companies/) 的「当前 opening」行用 `→ [JD 档案](../../intel/jd/<file>.md)` 链过来。
- 示例文件：[northwind-staff-ds-growth.md](northwind-staff-ds-growth.md)（虚构）。
