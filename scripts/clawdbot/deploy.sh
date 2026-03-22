#!/usr/bin/env bash
# Deploy Anton workspace, scripts, and skills to a target host.
# Usage: ./deploy.sh <target>
#   target: pi  → gr0x@10.2.0.40 (Raspberry Pi 5)
#           pve → anton@10.2.20.221 (Proxmox LXC)
#
# Switchover:
#   1. Stop on current host:  ssh <host> "sudo systemctl stop anton.service"
#   2. Deploy to new host:    ./deploy.sh <target>
#   3. Start on new host:     ssh <host> "sudo systemctl start anton.service"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

case "${1:-}" in
  pi)
    HOST="gr0x@10.2.0.40"
    WORKSPACE="/home/gr0x/.openclaw/workspace"
    ;;
  pve)
    HOST="anton@10.2.20.221"
    WORKSPACE="/home/anton/.openclaw/workspace"
    ;;
  *)
    echo "Usage: $0 <pi|pve>"
    echo ""
    echo "Targets:"
    echo "  pi   → gr0x@10.2.0.40 (Raspberry Pi 5)"
    echo "  pve  → anton@10.2.20.221 (Proxmox LXC)"
    echo ""
    echo "Switchover:"
    echo "  1. Stop current:  ssh <old-host> 'sudo systemctl stop anton.service'"
    echo "  2. Deploy:        $0 <target>"
    echo "  3. Start new:     ssh <new-host> 'sudo systemctl start anton.service'"
    exit 1
    ;;
esac

echo "Deploying to ${1} (${HOST})..."

# Scripts
echo "  → scripts..."
scp -q "${SCRIPT_DIR}"/*.mjs "${HOST}:${WORKSPACE}/scripts/"

# Skills
echo "  → skills..."
scp -rq "${SCRIPT_DIR}"/skills/* "${HOST}:${WORKSPACE}/skills/"

# Workspace markdown files
echo "  → workspace files..."
scp -q "${SCRIPT_DIR}"/workspace/*.md "${HOST}:${WORKSPACE}/"
scp -q "${SCRIPT_DIR}"/workspace/memory/working-buffer.md "${HOST}:${WORKSPACE}/memory/"

echo "Done. Anton workspace on ${1} is up to date."
echo ""
echo "Restart if running: ssh ${HOST} 'sudo systemctl restart anton.service'"
