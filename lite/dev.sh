#!/bin/bash
set -e

# Colors for output
YELLOW='\033[1;33m'
CYAN='\033[1;36m'
NC='\033[0m' # No Color

echo -e "${YELLOW}[lite]${NC} Installing dependencies..."
cd server && bun install && cd ..
cd web && bun install && cd ..

echo -e "${YELLOW}[lite]${NC} Starting dev servers..."
echo -e "${YELLOW}[api]${NC} Starting backend on http://localhost:4100"
echo -e "${CYAN}[web]${NC} Starting frontend on http://localhost:5173"
echo ""

# Start both servers in the background
cd server && bun run dev &
SERVER_PID=$!

cd ../web && bun run dev &
WEB_PID=$!

# Trap to kill both on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}[lite]${NC} Shutting down..."
  kill $SERVER_PID $WEB_PID 2>/dev/null || true
}
trap cleanup EXIT

# Wait for both
wait
