---
Last-Updated: 2026-03-12
Maintainer: RB
Status: Active — Running on Pi 5 (clawd). Vultr DESTROYED. Autonomy upgrade deployed. Humanization pass added to all content skills.
---

# Anton (formerly Clawdbot) Reference

Anton is an OpenClaw-powered AI agent (Claude Opus 4.6) that operates as Rashaad's cofounder — owning ops, sales, and marketing for Policy Canary and Finch. Runs as a systemd service on a Raspberry Pi 5, connects to Slack, and makes autonomous decisions about what to work on within defined guardrails.

---

## Infrastructure

### Current: Raspberry Pi 5 (`clawd`)
| Detail | Value |
|--------|-------|
| **Host** | Pi 5 (8GB) + S2Pi NVMe HAT (466GB Samsung) + 2.5GbE |
| **IP** | `10.2.0.40` (fixed in Unifi) |
| **SSH** | `ssh gr0x@10.2.0.40` |
| **OS** | Debian Trixie (Raspberry Pi OS), Node.js 22 |
| **Agent** | OpenClaw v2026.3.8, Claude Opus 4.6 |
| **Browser** | `agent-browser` v0.17.1 (native ARM64 Rust CLI + Chromium 145) |
| **Service** | `sudo systemctl {start|stop|restart|status} anton.service` |
| **Logs** | `journalctl -u anton.service -f` |
| **Config** | `/home/gr0x/.openclaw/openclaw.json` |
| **Workspace** | `/home/gr0x/.openclaw/workspace/` |

**Vultr VPS DESTROYED.** All Vultr references and Discord integration are deprecated.

### Key Architecture Notes
- All connections are **outbound** (Slack API, Supabase, Anthropic API, blog/intelligence API) — no inbound ports needed
- `gateway.mode` must be `"local"` (required for headless operation)
- `agents.defaults.model` set to Opus 4.6
- Heartbeat: Sonnet 4.6, every 30m, `lightContext: false` (loads full AGENTS.md with all protocols)
- Do NOT create multiple OpenClaw agents simultaneously — concurrent QMD embed processes cause thermal crash

### Autonomy Model (Upgraded 2026-03-12)
Inspired by [proactive-agent v3.1.0](https://clawhub.ai/halthelobster/proactive-agent) but adapted for Anton's purpose-built role.

**Decision Authority — two tiers:**
- **Autonomous**: all research, data queries, analysis, drafting, ideation, reprioritizing crons, pipeline health checks, internal file management
- **Needs Rashaad**: publishing, sending outreach, LinkedIn posts, any external-facing communication

**Key Protocols (all in AGENTS.md on Pi):**
| Protocol | Purpose |
|----------|---------|
| WAL (Write-Ahead Log) | Scan every message for corrections/decisions/proper nouns. Write to SESSION-STATE.md BEFORE responding. |
| Working Buffer | When context hits 60%, log every exchange to `memory/working-buffer.md`. Survives compaction. |
| Compaction Recovery | After context loss: read working buffer → SESSION-STATE → daily notes → QMD. Never ask "what were we doing?" |
| Reverse Prompting | During idle heartbeats, proactively find things that would help Rashaad. Do the research, bring a finding — don't ask permission to think. |
| Outcome Tracking | Log autonomous decisions with follow-up dates. Nightly review checks 3+ day old decisions for outcomes. Close the loop in TACIT.md. |
| Business Monitoring | Pipeline watchdog (0 items = alert), signup detection (PostHog), email health, Stripe monitoring (when live). |

**Crons are context-aware**: every cron reads SESSION-STATE.md, evaluates whether the scheduled task is the highest-value use of the time slot, and can pivot with reasoning posted to #anton.

---

## Slack

### Channels
| Channel | ID | Purpose |
|---------|-----|---------|
| `#anton` | `C0AJX2E8087` | Strategy, coordination, nightly summaries |
| `#pc-content` | `C0AKRB695UH` | PC blog + LinkedIn drafts |
| `#pc-alerts` | `C0AK627KG5R` | PC ops alerts |
| `#pc-outreach` | `C0AK62A92D9` | PC prospect outreach |

---

## Cron Jobs

All run on Pi as `gr0x` user. Managed via `openclaw cron {list|add|run|remove}`. All times ET.

| Job | Schedule | Channel |
|-----|----------|---------|
| `nightly-review` | `0 23 * * *` (11PM) | `#anton` |
| `weekly-roundup` | `0 9 * * 5` (Fri 9AM) | `#pc-content` |
| `seo-blog` | `0 10 * * 2` (Tue 10AM) | `#pc-content` |
| `linkedin-mon` | `0 10 * * 1` (Mon 10AM) | `#pc-content` |
| `linkedin-wed` | `0 10 * * 3` (Wed 10AM) | `#pc-content` |
| `lead-finder` | `0 8 * * 1` (Mon 8AM) | `#pc-outreach` |

---

## Skills (on Pi)

Skills are markdown instruction files that tell Anton how to perform complex multi-step tasks.

| Skill | Location (Pi) | Source (repo) | Purpose |
|-------|---------------|---------------|---------|
| **weekly-roundup** | `skills/weekly-roundup/SKILL.md` | `scripts/clawdbot/skills/weekly-roundup/SKILL.md` | Friday roundup: query week's data, research, draft blog post + LinkedIn copy, post to Slack |
| **seo-blog-post** | `skills/seo-blog-post/SKILL.md` | `scripts/clawdbot/skills/seo-blog-post/SKILL.md` | Tuesday SEO post: keyword-targeted, data-driven, charts + images |
| **linkedin-post** | `skills/linkedin-post/SKILL.md` | `scripts/clawdbot/skills/linkedin-post/SKILL.md` | Mon (roundup promo) / Wed (fresh content) LinkedIn drafts: copy/paste workflow |
| **lead-finder** | `skills/lead-finder/SKILL.md` | `scripts/clawdbot/skills/lead-finder/SKILL.md` | Monday leads: companies cited in FDA enforcement that aren't subscribers, with draft outreach |
| **agent-browser** | `skills/agent-browser/SKILL.md` | N/A (installed globally via npm) | Browser automation CLI — navigate, snapshot, interact, extract, screenshot. 93% less context than Playwright. |

---

## Scripts (on Pi)

Helper scripts in `/home/gr0x/.openclaw/workspace/scripts/`. Source in `scripts/clawdbot/`.

### Data Access
| Script | Purpose | Key Flags | API |
|--------|---------|-----------|-----|
| `query-supabase.mjs` | Individual enriched regulatory items | `--days N`, `--enriched-only`, `--summary`, `--type TYPE`, `--limit N` | Supabase |
| `query-analytics.mjs` | Aggregate trends, stats, comparisons | `--report {weekly|trends|substances|allergens|categories|deadlines|recalls|substance-detail|all}`, `--days N`, `--substance NAME` | Supabase |
| `query-blog.mjs` | Published blog posts | `--not-promoted` (fresh for LinkedIn), `--slug SLUG` (full content), `--limit N` | Supabase |
| `query-leads.mjs` | Companies in recent enforcement not yet subscribers | `--days N`, `--type {warning_letter|recall}`, `--include-subscribers` | Supabase |

### Browser
| Tool | Purpose | Key Commands |
|------|---------|-------------|
| `agent-browser` | Browser automation CLI (93% less context than Playwright) | `open <url>`, `snapshot -i` (get @refs), `click @e1`, `fill @e2 "text"`, `get text @e1`, `screenshot`, `wait --load networkidle`, `close` |

Skill file: `skills/agent-browser/SKILL.md`. Prefer over built-in OpenClaw Playwright browser for all web interaction tasks.

### Research
| Script | Purpose | Key Flags | API |
|--------|---------|-----------|-----|
| `web-research.mjs` | Web search | `--query TEXT`, `--depth {basic|advanced}`, `--max-results N`, `--include-domains CSV`, `--topic {general|news}` | Tavily |
| `scrape-page.mjs` | Full page text extraction | `--url URL`, `--render` (JS rendering) | ScrapingDog |

### Content Creation
| Script | Purpose | Key Flags | API |
|--------|---------|-----------|-----|
| `generate-chart.mjs` | Chart images | `--type {bar|line|pie|doughnut|horizontalBar}`, `--title`, `--labels CSV`, `--data CSV`, `--data2 CSV` | QuickChart.io |
| `generate-image.mjs` | AI-generated images | `--prompt TEXT`, `--output PATH` | Google Gemini (`gemini-3-pro-image-preview`) |

### Quality
| Script / File | Purpose | Key Flags | API |
|--------|---------|-----------|-----|
| `verify-content.mjs` | Second-pass fact-checking (different model verifies content) | `--content-file PATH`, `--content-type {blog|intelligence|linkedin}`, `--verbose` | Google Gemini (Flash extraction + Pro grounding via Google Search) + optional Supabase cross-ref |
| `anti-slop.md` | Humanization guide — 24 AI writing patterns to detect and fix (based on Wikipedia "Signs of AI writing"). Banned words, phrases, sentence patterns, formatting tells. Includes 10-step humanize pass checklist. | Read before any content draft | N/A (reference doc) |

### Publishing
| Script | Purpose | Key Flags | API |
|--------|---------|-----------|-----|
| `publish-blog.mjs` | Publish to policycanary.io/blog | `--title`, `--slug`, `--content-file`, `--category`, `--excerpt`, `--status`, `--cover-image-url` | POST `/api/blog` |
| `publish-intelligence.mjs` | Publish intelligence page | `--page-type`, `--slug`, `--title`, `--content-file`, `--excerpt`, `--structured-data-file`, `--status` | POST `/api/intelligence` |
| `query-intelligence.mjs` | Query intelligence pages | `--page-type`, `--status`, `--limit` | Supabase |
| `upload-image.mjs` | Upload images to Supabase Storage | `--file PATH`, `--slug SLUG` | Supabase Storage (`blog-images` bucket) |
| `mark-linkedin-promoted.mjs` | Mark blog post as LinkedIn-promoted | `--slug SLUG` | Supabase |

---

## Security (Hardened 2026-03-08, migrated to Pi 2026-03-10)

### Known OpenClaw Risks
- **`openclaw update` / `openclaw doctor`** resolve `${ENV_VAR}` references and write plaintext keys back to `openclaw.json`. Never run these without backing up config first.
- **API keys injected into LLM prompt context** — the runtime model catalog (with resolved keys) is serialized into every system prompt.
- **Session transcripts** (`agents/main/sessions/*.jsonl`) can capture secrets if the agent reads or outputs them.
- **Sandbox TOCTOU bypass** (Snyk GHSA-F7WW-2725-QVW2) — symlink rebinding can escape sandbox even when enabled.
- **Prompt injection via Slack** — anyone in a channel Anton monitors can interact and potentially trick the agent.

### Hardening Applied
| Change | Status |
|--------|--------|
| Dedicated Supabase secret key (`clawdbot` — `sb_secret_*`) | Done — separate from production key, independently rotatable |
| `.env` and `openclaw.json` permissions → `600` | Done |
| Session transcript dir → `700`, files → `600` | Done |
| Scripts use `SUPABASE_SECRET_KEY` (fallback to legacy name) | Done |

### Still TODO
- Move secrets into root-owned `/etc/openclaw/secrets.env` (`0600` root:root), loaded via systemd `EnvironmentFile=`. Agent process inherits env vars but cannot read the file.
- Pin OpenClaw to specific version (not `@latest`)
- Enable sandbox mode (imperfect but raises the bar)
- Consider outbound firewall (allow only api.anthropic.com, slack.com, Supabase URL, policycanary.io)
- Scope Supabase key when Supabase adds key-level permissions

### Key Rotation
If a key is compromised:
1. Revoke the `clawdbot` key in Supabase dashboard → production app is unaffected
2. Create a new secret key, update Pi `.env`, restart service
3. Rotate Anthropic/Tavily/ScrapingDog keys in their respective dashboards
4. Clear session transcripts: `rm /home/gr0x/.openclaw/agents/main/sessions/*.jsonl`

---

## Environment Variables (on Pi)

### Workspace `.env` (`/home/gr0x/.openclaw/workspace/.env`)
```bash
SUPABASE_URL=...
SUPABASE_SECRET_KEY=...              # Dedicated clawdbot key (sb_secret_*), NOT service_role
BLOG_API_KEY=...
ANTHROPIC_API_KEY=...
TAVILY_API_KEY=...
SCRAPINGDOG_API_KEY=...
GOOGLE_GENERATIVE_AI_API_KEY=...     # For image generation
```

### Systemd Environment
`ANTHROPIC_API_KEY` also set in systemd service `Environment=` directive for the OpenClaw gateway process.

### Key Separation
| Key | Where Used | Scope |
|-----|-----------|-------|
| `SUPABASE_SECRET_KEY` (sb_secret_*) | Pi only (Anton scripts) | Dedicated key — revoke without affecting production |
| `SUPABASE_SERVICE_ROLE_KEY` (legacy JWT) | Vercel only (Next.js app) | Production app — NOT on Pi |

---

## File Locations

### On Pi
```
/home/gr0x/.openclaw/
  openclaw.json              # OpenClaw config (Slack, model, cron)
  workspace/
    .env                     # API keys for scripts
    AGENTS.md                # Operating system: decision authority, WAL, protocols, tools
    SESSION-STATE.md          # Active working memory (read first, update last every heartbeat)
    HEARTBEAT.md             # Work queue (Rashaad's tasks + Anton's Queue)
    TACIT.md                 # Corrections, patterns, autonomy calibration
    anti-slop.md             # Humanization guide (24 AI writing patterns, banned words/phrases, checklist)
    brand-pc.md              # Policy Canary brand voice
    brand-finch.md           # Finch brand voice
    memory/
      working-buffer.md      # Danger zone log (activates at 60% context)
      YYYY-MM-DD.md          # Daily notes
    scripts/                 # All .mjs helper scripts
    skills/
      weekly-roundup/SKILL.md
      seo-blog-post/SKILL.md
      linkedin-post/SKILL.md
      lead-finder/SKILL.md
      agent-browser/SKILL.md
```

### In Repo
```
scripts/clawdbot/
  workspace/                  # Source of truth for Pi workspace files
    AGENTS.md                 # Deploy: scp to ~/.openclaw/workspace/
    SESSION-STATE.md
    HEARTBEAT.md
    TACIT.md
    memory/working-buffer.md
  upgrade-crons.sh            # Script to replace cron jobs with context-aware prompts
  query-supabase.mjs
  query-analytics.mjs
  query-blog.mjs
  query-intelligence.mjs
  web-research.mjs
  scrape-page.mjs
  generate-chart.mjs
  generate-image.mjs
  publish-blog.mjs
  verify-content.mjs          # Second-pass fact-checking (Gemini verifies Claude output)
  publish-intelligence.mjs
  upload-image.mjs
  mark-linkedin-promoted.mjs
  query-leads.mjs
  notion.mjs
  posthog.mjs
  skills/
    weekly-roundup/SKILL.md
    seo-blog-post/SKILL.md
    linkedin-post/SKILL.md
    lead-finder/SKILL.md
```

---

## Deployment

### Deploy workspace files (AGENTS.md, SESSION-STATE.md, HEARTBEAT.md, TACIT.md)
```bash
scp scripts/clawdbot/workspace/*.md gr0x@10.2.0.40:/home/gr0x/.openclaw/workspace/
scp scripts/clawdbot/workspace/memory/working-buffer.md gr0x@10.2.0.40:/home/gr0x/.openclaw/workspace/memory/
```

### Deploy scripts to Pi
```bash
scp scripts/clawdbot/*.mjs gr0x@10.2.0.40:/home/gr0x/.openclaw/workspace/scripts/
```

### Deploy skills to Pi
```bash
scp -r scripts/clawdbot/skills/* gr0x@10.2.0.40:/home/gr0x/.openclaw/workspace/skills/
```

### Upgrade cron jobs (context-aware prompts)
```bash
# Cron removal requires job IDs: openclaw cron list → openclaw cron remove <id>
# Then re-add with upgrade-crons.sh (review prompts before running)
scp scripts/clawdbot/upgrade-crons.sh gr0x@10.2.0.40:/tmp/
ssh gr0x@10.2.0.40 'bash /tmp/upgrade-crons.sh'
```

### Restart after config changes
```bash
ssh gr0x@10.2.0.40 sudo systemctl restart anton.service
```

---

## Content Workflow (Context-Aware — Upgraded 2026-03-12)

All crons now read SESSION-STATE.md first and decide whether the scheduled task is the highest-value use of the time slot. Anton can pivot with reasoning posted to #anton.

**Content quality pipeline (all content skills):** Draft → Humanize Pass (anti-slop.md audit) → Fact-check (verify-content.mjs) → Post to Slack for review.

### Weekly Roundup (Friday 9AM)
1. Reads SESSION-STATE.md for prep context (nightly review pre-stages item counts)
2. Assesses week's data: `query-analytics --report all --days 7` + `query-supabase --days 7 --enriched-only`
3. **Decides**: >= 5 items → normal roundup. 3-4 → roundup + historical trends. < 3 → pivots to deep-dive or intelligence page refresh
4. Writes, verifies (`verify-content.mjs`), posts draft to `#pc-content`
5. Also drafts Monday's LinkedIn post
6. RB reviews → says "publish" → Anton publishes via `/api/blog`

### SEO Blog Post (Tuesday 10AM)
1. Reads SESSION-STATE.md
2. **Evaluates**: breaking FDA news since Friday? Stale intelligence pages? Topic overlap with recent posts?
3. **Decides**: breaking news → write about that. Stale intel page → refresh it. Neither → normal SEO skill with cluster rotation
4. Writes, verifies, posts draft to `#pc-content`

### LinkedIn (Monday 10AM + Wednesday 10AM)
1. **Monday**: checks if Friday roundup was published. If yes → promote it. If no → find unpromoted post or draft standalone insight.
2. **Wednesday**: finds unpromoted posts or drafts standalone content from data insights.
3. Verifies, posts to `#pc-content`. RB copies/pastes into LinkedIn natively.

### Lead Finder (Monday 8AM)
1. Queries `query-leads.mjs --days 7` (expands to 14 if empty)
2. If leads found: researches top 3-5, drafts outreach, posts to `#pc-outreach`
3. If no leads: uses the time productively — checks Notion for prospects without drafts, researches new channels, refreshes intelligence pages

### Nightly Review (11PM)
1. Extracts corrections/decisions from SESSION-STATE.md → TACIT.md (Autonomy Patterns)
2. Business pulse: pipeline health, PostHog signups, email stats
3. Summarizes day to `#anton` (3-5 lines)
4. Compacts SESSION-STATE.md, preps context for tomorrow's crons
5. Runs knowledge graph update + memory decay

---

## Built-In Monitoring (via Heartbeat + Nightly Review)

Pipeline watchdog and signup detection are now part of Anton's heartbeat/nightly review protocol — not separate crons.

| Check | When | Alert Channel |
|-------|------|---------------|
| Pipeline health (0 items on weekday) | Every idle heartbeat + nightly review | `#pc-alerts` |
| New signups (PostHog) | Nightly review | `#pc-alerts` |
| Email bounce/open rates | Nightly review | `#pc-alerts` if bounce > 5% |
| Stripe monitoring | Nightly review (when checkout is live) | `#pc-alerts` |

### Monitoring Stack
| Concern | Tool |
|---------|------|
| Code errors, crashes | **Sentry** (free tier, 5K errors/mo) |
| Pipeline health, business metrics | **Anton** (heartbeat + nightly review) |
| User behavior, funnels | **PostHog** (project 334096) |
| Pipeline job status, retries | **Inngest dashboard** |

## Planned Capabilities

### Inngest Integration
Give Anton access to trigger Vercel-hosted pipeline functions via Inngest events. One env var (`INNGEST_EVENT_KEY`) + a small helper script enables:

- **"Run enrichment"** → send `pipeline/enrich.requested` event
- **"Trigger daily ingest"** → send event for `daily-ingest` function
- **"Send weekly emails"** → hit `/api/email/send-weekly`

Implementation: add `trigger-inngest.mjs` helper script. Turns Slack into ops console.

### Future Skills — Prioritized Roadmap

#### Tier 1 — Customer awareness (build when pilots start)

**Customer health pulse** — Weekly roll-up of subscriber engagement.
- Who's active (opened emails, visited app)
- Who hasn't opened emails in 2+ weeks
- Who added/removed products this week
- Trial expirations coming up
- Schedule: weekly cron, Monday 8 AM ET → `#anton`

#### Tier 2 — Data quality (build when data volume grows)

**Enrichment QA sampler** — Weekly quality spot-check.
- Pull 5 random enriched items from the past week
- Evaluate: are product categories correct? Are substances tagged? Is urgency calibrated? Do action items make sense?
- Score each 1-5, post scorecard to `#anton`
- Flag anything scoring < 3 for manual review
- Could compare against golden test fixtures for regression detection
- Schedule: weekly cron, Sunday 10 AM ET

**Data gap finder** — Weekly data hygiene report.
- Items with 0 substance tags (should have some)
- Items with 0 product category tags
- Product categories with 0 items in last 30 days (broken fetcher or coverage gap?)
- Source URLs that 404 (link rot)
- Enrichments with empty action_items where urgency > medium
- Schedule: weekly cron, Sunday 11 AM ET → `#pc-alerts`

#### Tier 3 — Sales & prospecting (build alongside outreach)

**Prospect research** — Drop a company name in Slack, get a full account brief.
- Trigger: Slack command, e.g. "research AcmeFoods"
- Agent scrapes company website, checks FDA Establishment Registration database
- Queries Supabase for regulatory items matching their likely product categories
- Searches web for recent 483 observations, warning letters, or recalls involving the company
- Posts structured "Account Brief" to `#anton`: company size, key products, recent FDA activity affecting them, risk exposure from your database, draft outreach email referencing specific items
- Why: turns cold outreach into warm outreach — you're showing prospects their own risk using data you already have
- Data: `web-research.mjs`, `scrape-page.mjs`, `query-supabase.mjs`, `query-analytics.mjs`

**Warning letter lead finder** — Sell the umbrella while it's raining.
- Schedule: weekly cron, Monday morning → `#pc-outreach`
- Agent queries recent warning letters and 483 observations from Supabase
- Cross-references cited companies against `users` table — are they already a subscriber?
- If NOT a subscriber: posts lead alert with company name, violation type, their product categories, and a draft cold email referencing the specific enforcement action
- Why: companies that just got hit by FDA are the most motivated buyers of regulatory monitoring. This is the highest-intent lead source you have.
- Data: `query-supabase.mjs --type warning_letter`, `users` table, `web-research.mjs` for company details

**Meeting prep** — One command before a sales call.
- Trigger: Slack command, e.g. "prep AcmeFoods" or "prep Jane Smith"
- Agent runs prospect research workflow, plus: searches for the specific contact on LinkedIn, recent company press releases, any FDA submissions or registrations
- Outputs a one-page call prep: company background, their regulatory exposure from your DB, talking points tied to their specific products, objection handling
- Why: replaces 30-60 min of manual pre-call research
- Data: `web-research.mjs`, `scrape-page.mjs`, `query-supabase.mjs`

**Outreach follow-up tracker** — Nag system so nobody falls through the cracks.
- Track who was contacted, when, response status
- Remind after 3 days if no response noted
- Suggest next person on the list
- When a prospect responds, update status and suggest next action
- Data: simple table in Supabase or JSON file on Pi
- Posts reminders to `#anton`

#### Tier 4 — Revenue & retention (build when paying customers exist)

**Stripe trial monitor** — Daily revenue pulse.
- Schedule: daily cron, 8 AM ET → `#pc-alerts`
- Queries Stripe API (via helper script): MRR, active trials, days remaining per trial, failed payments
- Daily one-liner: "MRR: $198. 5 active trials (2 expire in <3 days). No failed payments."
- When trial expiring in ≤3 days: drafts personalized nudge email based on user's actual product count and email engagement from Supabase
- Implementation: `query-stripe.mjs` helper script (needs `STRIPE_SECRET_KEY` env var — use a restricted key)

**Subscriber product change detector** — Proactive customer success.
- Schedule: weekly cron
- Scrapes pilot companies' newsrooms / press release pages
- If company announced new product line, reformulation, or acquisition: posts to `#anton`
- Drafts proactive email: "We noticed AcmeFoods launched a new collagen line. Want to add monitoring for these products?"
- Why: feels like magic to the customer. This is what enterprise CSMs do manually.

#### Tier 5 — Strategic intelligence (build when competing for market share)

**Competitor website monitor** — Weekly diff of competitor sites.
- Schedule: weekly cron, Wednesday → `#anton`
- Scrapes pricing pages, feature pages, and blog indexes of: AgencyIQ, FoodChain ID, Registrar Corp, RegASK, SGS Digicomply, Redica Systems
- Diffs against last snapshot (store previous scrape in Supabase or local JSON)
- Posts changes: "Registrar Corp added 'AI-powered' to homepage. FoodChain ID changed pricing to $499/mo. SGS Digicomply published 3 new blog posts on MoCRA."
- Why: this is what Browse AI / Visualping charge $30-100/mo for

**Regulatory risk scorer** — Free tool / lead magnet.
- Trigger: Slack command with a company URL, e.g. "score https://acmefoods.com"
- Agent scrapes product pages, identifies what they sell, maps to your `product_categories`
- Queries Supabase for recent enforcement activity in those categories
- Returns risk score (low/medium/high) + brief: "This company sells 3 product types with high recent FDA activity. Most relevant: 4 warning letters on identity testing in supplements this quarter."
- Future: expose as a public web form on policycanary.io — fill in your URL, get a free risk report, captures email for the funnel
- Why: "free audit tool that feeds the sales pipeline" is a proven indie hacker pattern

**SEO gap finder** — Strategic content planning.
- Schedule: monthly cron
- Searches Google for target keywords (from seo-blog-post skill's 5 clusters)
- Scrapes top 5 results per keyword, identifies topics/questions they cover that your blog doesn't
- Posts content gap report: "No post on 'MoCRA compliance timeline' — competitor ranks #2. No post on 'FDA 483 response template' — 90 searches/mo."
- Why: goes beyond "write a blog post" to data-driven content strategy

---

## Troubleshooting

### Service won't start
```bash
ssh gr0x@10.2.0.40 journalctl -u anton.service --no-pager -n 50
# Common: missing ANTHROPIC_API_KEY in systemd env
```

### Cron job didn't fire
```bash
ssh gr0x@10.2.0.40 openclaw cron list   # Verify job exists + schedule
ssh gr0x@10.2.0.40 journalctl -u anton.service --since "9:00" --until "9:30"  # Check logs around fire time
```

### Scripts fail with auth errors
```bash
ssh gr0x@10.2.0.40 cat /home/gr0x/.openclaw/workspace/.env  # Verify keys present
# Test directly:
ssh gr0x@10.2.0.40 'cd ~/.openclaw/workspace && node scripts/query-supabase.mjs --days 1 --limit 1'
```

### Deploy changes not taking effect
```bash
# Restart the service after deploying new scripts/skills
ssh gr0x@10.2.0.40 sudo systemctl restart anton.service
```
