#!/usr/bin/env bash
# `npm run dev` 入口；按 MIAODA_DEP_CACHE_DIR 是否非空判断运行环境
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

for arg in "$@"; do
  if [ "$arg" = "--strictPort" ]; then
    exec npm run dev:client -- "$@"
  fi
done

if [ -n "${MIAODA_DEP_CACHE_DIR:-}" ] || [ -n "${SANDBOX_ID:-}" ]; then
  exec node "$SCRIPT_DIR/dev.js" "$@"
fi

if [ ! -f "$SCRIPT_DIR/dev-local.js" ]; then
  echo "[dev] scripts/dev-local.js 缺失；先跑 \`npx -y @lark-apaas/miaoda-cli@latest app sync\` 同步平台脚本" >&2
  exit 1
fi

npx -y @lark-apaas/miaoda-cli@latest app sync || echo "[dev] miaoda app sync 失败，按现状继续" >&2

exec node "$SCRIPT_DIR/dev-local.js" "$@"
