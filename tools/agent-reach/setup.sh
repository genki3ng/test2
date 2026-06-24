#!/usr/bin/env bash
# 一键安装 vendored Agent-Reach（云端 session 用）。见 VENDOR.md。
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
VENV="${AGENT_REACH_VENV:-/tmp/ar-venv}"

echo "→ 装 agent-reach 到 venv: $VENV"
python3 -m venv "$VENV" 2>/dev/null || true
"$VENV/bin/pip" install -q "$DIR"

if ! command -v mcporter >/dev/null 2>&1; then
  echo "→ 装 mcporter（Exa 搜索用）"
  npm install -g mcporter >/dev/null 2>&1 || echo "⚠️ mcporter 安装失败：Exa 搜索不可用，其余渠道不受影响"
fi

echo "→ 版本：$("$VENV/bin/agent-reach" --version)"
"$VENV/bin/agent-reach" doctor || true
cat <<EOF

✅ 完成。常用：
  $VENV/bin/agent-reach doctor                 # 渠道体检
  $VENV/bin/yt-dlp --dump-json <视频URL>        # YouTube/B站字幕元数据
  curl https://r.jina.ai/<URL>                  # 读任意网页（无需安装）
  mcporter call 'exa.web_search_exa(query: "...", numResults: 5)'   # 在仓库根目录跑
EOF
