#!/bin/bash
# Kill 3000 and 3001, then restart backend + frontend.
cd "$(dirname "$0")/.."
echo "Killing processes on 3000 and 3001..."
lsof -ti:3000 -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 2
echo "Starting backend (3001)..."
(cd client && bun run dev:server) &
sleep 1
echo "Starting frontend (3000)..."
cd client && bun run dev
