#!/bin/sh
# entrypoint.sh — Docker entrypoint for OVH FinOps
#
# Starts the cron import in background and the server in foreground.

set -e

# Start periodic import in background
/app/scripts/cron-import.sh &

# Start the server (foreground — keeps container alive)
exec node /app/server/index.js
