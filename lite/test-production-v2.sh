#!/bin/bash
set -e

export PATH="$HOME/.bun/bin:$PATH"

cd /home/drak/Documents/project/OpenTerminal/.claude/worktrees/linear-growing-wilkes/lite

echo "[test] Rebuilding frontend..."
cd web && bun run build && cd ..

echo "[test] Rebuilding Bun binary..."
cd server
mkdir -p dist
bun run build
cd ..

echo "[test] Binary created:"
ls -lh server/dist/terminal

BINARY_SIZE=$(du -h server/dist/terminal | cut -f1)
echo "[test] Binary size: $BINARY_SIZE"

echo "[test] Starting server in production mode from lite/ directory..."
cd /home/drak/Documents/project/OpenTerminal/.claude/worktrees/linear-growing-wilkes/lite
PORT=4100 ./server/dist/terminal > /tmp/prod-server.log 2>&1 &
SERVER_PID=$!
sleep 2

echo "[test] Server output:"
head -20 /tmp/prod-server.log

echo "[test] Testing /api/status endpoint..."
RESPONSE=$(curl -s http://localhost:4100/api/status)
echo "API Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo "[test] ✓ /api/status endpoint works"
else
  echo "[test] ✗ /api/status endpoint failed"
  cat /tmp/prod-server.log
  kill $SERVER_PID || true
  exit 1
fi

echo "[test] Testing static frontend serving at GET /"
HTML=$(curl -s http://localhost:4100/)
if echo "$HTML" | grep -q "OpenTerminal Lite"; then
  echo "[test] ✓ Frontend HTML served correctly"
else
  echo "[test] ✗ Frontend HTML not found"
  echo "Got: $HTML" | head -20
  kill $SERVER_PID || true
  exit 1
fi

kill $SERVER_PID
wait $SERVER_PID 2>/dev/null || true

echo ""
echo "[test] ✓ Production mode test passed"
echo "[test] Binary size: $BINARY_SIZE"
