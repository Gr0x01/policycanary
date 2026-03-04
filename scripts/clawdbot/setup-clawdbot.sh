#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# setup-clawdbot.sh — Provision & configure Clawdbot (OpenClaw) on Vultr
#
# Prerequisites:
#   - VULTR_PAT in ../.env.local (or exported)
#   - Discord bot created + token in ../.env.local
#   - SSH key added to Vultr account
#   - jq installed locally
#
# Usage:
#   ./scripts/clawdbot/setup-clawdbot.sh provision   # Create VPS
#   ./scripts/clawdbot/setup-clawdbot.sh status       # Check VPS status
#   ./scripts/clawdbot/setup-clawdbot.sh deploy        # Deploy scripts to VPS
#   ./scripts/clawdbot/setup-clawdbot.sh configure     # Configure OpenClaw on VPS
#   ./scripts/clawdbot/setup-clawdbot.sh cron          # Set up cron job
#   ./scripts/clawdbot/setup-clawdbot.sh all            # Full setup (provision → wait → deploy → configure → cron)
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env.local"

# Load env vars from .env.local
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source <(grep -v '^#' "$ENV_FILE" | grep -v '^\s*$')
  set +a
fi

# Vultr API
VULTR_API="https://api.vultr.com/v2"
INSTANCE_FILE="$SCRIPT_DIR/.vultr-instance-id"

# VPS specs
PLAN="vc2-1c-2gb"
REGION="ewr"
OS_ID=2284  # Ubuntu 24.04
LABEL="clawdbot"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[clawdbot]${NC} $*"; }
warn() { echo -e "${YELLOW}[clawdbot]${NC} $*"; }
err()  { echo -e "${RED}[clawdbot]${NC} $*" >&2; }

require_var() {
  local var_name="$1"
  if [[ -z "${!var_name:-}" ]]; then
    err "Missing required env var: $var_name"
    exit 1
  fi
}

vultr_api() {
  local method="$1" path="$2"
  shift 2
  curl -s -X "$method" "$VULTR_API$path" \
    -H "Authorization: Bearer $VULTR_PAT" \
    -H "Content-Type: application/json" \
    "$@"
}

get_instance_id() {
  if [[ -f "$INSTANCE_FILE" ]]; then
    cat "$INSTANCE_FILE"
  else
    err "No instance ID found. Run 'provision' first."
    exit 1
  fi
}

get_instance_ip() {
  local id
  id=$(get_instance_id)
  vultr_api GET "/instances/$id" | jq -r '.instance.main_ip'
}

# ============================================================================
# Commands
# ============================================================================

cmd_provision() {
  require_var VULTR_PAT

  log "Looking up SSH keys on Vultr account..."
  local ssh_keys
  ssh_keys=$(vultr_api GET "/ssh-keys" | jq -r '.ssh_keys[].id')
  if [[ -z "$ssh_keys" ]]; then
    err "No SSH keys found on your Vultr account. Add one first."
    exit 1
  fi
  local ssh_key_ids
  ssh_key_ids=$(echo "$ssh_keys" | jq -Rs 'split("\n") | map(select(length > 0))')

  log "Encoding cloud-init script..."
  local user_data
  user_data=$(base64 < "$SCRIPT_DIR/cloud-init.yaml")

  log "Provisioning Vultr VPS: $PLAN in $REGION..."
  local response
  response=$(vultr_api POST "/instances" -d "{
    \"region\": \"$REGION\",
    \"plan\": \"$PLAN\",
    \"os_id\": $OS_ID,
    \"label\": \"$LABEL\",
    \"hostname\": \"$LABEL\",
    \"sshkey_id\": $ssh_key_ids,
    \"user_data\": \"$user_data\",
    \"backups\": \"disabled\",
    \"activation_email\": false
  }")

  local instance_id
  instance_id=$(echo "$response" | jq -r '.instance.id // empty')
  if [[ -z "$instance_id" ]]; then
    err "Failed to create instance:"
    echo "$response" | jq .
    exit 1
  fi

  echo "$instance_id" > "$INSTANCE_FILE"
  log "Instance created: $instance_id"
  log "Instance ID saved to $INSTANCE_FILE"

  local ip
  ip=$(echo "$response" | jq -r '.instance.main_ip')
  log "IP: $ip (may change until instance is active)"
  log "Run '$0 status' to check when it's ready."
}

cmd_status() {
  require_var VULTR_PAT
  local id
  id=$(get_instance_id)
  local response
  response=$(vultr_api GET "/instances/$id")

  local status ip power_status
  status=$(echo "$response" | jq -r '.instance.status')
  ip=$(echo "$response" | jq -r '.instance.main_ip')
  power_status=$(echo "$response" | jq -r '.instance.power_status')

  log "Instance: $id"
  log "Status: $status"
  log "Power: $power_status"
  log "IP: $ip"

  if [[ "$status" == "active" && "$power_status" == "running" ]]; then
    log "VPS is ready! SSH: ssh root@$ip"
  else
    warn "VPS is not ready yet. Status: $status / $power_status"
  fi
}

cmd_wait() {
  require_var VULTR_PAT
  local id
  id=$(get_instance_id)
  log "Waiting for instance $id to become active..."

  local status="pending"
  while [[ "$status" != "active" ]]; do
    sleep 15
    local response
    response=$(vultr_api GET "/instances/$id")
    status=$(echo "$response" | jq -r '.instance.status')
    local power
    power=$(echo "$response" | jq -r '.instance.power_status')
    log "  Status: $status / $power"
  done

  local ip
  ip=$(get_instance_ip)
  log "VPS is active at $ip"

  # Wait for cloud-init to finish (SSH may be up before cloud-init completes)
  log "Waiting 60s for cloud-init to complete..."
  sleep 60

  # Verify cloud-init finished
  log "Verifying cloud-init completion..."
  ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "root@$ip" \
    "cat /var/log/node-install.log 2>/dev/null || echo 'cloud-init still running...'"
}

cmd_deploy() {
  local ip
  ip=$(get_instance_ip)
  log "Deploying scripts to $ip..."

  # Copy helper scripts
  scp -o StrictHostKeyChecking=no \
    "$SCRIPT_DIR/query-supabase.mjs" \
    "$SCRIPT_DIR/publish-blog.mjs" \
    "root@$ip:/home/openclaw/.openclaw/workspace/scripts/"

  # Copy skills
  ssh -o StrictHostKeyChecking=no "root@$ip" \
    "mkdir -p /home/openclaw/.openclaw/workspace/skills/weekly-roundup"
  scp -o StrictHostKeyChecking=no \
    "$SCRIPT_DIR/skills/weekly-roundup/SKILL.md" \
    "root@$ip:/home/openclaw/.openclaw/workspace/skills/weekly-roundup/"

  # Install Node.js dependencies for scripts
  ssh -o StrictHostKeyChecking=no "root@$ip" bash <<'REMOTE'
cd /home/openclaw/.openclaw/workspace/scripts
npm init -y > /dev/null 2>&1
npm install @supabase/supabase-js > /dev/null 2>&1
chown -R openclaw:openclaw /home/openclaw/.openclaw
REMOTE

  log "Scripts deployed."
}

cmd_configure() {
  require_var CLAWDBOT_TOKEN
  require_var ANTHROPIC_API_KEY
  require_var NEXT_PUBLIC_SUPABASE_URL
  require_var SUPABASE_SERVICE_ROLE_KEY
  require_var BLOG_API_KEY

  local ip
  ip=$(get_instance_ip)
  log "Configuring OpenClaw on $ip..."

  # Get Discord server + channel IDs from user if not set
  if [[ -z "${DISCORD_GUILD_ID:-}" ]]; then
    warn "DISCORD_GUILD_ID not set. You'll need to set this manually."
    warn "Right-click your Discord server → Copy Server ID"
    read -rp "Enter Discord Server ID: " DISCORD_GUILD_ID
  fi

  if [[ -z "${DISCORD_CHANNEL_WEEKLY_ROUNDUP:-}" ]]; then
    warn "DISCORD_CHANNEL_WEEKLY_ROUNDUP not set."
    warn "Right-click #weekly-roundup channel → Copy Channel ID"
    read -rp "Enter #weekly-roundup Channel ID: " DISCORD_CHANNEL_WEEKLY_ROUNDUP
  fi

  ssh -o StrictHostKeyChecking=no "root@$ip" bash <<REMOTE
# Run as openclaw user
su - openclaw << 'EOF'

# --- Model config ---
openclaw config set agents.defaults.model '"sonnet"' --json
openclaw config set agents.defaults.provider '"anthropic"' --json

# --- Discord channel ---
openclaw config set channels.discord.token '"$CLAWDBOT_TOKEN"' --json
openclaw config set channels.discord.enabled true --json
openclaw config set channels.discord.groupPolicy '"allowlist"' --json

# --- Guild access ---
openclaw config set channels.discord.guilds '{"$DISCORD_GUILD_ID":{"requireMention":false,"channels":{"$DISCORD_CHANNEL_WEEKLY_ROUNDUP":{"allow":true,"requireMention":false}}}}' --json

# --- Cron ---
openclaw config set cron.enabled true --json

EOF

# --- Environment variables for scripts ---
cat > /home/openclaw/.openclaw/workspace/.env << 'ENVFILE'
SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
BLOG_API_KEY=$BLOG_API_KEY
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
ENVFILE

chown openclaw:openclaw /home/openclaw/.openclaw/workspace/.env

# --- Systemd env file for OpenClaw daemon ---
mkdir -p /home/openclaw/.config/environment.d
cat > /home/openclaw/.config/environment.d/openclaw.conf << 'ENVCONF'
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
ENVCONF

chown -R openclaw:openclaw /home/openclaw/.config

REMOTE

  log "OpenClaw configured."
  log "Guild: $DISCORD_GUILD_ID"
  log "Weekly roundup channel: $DISCORD_CHANNEL_WEEKLY_ROUNDUP"
}

cmd_cron() {
  local ip
  ip=$(get_instance_ip)

  if [[ -z "${DISCORD_CHANNEL_WEEKLY_ROUNDUP:-}" ]]; then
    read -rp "Enter #weekly-roundup Channel ID: " DISCORD_CHANNEL_WEEKLY_ROUNDUP
  fi

  log "Setting up cron job on $ip..."

  ssh -o StrictHostKeyChecking=no "root@$ip" bash <<REMOTE
su - openclaw << 'EOF'
openclaw cron add \
  --name "weekly-roundup" \
  --cron "0 9 * * 5" \
  --tz "America/New_York" \
  --session isolated \
  --message "Run the weekly-roundup skill. Query this week's enriched regulatory items and draft the Weekly FDA Roundup blog post. Post the draft to Discord for review." \
  --announce \
  --channel discord \
  --to "channel:$DISCORD_CHANNEL_WEEKLY_ROUNDUP"

openclaw cron list
EOF
REMOTE

  log "Cron job set: Fridays at 9 AM ET"
}

cmd_start() {
  local ip
  ip=$(get_instance_ip)
  log "Starting OpenClaw gateway on $ip..."

  ssh -o StrictHostKeyChecking=no "root@$ip" bash <<'REMOTE'
su - openclaw << 'EOF'
openclaw onboard --install-daemon
openclaw gateway &
disown
echo "Gateway started"
EOF
REMOTE

  log "OpenClaw gateway running."
}

cmd_ssh() {
  local ip
  ip=$(get_instance_ip)
  log "SSH to $ip..."
  ssh -o StrictHostKeyChecking=no "root@$ip"
}

cmd_all() {
  cmd_provision
  cmd_wait
  cmd_deploy
  cmd_configure
  cmd_cron
  cmd_start
  log ""
  log "============================================"
  log "  Clawdbot is live!"
  log "  VPS IP: $(get_instance_ip)"
  log "  SSH: ssh root@$(get_instance_ip)"
  log "  Cron: Fridays 9 AM ET"
  log "  Discord: check #weekly-roundup"
  log "============================================"
}

# ============================================================================
# Main
# ============================================================================

case "${1:-help}" in
  provision)  cmd_provision ;;
  status)     cmd_status ;;
  wait)       cmd_wait ;;
  deploy)     cmd_deploy ;;
  configure)  cmd_configure ;;
  cron)       cmd_cron ;;
  start)      cmd_start ;;
  ssh)        cmd_ssh ;;
  all)        cmd_all ;;
  *)
    echo "Usage: $0 {provision|status|wait|deploy|configure|cron|start|ssh|all}"
    echo ""
    echo "Commands:"
    echo "  provision   Create Vultr VPS with cloud-init"
    echo "  status      Check VPS status"
    echo "  wait        Wait for VPS to become active"
    echo "  deploy      Deploy scripts & skills to VPS"
    echo "  configure   Configure OpenClaw (Discord, API keys, model)"
    echo "  cron        Set up weekly roundup cron job"
    echo "  start       Start OpenClaw gateway daemon"
    echo "  ssh         SSH into the VPS"
    echo "  all         Full setup (provision → deploy → configure → cron → start)"
    exit 1
    ;;
esac
