/**
 * ⚙️ 站点身份配置 —— 让这个求职指挥台变成「你的」。
 *
 * 改这一个文件即可完成个性化（或在 Vercel / .env 里配同名 NEXT_PUBLIC_* 环境变量覆盖，
 * 无需改代码）。这些值客户端与服务端都会用到，所以用 NEXT_PUBLIC_ 前缀的 env。
 *
 * 上手指南见根目录 GETTING-STARTED.md 或站内 /start 页。
 */
export const siteConfig = {
  /** 应用名（顶栏品牌 + 浏览器标题）。这是开源产品名 OfferOS，一般不用改。 */
  appName: process.env.NEXT_PUBLIC_APP_NAME || "OfferOS",

  /** 你的名字（首页问候语、页面文案里用） */
  ownerName: process.env.NEXT_PUBLIC_OWNER_NAME || "Alex Rivera",

  /** 右上角头像缩写（一般是姓名首字母，1–2 个字符） */
  ownerInitials: process.env.NEXT_PUBLIC_OWNER_INITIALS || "AR",

  /** 首页问候里的一句口头禅（鼓励语） */
  motto: process.env.NEXT_PUBLIC_MOTTO || "稳住节奏，",

  /** 你的「北极星」一句话（首页页脚、Offers 页用）。把它改成你真正的目标。 */
  northStar:
    process.env.NEXT_PUBLIC_NORTH_STAR ||
    "目标 Senior→Staff DS · remote 友好 · 优化总包 · 3 个月内拿 offer",

  /**
   * 你的 GitHub 仓库 = "owner/repo"。
   * 用于：① 文档页「在 GitHub 编辑」链接；② 网站写通道（浏览器直连 GitHub Contents API
   * 勾任务 / 改状态 / 派活）；③ 仓库内图片走 raw.githubusercontent。
   * ⚠️ 部署后必须改成你自己的仓库，否则站内编辑会写到错误的地方。
   */
  githubRepo: process.env.NEXT_PUBLIC_GITHUB_REPO || "your-username/your-repo",
};
