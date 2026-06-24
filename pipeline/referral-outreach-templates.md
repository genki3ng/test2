# 内推邮件 / 私信模板

> 网站「内推」页的生成器会读取下面的模板：每个 `### 邮件模板：<名>` 一个。
> 占位符 `{{company}}` / `{{jobs}}` / `{{job_ids}}` / `{{job_title}}` / `{{job_location}}` 由弹窗按你勾选的岗位自动填充。
> `<名>` 若与 [referrals.md](referrals.md) 主表第一列（公司）一致，会和该渠道关联；另有三个通用 key 供「没内推」时的冷启动 flow 用。

## C. 渠道邮件模板

### 邮件模板：熟人内推请求

- to: （内推人邮箱）
- subject: 求内推 · {{company}} {{job_title}}
- note: 给前同事/同学/弱连接，附简历 PDF。

```text
Hi {{name}}，

最近在看 {{company}} 的机会，看到这个岗位挺合适：
{{jobs}}
（req: {{job_ids}}）

如果方便的话，能帮我内推一下吗？简历附在附件。一句话背景：我是做产品向 DS 的，专长是 A/B 实验和增长/留存分析，{{company}} 这个方向很对口。

任何时候不方便都没关系，谢谢你！
Alex
```

### 邮件模板：LinkedIn 连接请求

- to: （LinkedIn 连接 note，≤300 字符）
- subject: —
- note: 给目标公司同组、想加为连接的人。

```text
Hi {{name}}，我是做产品向 DS 的（A/B 实验 + 增长分析），正在看 {{company}} 的机会，很想了解一下你们组。方便的话想加个连接、请教两句，谢谢！
```

### 邮件模板：LinkedIn 陌生人 DM

- to: （已连接后的私信）
- subject: —
- note: 连接通过后，礼貌请求内推。

```text
Hi {{name}}，谢谢通过连接！我对 {{company}} 的 {{job_title}}（{{job_location}}）很感兴趣（req: {{job_ids}}）。我有 ~6 年产品 DS 经验，A/B 实验和增长/留存是强项。不知道是否方便帮我内推、或指个方向？简历可以随时发给你。非常感谢！
```

### 邮件模板：Northwind

- to: jordan.lee@example.com
- subject: 求内推 · Northwind {{job_title}}
- note: 前同事 Jordan，已答应推。

```text
Hi Jordan，

谢谢愿意帮我推 Northwind！这是岗位：
{{jobs}}
（req: {{job_ids}}）

简历附上。需要我写一段「为什么合适」给你贴到内推表单里的话告诉我。再次感谢！
Alex
```
