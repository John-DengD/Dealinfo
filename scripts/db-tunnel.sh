#!/usr/bin/env bash
# 建立到远程开发数据库的 SSH 隧道:localhost:$DB_TUNNEL_LOCAL_PORT -> 服务器 localhost:5432
# 凭据从项目根目录 .env 读取(不硬编码、不进 git)。
# 用法:bash scripts/db-tunnel.sh   (开发/迁移/测试前先跑一次,保持终端开着或后台运行)
set -euo pipefail
cd "$(dirname "$0")/.."

# 读取 .env
set -a
# shellcheck disable=SC1091
source .env
set +a

PORT="${DB_TUNNEL_LOCAL_PORT:-5433}"

if ! command -v sshpass >/dev/null 2>&1; then
  echo "需要 sshpass:brew install hudochenkov/sshpass/sshpass" >&2
  exit 1
fi

# 关掉旧隧道
pkill -f "${PORT}:localhost:5432" 2>/dev/null || true
sleep 1

echo "建立隧道 localhost:${PORT} -> ${SERVER_SSH_USER}@${SERVER_SSH_HOST}:5432 ..."
sshpass -p "${SERVER_SSH_PASSWORD}" ssh -f -N \
  -o StrictHostKeyChecking=no \
  -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
  -o ExitOnForwardFailure=yes \
  -L "${PORT}:localhost:5432" "${SERVER_SSH_USER}@${SERVER_SSH_HOST}"

sleep 2
if nc -z -w 5 localhost "${PORT}"; then
  echo "✓ 隧道就绪:localhost:${PORT}"
else
  echo "✗ 隧道端口未就绪" >&2
  exit 1
fi
