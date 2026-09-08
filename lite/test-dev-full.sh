#!/bin/bash
set -e

export PATH="$HOME/.bun/bin:$PATH"

echo "=========================================="
echo "Development Mode - Full Stack Test"
echo "=========================================="
echo ""

cd /home/drak/Documents/project/OpenTerminal/.claude/worktrees/linear-growing-wilkes/lite

# Clean up any existing processes
pkill -f "bun.*index.ts" || true
pkill -f "vite" || true
sleep 1

echo "[dev] Starting backend server..."
cd server
bun run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 1

echo "[dev] Backend started (PID: $BACKEND_PID)"
echo "[dev] Testing backend API..."

RESPONSE=$(curl -s http://localhost:4100/api/status 2>/dev/null || echo "FAILED")
if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo "✓ Backend /api/status responds"
else
  echo "✗ Backend not responding"
  kill $BACKEND_PID || true
  exit 1
fi

echo "[dev] Starting frontend dev server..."
cd web
bun run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 3

echo "[dev] Frontend started (PID: $FRONTEND_PID)"
echo "[dev] Testing frontend server..."

# Test if Vite is running
VITE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/index.html 2>/dev/null || echo "000")
if [ "$VITE_RESPONSE" = "200" ]; then
  echo "✓ Frontend Vite server running on :5173"
else
  echo "✗ Frontend not responding ($VITE_RESPONSE)"
  kill $BACKEND_PID $FRONTEND_PID || true
  exit 1
fi

echo "[dev] Testing API proxy through Vite..."
# The proxy should forward to the backend
PROXY_RESPONSE=$(curl -s http://localhost:5173/api/status 2>/dev/null || echo "FAILED")
if echo "$PROXY_RESPONSE" | grep -q '"ok":true'; then
  echo "✓ Vite proxy /api/status → backend works"
else
  echo "✗ Proxy failed"
  echo "Response: $PROXY_RESPONSE"
  kill $BACKEND_PID $FRONTEND_PID || true
  exit 1
fi

echo ""
echo "=========================================="
echo "Dev Mode: All Tests Passed!"
echo "=========================================="
echo ""
echo "Development servers running:"
echo "  Frontend: http://localhost:5173 (Vite dev server)"
echo "  Backend:  http://localhost:4100 (Bun API server)"
echo "  API:      http://localhost:5173/api/* (proxied)"
echo ""

# Clean up
echo "[dev] Cleaning up..."
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
wait $BACKEND_PID 2>/dev/null || true
wait $FRONTEND_PID 2>/dev/null || true

echo "✓ Both servers shut down cleanly"
