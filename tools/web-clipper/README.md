# OfferOS Web Clipper（Chrome / Edge 扩展）

把**任意网页**的面经 / JD / 签证信息 / 截图，一键存到你的 **OfferOS 仓库的 `inbox/`**，
供 Claude 下次对话直接读取、打标签、归档（给链接它跑不出内容，但**文件能读**）。

这是 OfferOS suite 的「输入层」：你在浏览器里自然地抓，Claude 在仓库侧批量处理。
内容转成 **Markdown** 保存（保留超链接、标题、列表、表格），可附整页截图。

> 通用收集对**任何站点**都可用（LinkedIn 职位、Glassdoor、Blind、levels.fyi、Greenhouse/Lever、论坛面经…）：
> 靠 `activeTab`，你点扩展按钮 / 右键 / 快捷键的那一下临时授权当前标签页，不需要预先授予全站权限。

## 安装（加载未打包扩展）

1. Chrome / Edge 打开 `chrome://extensions`（Edge 为 `edge://extensions`）。
2. 右上角打开 **开发者模式 / Developer mode**。
3. 点 **加载已解压的扩展程序 / Load unpacked**，选中本文件夹（`tools/web-clipper/`）。
4. 点工具栏的扩展图标 → 在弹窗里完成一次性 GitHub 配置（见下）。

> 没放自定义图标，工具栏会显示默认拼图图标，不影响功能。

## 一次性配置 GitHub token

1. GitHub → Settings → Developer settings → **Fine-grained personal access tokens** → Generate。
2. **Repository access**：只选你自己的 OfferOS 仓库（`<your-username>/<your-repo>`）。
3. **Permissions → Repository permissions → Contents: Read and write**（其它不给）。
4. 复制 token，填进扩展弹窗「GitHub 连接设置」里的 `token`，点「保存设置」→「测试连接」。
   - token 只存在本机浏览器（`chrome.storage.local`），**不会写进仓库**。
   - owner / repo / branch / path 填 `<your-username> / <your-repo> / main / inbox`，按需改。
   - 这与站点 `/settings` 用的是同一种 PAT，可共用一把。

> 捕获默认写到 **`main`** 分支；Claude 会在下个 session 扫 `inbox/`（见仓库 `inbox/README.md` 的 SOP）。

## 收集方式

- **⚡ 正文 + 整页 一键收集**（弹窗按钮）：同时抓正文 + 截整页并保存（最省事）。在后台运行——
  点完即可关弹窗/继续干别的，结果看扩展图标角标。唯一要求：**滚动截图那几秒别切走标签页**
  （切走会安全中断报 `!`，不会截错页面，重截即可）。
- **⌨️ 快捷键 `Alt+Shift+S`**：不开弹窗，直接整页截图 + 正文存到 inbox（默认按「面经」；
  改键见 `chrome://extensions/shortcuts`）。
- **🖱️ 右键收集**：选中文字 → 右键「收集选中文字 → OfferOS inbox」→ 选类型（面经 / JD / 签证 / 其他），直接存。
- **📥 打开 inbox**：弹窗顶部直达 GitHub inbox 文件夹的链接，随手核对入库没有。
- **粘贴**：往文本框粘文字；粘图片则作为截图一起存。

**正文抽取**：优先用你选中的内容；否则按一小串**已知站点选择器**（1p3a 帖子 `td.t_f`、
LinkedIn 职位描述、Greenhouse/Lever 等）抓正文；都不命中则回退抓 `<article>/<main>/<body>`——
所以**陌生站点也能抓**。要加站点支持：在 `gh.js` 的 `KNOWN` 数组里加一个选择器即可。

**图标角标语义**：`…` 进行中 → `✓` 已保存 / `!` 失败（常见：截图中切走标签页、token 失效、网络）。
每次保存在 `inbox/` 生成 `YYYY-MM-DD_HHMMSS_{type}_{slug}.md`（带 `source_url/source_title/type/status` frontmatter），
有图再附同名 `.png` 并在 md 里引用。

## 文件结构

| 文件 | 作用 |
|---|---|
| `gh.js` | 弹窗与后台共享的 GitHub 提交逻辑 + DOM→Markdown 抽取（与环境无关的纯函数） |
| `background.js` | service worker：右键菜单、快捷键、后台整页截图拼接 |
| `popup.html` / `popup.js` | 弹窗 UI：配置、收集按钮、手动截图 |
| `content.js` / `styles.css` | **可选模块**：1point3acres 论坛高亮（见下），通用收集不依赖它 |

## 可选模块：1point3acres 论坛「最近帖」高亮

如果你在 [1point3acres](https://www.1point3acres.com/) 刷面经/offer 版，这个模块会在**版块列表页**
按帖子的发帖 / 最后回复时间高亮最近的帖子：

- 🟢 **强高亮**：age ≤ `recentDays`（默认 3 天）；🟡 **弱高亮**：age ≤ `weekDays`（默认 7 天）
- 标题旁可显示 `N天前` 徽章；可选把旧帖**变灰**。阈值/开关在弹窗里调，改动即时生效。
- 点「下一页/页码」（论坛 AJAX 换列表不刷新）也会自动重扫（MutationObserver）。

**不需要就整段删掉 `manifest.json` 的 `content_scripts`**（连同 `content.js`/`styles.css`），
通用收集功能完全不受影响。改版导致高亮失效时，对照页面 DOM 调 `content.js` 的
`getThreadRows()` / `pickByCell()` / `dateFromByCell()` 三处即可。

## 版本

- **v0.7.0**：更名为 OfferOS Web Clipper，通用化为「任意站点收集」；1p3a 高亮降为可选模块；正文抽取加已知站点选择器。
- v0.6.x：抓正文改存 Markdown（保留链接/表格）；整页截图支持内滚容器；提交前查 sha 修 422；文件名时间戳到秒。
