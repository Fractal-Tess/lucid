#!/usr/bin/env bash
# Connect to Chrome browser running in Docker container via CDP
# Start the container with:
#   docker run -d --name playwright-server -p 9223:9222 --init --ipc=host \
#     zenika/alpine-chrome:with-node \
#     chromium-browser --no-sandbox --headless --remote-debugging-address=0.0.0.0 --remote-debugging-port=9222 --disable-gpu
exec npx @playwright/mcp@latest \
  --cdp-endpoint http://127.0.0.1:9223
