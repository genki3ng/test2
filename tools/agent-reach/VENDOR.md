# Agent-Reach 源码快照（vendored）

- **上游**：https://github.com/Panniantong/Agent-Reach
- **版本**：v1.4.0，commit `17624268a059ccfb23eba8a2ba50f9f92c8dc0ca`（快照日 2026-06-10）
- **License**：MIT（见 [LICENSE](LICENSE)）

## 为什么入库

云端 session 容器是一次性的，装好的软件不会保留；仓库是唯一持久层。存快照后任何
session 跑一条命令即可用，且不依赖上游仓库可用性（上游官方安装当前是坏的，见下）。

## 本地修改（与上游 diff）

1. **pyproject.toml**：删掉 `[tool.hatch.build.targets.wheel.force-include]` 块——
   guides/skill/scripts 本就在包内会被自动收录，重复打包导致新版 hatchling 构建报错
   `A second file is being added at the same path`。上游 `pip install agent-reach`
   还有一个坑：**PyPI 根本没发包**，只能装源码——也会撞同一个 bug。
2. 删除上游的 docs/（多语言 README+图片）、tests/、uv.lock——运行不需要。

## 用法

```bash
bash tools/agent-reach/setup.sh     # 在仓库根目录跑，一条命令装好
```

装完后：

- `/tmp/ar-venv/bin/agent-reach doctor` —— 各渠道体检
- `/tmp/ar-venv/bin/yt-dlp` —— YouTube/B站 字幕提取（随依赖装上）
- Exa 搜索：`mcporter call 'exa.web_search_exa(query: "...", numResults: 5)'`
  （配置在仓库 `config/mcporter.json`，需在仓库根目录运行）
- 它会把 SKILL.md 注册到 `~/.claude/skills/agent-reach`（session 内自动可见）

> 找工作高频通路（LinkedIn 职位页/Workday/Uber/Greenhouse/Ashby…）**不需要装这个**，
> 直接用 [tools/web-reach.md](../web-reach.md) 的配方。装它是为了长尾渠道
> （Twitter/Reddit 舆情、YouTube 字幕等，公司风评/裁员消息调研用）。

## 升级快照

```bash
git clone --depth 1 https://github.com/Panniantong/Agent-Reach /tmp/ar-new
# 重新应用上面的 pyproject 修改，再拷贝 agent_reach/ pyproject.toml LICENSE 覆盖本目录
```
