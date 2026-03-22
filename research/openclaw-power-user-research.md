# OpenClaw Power User Research (2026-03-19)

What features and capabilities are available in the OpenClaw ecosystem that Anton's current setup may be missing. Focused on business-relevant improvements for an agent doing outreach, content, research, and email.

---

## Current Setup Baseline

- OpenClaw v2026.3.13 on Ubuntu 24.04 LXC (Proxmox, 4 vCPU, 16GB RAM, A2000 GPU)
- Slack channel plugin (socket mode)
- QMD v2.0.1 with CUDA acceleration (memory + workspace collections)
- Heartbeat every 30m with custom prompt
- Model: Claude Sonnet 4.6 (default)
- ~20 custom .mjs scripts (Supabase, blog, email, web research, Notion, PostHog, image gen)
- Cron jobs for scheduled content tasks
- Browser (agent-browser CLI)
- No ClawHub plugins installed beyond stock

---

## What You Are Leaving on the Table

### 1. FAST MODE (High Priority)

**What it is:** Anthropic added a "fast mode" research preview for Claude models. Same model weights, optimized inference backend — roughly 6x faster token output. Available for both Sonnet and Opus.

**Why it matters for Anton:** Heartbeat cycles, cron jobs, and especially content drafting would complete significantly faster. Less time blocked on generation = more work per cycle.

**How to enable:** Add to `openclaw.json` agent config:
```json
{
  "agents": {
    "defaults": {
      "models": {
        "anthropic/claude-sonnet-4-5": {
          "params": {
            "fastMode": true
          }
        }
      }
    }
  }
}
```

**Requirements:** Must use direct Anthropic API key (not OAuth/setup-token). You already have this. Fast mode is API-key only.

**Combinable with effort parameter:** Fast Mode + Low Effort = maximum speed for simple tasks (heartbeat, monitoring). Fast Mode + High Effort = fast but thorough for content drafting.

**Status in v2026.3.12+:** Fully supported. Per-session toggle via `/fast` command or dashboard. Can configure as default.

---

### 2. SECURITY HARDENING (High Priority)

Your hardening TODO list from the clawdbot doc is still incomplete. The ecosystem has matured and there are now first-class tools:

**a) `openclaw security audit --deep`**
Run this after any config change. It flags exposed ports, weak auth, and dangerous tool permissions. You are not currently running this.

**b) Sandbox mode**
Your doc says "Enable sandbox mode (imperfect but raises the bar)" under TODO. In v2026.3.13, sandbox configuration is:
```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main",
        "workspace": "rw"
      }
    }
  }
}
```
`"non-main"` sandboxes sub-agents but not the main agent. `"all"` sandboxes everything (Docker required).

**c) Tool allowlists**
You can explicitly restrict what tools Anton has access to. The security docs recommend denying `group:automation`, `group:runtime`, `group:fs` and `sessions_spawn` for any public-facing agent. For Anton (trusted operator, internal only), consider at minimum blocking `gateway` config changes from the agent itself.

**d) Secrets in systemd EnvironmentFile**
Still on your TODO. The pattern:
```
# /etc/openclaw/secrets.env (0600 root:root)
ANTHROPIC_API_KEY=sk-ant-...
# etc.

# In systemd unit:
EnvironmentFile=/etc/openclaw/secrets.env
```
Agent inherits env vars at runtime but cannot `cat` the file.

**e) Ephemeral device tokens**
New in v2026.3.12. Device tokens no longer persist long-lived credentials. If you haven't upgraded config to use these, worth checking.

---

### 3. DASHBOARD V2 (Medium Priority)

**What it is:** Full web control UI introduced in v2026.3.12. Modular views: overview, chat, config, agent, sessions. Command palette, slash commands, search, export, pinned messages.

**Why it matters:** Right now you manage Anton entirely via SSH + Slack. Dashboard v2 gives you:
- Visual session inspection (see what the agent is doing in real-time without `journalctl`)
- Live config editing without SSH
- Chat export for debugging bad generations
- Session management (kill, restart, inspect context window usage)
- Tool-heavy runs no longer cause UI freeze (fixed in v2026.3.13)

**How to access:** Dashboard binds to the gateway port. If binding to loopback, access via SSH tunnel or Tailscale. No extra setup needed — it ships with the gateway.

**Caveat:** Keep it on loopback. Do not expose the gateway port publicly.

---

### 4. n8n WEBHOOK INTEGRATION (Medium-High Priority)

**What it is:** n8n is a self-hosted workflow automation tool. The pattern: OpenClaw calls n8n webhooks as "skills" — n8n handles multi-step deterministic workflows, OpenClaw handles intelligence.

**Why it matters for Anton:** Several of your planned capabilities (Inngest triggers, Stripe monitoring, follow-up tracking, email triage) are deterministic multi-step workflows that waste LLM tokens when done through chat. n8n runs them for free with full observability.

**Architecture:**
```
Anton (intelligence) → n8n webhook (deterministic steps) → external APIs
                                                          → Supabase
                                                          → Slack notifications
```

**Concrete wins:**
- **Inngest triggers**: Instead of a helper script, n8n webhook receives "run enrichment" and calls the Inngest API. Agent never sees API tokens.
- **Follow-up tracker**: n8n workflow checks Supabase for contacts past follow-up date, posts reminders to Slack.
- **Stripe monitoring**: n8n pulls MRR/trial data on a schedule, formats it, posts to Slack — no LLM needed.
- **Lead enrichment pipeline**: n8n scrapes company details, checks FDA databases, returns structured data to Anton for outreach drafting.

**Setup:** Self-hosted n8n on the same Proxmox host (another LXC, 2 vCPU / 4GB RAM). Minimum cost, maximum reliability.

**Key security practice:** Agent only knows webhook URLs, never API tokens. n8n sits between the agent and external APIs.

---

### 5. COMPOSIO (Medium Priority)

**What it is:** A unified integration framework that gives OpenClaw access to 860+ external tools through a single auth layer. OAuth tokens and API keys managed centrally.

**Why it matters:** You currently write custom .mjs scripts for each integration (Supabase, PostHog, Notion, etc.). Composio provides pre-built, authenticated connectors for:
- LinkedIn (post, read, comment) — replaces manual copy-paste workflow
- Gmail / Google Workspace — email triage, send, read
- Google Sheets — pipeline data exports
- HubSpot / Pipedrive / other CRMs — when you need one
- Salesforce — for enterprise prospects

**How it works:** Install via ClawHub skill. Composio MCP server registers tools directly into the agent — tools called by name, no extra search or execute steps.

**Caution:** Composio is a cloud service (your credentials pass through their infra). For sensitive keys (Supabase, Stripe), keep using direct scripts. For LinkedIn and similar social integrations where the main value is OAuth management, Composio is worth it.

---

### 6. AGENTMAIL (Low-Medium Priority, Worth Watching)

**What it is:** API platform that gives AI agents their own email inbox. Real addresses, two-way communication, threading, labeling, searching.

**Why it matters:** Your current email workflow for outreach is: Anton drafts in Slack, you copy-paste to Gmail. AgentMail would give Anton its own `anton@policycanary.io` (or similar) capable of:
- Sending drafted outreach directly (with your approval gate in Slack)
- Receiving replies and routing them to you
- Threading follow-ups automatically
- Parsing structured data from inbound emails

**Cost:** Seed-stage startup, pricing not fully public. YC S25 batch.

**When to adopt:** When outreach volume exceeds what manual copy-paste can handle. For now, your Slack-based approval workflow is fine. But if you hit 10+ outreach emails/week, this removes significant friction.

---

### 7. HEADLESS NODE ON SEPARATE MACHINE (Low Priority)

**What it is:** A "node" is a companion device that connects to the Gateway WebSocket and exposes commands (system.run, canvas, etc.). You can run headless nodes on other machines.

**Why it might matter:** If you wanted Anton to execute tasks on a different machine (e.g., run heavy data processing on a beefier Proxmox VM, or trigger builds on a dev server), a headless node gives that reach without SSH key management.

**Current state:** Not needed — Anton's LXC has everything it needs. But useful if you add a dedicated n8n host or want Anton to manage infrastructure across multiple VMs.

---

### 8. SLACK INTERACTIVE REPLY DIRECTIVES (New in v2026.3.13)

**What it is:** Opt-in feature for interactive Slack replies. Enables buttons, dropdowns, and other interactive elements in Slack messages.

**Why it matters:** Your approval workflow ("say publish in Slack") could become a button click. Lead finder results could have "Draft outreach" / "Skip" / "Research more" buttons. More ergonomic than typing commands.

**How to enable:** Opt-in flag in Slack channel config. Check the v2026.3.13 release notes for the specific config key.

---

### 9. MEMORY IMPROVEMENTS

**What you have:** QMD v2.0.1 with CUDA, memory + workspace collections. This is already the best local option.

**What else exists:**

**a) Supermemory (cloud)**
- Auto-captures conversations, builds knowledge graph, temporal reasoning
- Queries relevant memories before every AI turn
- Better at long-term pattern recognition than QMD's hybrid search
- Tradeoff: cloud-based (data leaves your infra), subscription cost
- **Verdict for Anton:** QMD is fine for your use case. The working buffer + SESSION-STATE + daily notes pattern you built is purpose-designed. Supermemory adds value for general-purpose agents, not specialized ones.

**b) Engram (local, QMD-based)**
- LLM-powered extraction of facts from conversations, stored as plain markdown
- Hybrid search via QMD
- **Verdict:** Similar to what your WAL protocol already does manually. Not worth switching.

**c) Memory file injection fix (v2026.3.13)**
- Fixed duplicate memory file injection on case-insensitive mounts. If you noticed duplicate context from memory files, this is resolved.

---

### 10. MCP SERVER INTEGRATION

**What it is:** Over 65% of active OpenClaw skills now wrap MCP servers. MCP (Model Context Protocol) is the standard way to add tools.

**What you should know:**
- Your custom .mjs scripts are essentially doing what MCP tools do, but without the protocol. They work fine.
- If you want to expose Anton's capabilities to other tools (e.g., Claude Desktop could call Anton via MCP), there is an `openclaw-mcp` bridge.
- For your current workflow, MCP is a "nice to have" standardization, not a must-have.

**One exception:** If you adopt n8n, the MCP bridge pattern (n8n MCP server -> OpenClaw) is cleaner than raw webhooks for bidirectional communication.

---

## What You Do NOT Need

These came up in research but are not relevant to your use case:

| Feature | Why Skip |
|---------|----------|
| Canvas / A2UI | Visual workspace, agent-driven HTML. Consumer/demo feature, not business ops. |
| iOS/Android nodes | Mobile pairing. You manage Anton via SSH and Slack. |
| Smart home skills | Hobbyist. |
| Ollama/vLLM/SGLang plugins | Local model hosting. You use Anthropic API — better quality, worth the cost. |
| WhatsApp/Telegram/iMessage channels | You use Slack. Adding channels adds attack surface for no benefit. |
| ClawHub skills generally | 17% were flagged malicious before cleanup. Audit each one. Your custom scripts are more trustworthy. |
| Supermemory | Your WAL + SESSION-STATE pattern is purpose-built and better for your use case. |

---

## Recommended Action Plan (Priority Order)

### Do Now (This Week)
1. **Enable Fast Mode** — Single config change, immediate speed benefit on all tasks.
2. **Run `openclaw security audit --deep`** — See what it flags on your current config.
3. **Move secrets to systemd EnvironmentFile** — Long overdue, 15-minute task.
4. **Try Dashboard v2** — SSH tunnel to gateway port, see if the session inspector helps debugging.

### Do Soon (Next 2 Weeks)
5. **Enable Slack interactive replies** — Better approval UX for publish/outreach workflows.
6. **Enable sandbox mode `"non-main"`** — Sub-agent isolation with minimal friction.
7. **Evaluate n8n** — Spin up an LXC, prototype the Stripe monitoring workflow. If it works, migrate all deterministic workflows.

### Do Later (When Needed)
8. **Composio for LinkedIn** — When manual copy-paste becomes a bottleneck.
9. **AgentMail** — When outreach volume exceeds 10/week.
10. **Headless nodes** — When multi-machine orchestration is needed.

---

## Version Notes

### v2026.3.12 (What You Upgraded Through)
- Dashboard v2 (modular control UI)
- Fast Mode (per-model, per-session toggles)
- Plugin architecture for model providers (Ollama/vLLM/SGLang moved to plugins)
- Ephemeral device tokens (reduced long-lived credential risk)
- Cron + Windows reliability fixes

### v2026.3.13 (Your Current Version)
- Slack interactive reply directives (opt-in)
- Fixed memory file injection duplicates on case-insensitive mounts
- Cross-agent subagent workspace targeting fixed
- Cron jobs protected against nested lane deadlocks
- Dashboard chat history reload storms eliminated
- Gateway RPC timeout enforcement (no more hung requests)
- Docker timezone override (OPENCLAW_TZ)
- 69 merged PRs from 37 contributors

---

## Sources

- [OpenClaw Documentation](https://docs.openclaw.ai/)
- [OpenClaw GitHub Releases](https://github.com/openclaw/openclaw/releases)
- [OpenClaw Security Docs](https://docs.openclaw.ai/gateway/security)
- [OpenClaw Nodes Docs](https://docs.openclaw.ai/nodes)
- [v2026.3.12 Release Notes](https://blockchain.news/ainews/openclaw-v2026-3-12-release-dashboard-v2-fast-mode-plugin-architecture-for-ollama-sglang-vllm-and-ephemeral-device-tokens)
- [v2026.3.13 Release](https://github.com/openclaw/openclaw/releases/tag/v2026.3.13-1)
- [ClawTank Best Skills](https://clawtank.dev/blog/best-openclaw-skills-plugins)
- [awesome-openclaw-usecases](https://github.com/hesamsheikh/awesome-openclaw-usecases)
- [OpenClaw + n8n Guide](https://futurehumanism.co/articles/openclaw-n8n-workflow-automation-guide/)
- [Composio MCP Integration](https://composio.dev/content/how-to-use-composio-mcp-with-openclaw)
- [AI SDR Playbook](https://stormy.ai/blog/build-openclaw-ai-sdr-playbook-2026)
- [AgentMail for OpenClaw](https://www.agentmail.to/blog/openclaw-agent-email-inbox)
- [OpenClaw Memory Systems Comparison](https://agentnativedev.medium.com/openclaw-memory-systems-that-dont-forget-qmd-mem0-cognee-obsidian-4ad96c02c9cc)
- [Fast Mode Configuration](https://docs.openclaw.ai/providers/anthropic)
- [OpenClaw Security Hardening Guide](https://contabo.com/blog/openclaw-security-guide-2026/)
