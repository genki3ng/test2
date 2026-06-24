#!/bin/bash
# OfferOS SessionStart 钩子：
#   1) 装依赖（Claude Code on the web 容器一次性，装好才能 build/校验；首次后容器缓存，很快）。
#   2) 若仓库仍是「未配置」模板态 → 给本次 session 注入「先跑 onboarding」指引（指向 SETUP.md）。
# 幂等、非交互、已配置即 no-op。
set -uo pipefail

DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# 1) 依赖（缺了才装；输出走 stderr，不污染注入 session 的 stdout）
if [ ! -d "$DIR/node_modules" ] && [ -f "$DIR/package.json" ]; then
  (cd "$DIR" && npm install --no-audit --no-fund) 1>&2 || true
fi

# 2) 未配置检测：data/profile.json 的 configured 不为 true 即模板态
prof="$DIR/data/profile.json"
if [ -f "$prof" ] && grep -q '"configured"[[:space:]]*:[[:space:]]*true' "$prof"; then
  exit 0   # 已配置 → 不注入任何上下文（严格 no-op）
fi

cat <<'CTX'
[OfferOS 未配置] 这个仓库还是模板态（data/profile.json 的 configured 不为 true）。
请先读仓库根的 SETUP.md，据此引导用户完成 onboarding：
  - 采访：名字、目标角色（DS/DE/SWE/PM/ML，见 src/config/roles.ts）、当前/目标级别、地区、是否需要签证 sponsorship、目标公司、北极星/口头禅。
  - 写 data/profile.json（configured: true）、重置 data/tracker.json、重写 profile/target.md。
  - 按所选角色充实 prep/<role>/ 题库与板块（守 STYLEGUIDE 的 question-bank 格式契约）。
  - 设置 NEXT_PUBLIC_GITHUB_REPO 与 SITE_PASSWORD，引导部署到 Vercel。
  - 去标识化铁律：仓库不得含他人个人信息，提交前 `npm run check` 必须通过。
用户也可直接在站点 /onboard 用向导完成（无 PAT 时会给出可粘贴给 Claude/Codex 的指令）。
CTX
exit 0
