#!/bin/bash
set -e

export PATH="$HOME/.bun/bin:$PATH"

echo "[test] Starting backend server..."
cd /home/drak/Documents/project/OpenTerminal/.claude/worktrees/linear-growing-wilkes/lite/server
bun run dev > /tmp/server.log 2>&1 &
SERVER_PID=$!
sleep 2

echo "[test] Testing /api/status endpoint..."
RESPONSE=$(curl -s http://localhost:4100/api/status)
echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo "[test] ✓ /api/status endpoint works"
else
  echo "[test] ✗ /api/status endpoint failed"
  kill $SERVER_PID || true
  exit 1
fi

echo "[test] Testing /api/health endpoint..."
HEALTH=$(curl -s http://localhost:4100/api/health)
echo "Health: $HEALTH"

if echo "$HEALTH" | grep -q '"ok":true'; then
  echo "[test] ✓ /api/health endpoint works (DB connected)"
else
  echo "[test] ✗ /api/health endpoint failed"
  kill $SERVER_PID || true
  exit 1
fi

kill $SERVER_PID
wait $SERVER_PID 2>/dev/null || true

echo "[test] ✓ Backend dev mode test passed"
