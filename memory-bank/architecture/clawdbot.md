---
Last-Updated: 2026-03-08
Maintainer: RB
Status: Active — Running on Vultr VPS. Pi 5 migration planned.
---

# Clawdbot Reference

Clawdbot is an OpenClaw-powered AI agent (Claude Sonnet) that handles content automation for Policy Canary. It runs as a systemd service, connects to Discord, and has cron-scheduled tasks for blog posts and LinkedIn drafts.

---

## Infrastructure

### Current: Vultr VPS
| Detail | Value |
|--------|-------|
| **Host** | Vultr `vc2-1c-2gb` (1 vCPU, 2GB RAM, $12/mo) |
| **IP** | `108.61.151.130` |
| **Instance ID** | `7f95a4c4-9e90-4438-b30c-2be85fa40fa3` |
| **OS** | Ubuntu 24.04, Node.js 22 |
| **Agent** | OpenClaw v2026.3.2, Claude Sonnet (`claude-sonnet-4-6`) |
| **Region** | `ewr` (US East) |
| **SSH** | `ssh root@108.61.151.130` |
| **Service** | `systemctl {start|stop|restart|status} openclaw.service` |
| **Logs** | `journalctl -u openclaw.service -f` |

### Planned: Raspberry Pi 5 (Primary)
| Detail | Value |
|--------|-------|
| **Hardware** | Pi 5, 16GB RAM, 2TB NVMe |
| **Role** | Primary host (8x RAM vs Vultr) |
| **Status** | Not yet set up |
| **Migration plan** | Set up Pi as primary → flip crons → Vultr becomes hot standby during move (~1 month) → Pi resumes after move |

### Key Architecture Notes
- All connections are **outbound** (Discord API, Supabase, Anthropic API, blog API) — no inbound ports, static IP, or DDNS needed
- Same Ubuntu + Node.js 22 + OpenClaw stack on both hosts
- Only ONE host should run crons at a time (avoid duplicate posts)
- `gateway.mode` must be `"local"` (required for headless operation)
- `agents.defaults.model` set to `"sonnet"` → resolves to `anthropic/claude-sonnet-4-6`

---

## Discord

### Bot
- **Name**: ClawdBot - Canary
- **App ID**: `1478649439420813335`
- **Server**: Bizniz (`1464751221112963355`)
- **Config**: `requireMention: false` on all channels

### Channels
| Channel | ID | Purpose |
|---------|-----|---------|
| `#clawdbot` | `1478667558931529881` | General chat with bot |
| `#weekly-roundup` | `1478651330011599044` | Weekly FDA roundup drafts |
| `#blog-drafts` | `1478651251381239952` | Blog post drafts |
| `#linkedin-drafts` | `1478651295924486195` | LinkedIn content drafts |
| `#alerts` | `1478651361573994549` | Urgent alerts (future) |

---

## Cron Jobs

All run on VPS as `openclaw` user. Managed via `openclaw cron {list|add|run|remove}`.

| Job | Schedule | Channel | Job ID |
|-----|----------|---------|--------|
| `weekly-roundup` | `0 9 * * 5` (Fri 9AM ET) | `#weekly-roundup` | `8c9ab46d-42c9-42e9-8a2d-004ef56a1fb4` |
| `seo-blog-tuesday` | `0 10 * * 2` (Tue 10AM ET) | isolated | `46026091-20fd-4fd0-87d9-a00e96dd64c5` |
| `linkedin-monday` | `0 10 * * 1` (Mon 10AM ET) | `#linkedin-drafts` | `828d9ced-d7f7-4dce-afa8-c69073ddf2db` |
| `linkedin-wednesday` | `0 10 * * 3` (Wed 10AM ET) | `#linkedin-drafts` | `59f169a4-b247-4b62-abad-65960d90a745` |
| `lead-finder` | `0 8 * * 1` (Mon 8AM ET) | `#alerts` | `e864807e-0378-46a7-ad12-9338883fb1d1` |

### Manual trigger
```bash
ssh root@108.61.151.130
su - openclaw -c 'openclaw cron run <jobId>'
```

---

## Skills (on VPS)

Skills are markdown instruction files that tell Clawdbot how to perform complex multi-step tasks.

| Skill | Location (VPS) | Source (repo) | Purpose |
|-------|---------------|---------------|---------|
| **weekly-roundup** | `skills/weekly-roundup/SKILL.md` | `scripts/clawdbot/skills/weekly-roundup/SKILL.md` | Friday roundup: query week's data, research, draft blog post, post to Discord |
| **seo-blog-post** | `skills/seo-blog-post/SKILL.md` | `scripts/clawdbot/skills/seo-blog-post/SKILL.md` | Tuesday SEO post: keyword-targeted, data-driven, charts + images |
| **linkedin-post** | `skills/linkedin-post/SKILL.md` | `scripts/clawdbot/skills/linkedin-post/SKILL.md` | Mon/Wed LinkedIn drafts: repurpose blog content, copy/paste workflow |
| **lead-finder** | `skills/lead-finder/SKILL.md` | `scripts/clawdbot/skills/lead-finder/SKILL.md` | Monday leads: companies cited in FDA enforcement that aren't subscribers, with draft outreach |

---

## Scripts (on VPS)

Helper scripts in `/home/openclaw/.openclaw/workspace/scripts/`. Source in `scripts/clawdbot/`.

### Data Access
| Script | Purpose | Key Flags | API |
|--------|---------|-----------|-----|
| `query-supabase.mjs` | Individual enriched regulatory items | `--days N`, `--enriched-only`, `--summary`, `--type TYPE`, `--limit N` | Supabase |
| `query-analytics.mjs` | Aggregate trends, stats, comparisons | `--report {weekly|trends|substances|allergens|categories|deadlines|recalls|substance-detail|all}`, `--days N`, `--substance NAME` | Supabase |
| `query-blog.mjs` | Published blog posts | `--not-promoted` (fresh for LinkedIn), `--slug SLUG` (full content), `--limit N` | Supabase |
| `query-leads.mjs` | Companies in recent enforcement not yet subscribers | `--days N`, `--type {warning_letter|recall}`, `--include-subscribers` | Supabase |

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

### Publishing
| Script | Purpose | Key Flags | API |
|--------|---------|-----------|-----|
| `publish-blog.mjs` | Publish to policycanary.io/blog | `--title`, `--slug`, `--content-file`, `--category`, `--excerpt`, `--status`, `--cover-image-url` | POST `/api/blog` |
| `upload-image.mjs` | Upload images to Supabase Storage | `--file PATH`, `--slug SLUG` | Supabase Storage (`blog-images` bucket) |
| `mark-linkedin-promoted.mjs` | Mark blog post as LinkedIn-promoted | `--slug SLUG` | Supabase |

---

## Security (Hardened 2026-03-08)

### Known OpenClaw Risks
- **`openclaw update` / `openclaw doctor`** resolve `${ENV_VAR}` references and write plaintext keys back to `openclaw.json`. Never run these without backing up config first.
- **API keys injected into LLM prompt context** — the runtime model catalog (with resolved keys) is serialized into every system prompt.
- **Session transcripts** (`agents/main/sessions/*.jsonl`) can capture secrets if the agent reads or outputs them. 20 transcript files exist on VPS.
- **Sandbox TOCTOU bypass** (Snyk GHSA-F7WW-2725-QVW2) — symlink rebinding can escape sandbox even when enabled.
- **Prompt injection via Discord** — `requireMention: false` means anyone in the server can interact and potentially trick the agent into reading/outputting secrets.

### Hardening Applied
| Change | Status |
|--------|--------|
| Dedicated Supabase secret key (`clawdbot` — `sb_secret_*`) | Done — separate from production key, independently rotatable |
| Legacy `service_role` JWT removed from VPS | Done — no longer in `.env` |
| `.env` and `openclaw.json` permissions → `600` | Done |
| Session transcript dir → `700`, files → `600` | Done |
| `openclaw` removed from docker group | Done |
| Scripts use `SUPABASE_SECRET_KEY` (fallback to legacy name) | Done |

### Still TODO (Pi 5 Setup)
- Move secrets into root-owned `/etc/openclaw/secrets.env` (`0600` root:root), loaded via systemd `EnvironmentFile=`. Agent process inherits env vars but cannot read the file.
- Pin OpenClaw to specific version (not `@latest`)
- Enable sandbox mode (imperfect but raises the bar)
- Consider outbound firewall (allow only api.anthropic.com, discord.com, Supabase URL, policycanary.io)
- Consider `requireMention: true` on `#clawdbot` channel
- Scope Supabase key when Supabase adds key-level permissions

### Key Rotation
If a key is compromised:
1. Revoke the `clawdbot` key in Supabase dashboard → production app is unaffected
2. Create a new secret key, update VPS `.env`, restart service
3. Rotate Anthropic/Tavily/ScrapingDog keys in their respective dashboards
4. Clear session transcripts: `rm /home/openclaw/.openclaw/agents/main/sessions/*.jsonl`

---

## Environment Variables (on VPS)

### Workspace `.env` (`/home/openclaw/.openclaw/workspace/.env`)
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
| `SUPABASE_SECRET_KEY` (sb_secret_*) | VPS only (Clawdbot scripts) | Dedicated key — revoke without affecting production |
| `SUPABASE_SERVICE_ROLE_KEY` (legacy JWT) | Vercel only (Next.js app) | Production app — NOT on VPS |

---

## File Locations

### On VPS
```
/home/openclaw/.openclaw/
  openclaw.json              # OpenClaw config (Discord, model, cron)
  workspace/
    .env                     # API keys for scripts
    scripts/                 # All .mjs helper scripts
    skills/
      weekly-roundup/SKILL.md
      seo-blog-post/SKILL.md
      linkedin-post/SKILL.md
```

### In Repo
```
scripts/clawdbot/
  setup-clawdbot.sh          # Provisioning automation (provision|deploy|configure|cron|ssh|status|all)
  cloud-init.yaml            # VPS bootstrap (Ubuntu packages, Node.js, OpenClaw install)
  .vultr-instance-id         # Stored Vultr instance ID
  query-supabase.mjs
  query-analytics.mjs
  query-blog.mjs
  web-research.mjs
  scrape-page.mjs
  generate-chart.mjs
  generate-image.mjs
  publish-blog.mjs
  upload-image.mjs
  mark-linkedin-promoted.mjs
  query-leads.mjs
  skills/
    weekly-roundup/SKILL.md
    seo-blog-post/SKILL.md
    linkedin-post/SKILL.md
    lead-finder/SKILL.md
```

---

## Deployment

### Deploy scripts to VPS
```bash
scp scripts/clawdbot/*.mjs root@108.61.151.130:/home/openclaw/.openclaw/workspace/scripts/
```

### Deploy skills to VPS
```bash
scp -r scripts/clawdbot/skills/* root@108.61.151.130:/home/openclaw/.openclaw/workspace/skills/
```

### Restart after config changes
```bash
ssh root@108.61.151.130 systemctl restart openclaw.service
```

### Full provisioning (new host)
```bash
./scripts/clawdbot/setup-clawdbot.sh all
# Steps: provision → wait → deploy → configure → cron → start
```

---

## Content Workflow

### Weekly Roundup (Friday)
1. Cron fires 9 AM ET → Clawdbot runs `weekly-roundup` skill
2. Queries this week's enriched items + analytics
3. Researches lead story externally (Tavily)
4. Generates charts (QuickChart) + optional hero image (Gemini)
5. Drafts 1,000-1,500 word blog post
6. Posts draft to `#weekly-roundup` on Discord
7. RB reviews → says "publish" → Clawdbot publishes via `/api/blog`

### SEO Blog Post (Tuesday)
1. Cron fires 10 AM ET → Clawdbot runs `seo-blog-post` skill
2. Picks keyword cluster (rotates through 5: warning letters, recalls, supplement enforcement, MoCRA, food safety)
3. Queries relevant data + researches competing content
4. Generates charts + hero image
5. Writes 1,000-2,000 word SEO-optimized post
6. Posts draft to Discord for review → publish on approval

### LinkedIn (Monday + Wednesday)
1. Cron fires 10 AM ET → Clawdbot runs `linkedin-post` skill
2. Checks `--not-promoted` blog posts for fresh content
3. Drafts LinkedIn post (4 formats: Data Hook, Listicle Tease, Hot Take, Did You Know)
4. Posts to `#linkedin-drafts` on Discord
5. RB copies/pastes into LinkedIn natively (no API)
6. RB confirms → Clawdbot runs `mark-linkedin-promoted.mjs`

---

## Planned Capabilities

### Inngest Integration (Next)
Give Clawdbot access to trigger Vercel-hosted pipeline functions via Inngest events. One env var (`INNGEST_EVENT_KEY`) + a small helper script enables:

- **"Run enrichment"** → send `pipeline/enrich.requested` event
- **"Trigger daily ingest"** → send event for `daily-ingest` function
- **"Send weekly emails"** → hit `/api/email/send-weekly` (already proven pattern with `/api/blog`)
- **Pipeline status queries** → already possible via `query-supabase.mjs`

Implementation: add `trigger-inngest.mjs` helper script, new skill for pipeline control from Discord.

### Pi 5 Migration
1. Install Ubuntu Server (ARM64) + Node.js 22 + OpenClaw on Pi
2. Adapt `setup-clawdbot.sh` for local provisioning (skip Vultr API calls)
3. Copy same `.env`, config, scripts, skills
4. Verify all crons fire correctly
5. Disable crons on Vultr, enable on Pi
6. Keep Vultr as hot standby (especially during ~1 month move)

### Monitoring Stack (Clawdbot + Sentry + PostHog + Inngest)

Clawdbot is NOT a replacement for proper monitoring. Each tool has its lane:

| Concern | Tool | Why |
|---------|------|-----|
| Code errors, crashes, exceptions | **Sentry** | Stack traces, source maps, alerts. Catches what Vercel logs bury. |
| Pipeline health, data quality, business metrics | **Clawdbot watchdog** | Business logic that no error tracker understands. |
| User behavior, funnels, analytics | **PostHog** | Already instrumented (project 334096, Pilot Monitoring dashboard). |
| Pipeline job status, retries | **Inngest dashboard** | Built-in. Shows cron runs, failures, retries. |

Sentry: free tier (5K errors/mo), Next.js + Vercel integration. RB setting up separately.

### Future Skills — Prioritized Roadmap

#### Tier 1 — Ops (build first, prevents silent failures)

**Pipeline watchdog** — Daily health check, posts to `#alerts` every morning.
- Items ingested last 24h (by type: FR, enforcement, WL, RSS)
- Enrichment success/failure rate
- Email delivery/bounce/open stats (from `email_sends` table)
- Any data source that returned 0 items (broken fetcher?)
- Upcoming deadlines in next 7 days
- Simple pass/fail: "All systems nominal" or "WARNING: RSS fetcher returned 0 items in 48h"
- Data: `query-analytics.mjs --report all`, plus new queries for email stats and fetcher recency
- Schedule: daily cron, 7 AM ET → `#alerts`

**Pipeline control** — Trigger Vercel pipeline functions from Discord.
- "Run enrichment" → Inngest event `pipeline/enrich.requested`
- "Trigger daily ingest" → Inngest event for `daily-ingest`
- "Send weekly emails" → hit `/api/email/send-weekly`
- "Pipeline status" → query Supabase for latest run timestamps
- Implementation: `trigger-inngest.mjs` helper (needs `INNGEST_EVENT_KEY` env var), new skill
- Turns Discord (phone) into ops console

#### Tier 2 — Customer awareness (build when pilots start)

**New signup briefer** — Fires when a new user completes onboarding.
- Trigger: periodic Supabase poll (every 30 min) or Inngest event from onboarding API
- Posts to `#alerts`: "New user: Jane Smith, AcmeFoods, QA Manager. Added 3 products (soy protein bar, almond butter, oat milk). 14 relevant items in last 30 days. Top match: FDA warning letter on soy protein identity testing."
- Data: `users` + `subscriber_products` + `product_verdicts` tables
- Why: situational awareness on every customer without logging into Supabase

**Customer health pulse** — Weekly roll-up of subscriber engagement.
- Who's active (opened emails, visited app)
- Who hasn't opened emails in 2+ weeks
- Who added/removed products this week
- Trial expirations coming up
- Data: `email_sends` (opened_at, clicked_at), `subscriber_products`, `users` (trial_ends_at)
- Schedule: weekly cron, Monday 8 AM ET → `#clawdbot`
- Why: the CRM you don't have time to check

#### Tier 3 — Data quality (build when data volume grows)

**Enrichment QA sampler** — Weekly quality spot-check.
- Pull 5 random enriched items from the past week
- Evaluate: are product categories correct? Are substances tagged? Is urgency calibrated? Do action items make sense?
- Score each 1-5, post scorecard to `#clawdbot`
- Flag anything scoring < 3 for manual review
- Could compare against golden test fixtures for regression detection
- Schedule: weekly cron, Sunday 10 AM ET

**Data gap finder** — Weekly data hygiene report.
- Items with 0 substance tags (should have some)
- Items with 0 product category tags
- Product categories with 0 items in last 30 days (broken fetcher or coverage gap?)
- Source URLs that 404 (link rot)
- Enrichments with empty action_items where urgency > medium
- Schedule: weekly cron, Sunday 11 AM ET → `#alerts`

#### Tier 4 — Sales & prospecting (build alongside outreach)

**Prospect research** — Drop a company name in Discord, get a full account brief.
- Trigger: Discord command, e.g. "research AcmeFoods"
- Agent scrapes company website, checks FDA Establishment Registration database
- Queries Supabase for regulatory items matching their likely product categories
- Searches web for recent 483 observations, warning letters, or recalls involving the company
- Posts structured "Account Brief" to `#clawdbot`: company size, key products, recent FDA activity affecting them, risk exposure from your database, draft outreach email referencing specific items
- Why: turns cold outreach into warm outreach — you're showing prospects their own risk using data you already have
- Data: `web-research.mjs`, `scrape-page.mjs`, `query-supabase.mjs`, `query-analytics.mjs`

**Warning letter lead finder** — Sell the umbrella while it's raining.
- Schedule: weekly cron, Monday morning → `#clawdbot`
- Agent queries recent warning letters and 483 observations from Supabase
- Cross-references cited companies against `users` table — are they already a subscriber?
- If NOT a subscriber: posts lead alert with company name, violation type, their product categories, and a draft cold email referencing the specific enforcement action
- Why: companies that just got hit by FDA are the most motivated buyers of regulatory monitoring. This is the highest-intent lead source you have.
- Data: `query-supabase.mjs --type warning_letter`, `users` table, `web-research.mjs` for company details

**Meeting prep** — One command before a sales call.
- Trigger: Discord command, e.g. "prep AcmeFoods" or "prep Jane Smith"
- Agent runs prospect research workflow, plus: searches for the specific contact on LinkedIn, recent company press releases, any FDA submissions or registrations
- Outputs a one-page call prep: company background, their regulatory exposure from your DB, talking points tied to their specific products, objection handling
- Why: replaces 30-60 min of manual pre-call research
- Data: `web-research.mjs`, `scrape-page.mjs`, `query-supabase.mjs`

**Outreach follow-up tracker** — Nag system so nobody falls through the cracks.
- Track who was contacted, when, response status
- Remind after 3 days if no response noted
- Suggest next person on the list
- When a prospect responds, update status and suggest next action
- Data: simple table in Supabase or JSON file on VPS
- Posts reminders to `#clawdbot`

#### Tier 5 — Revenue & retention (build when paying customers exist)

**Stripe trial monitor** — Daily revenue pulse.
- Schedule: daily cron, 8 AM ET → `#alerts`
- Queries Stripe API (via helper script): MRR, active trials, days remaining per trial, failed payments
- Daily one-liner: "MRR: $198. 5 active trials (2 expire in <3 days). No failed payments."
- When trial expiring in ≤3 days: drafts personalized nudge email based on user's actual product count and email engagement from Supabase
- Implementation: `query-stripe.mjs` helper script (needs `STRIPE_SECRET_KEY` env var — use a restricted key)

**Subscriber product change detector** — Proactive customer success.
- Schedule: weekly cron
- Scrapes pilot companies' newsrooms / press release pages
- If company announced new product line, reformulation, or acquisition: posts to `#clawdbot`
- Drafts proactive email: "We noticed AcmeFoods launched a new collagen line. Want to add monitoring for these products?"
- Why: feels like magic to the customer. This is what enterprise CSMs do manually.

#### Tier 6 — Strategic intelligence (build when competing for market share)

**Competitor website monitor** — Weekly diff of competitor sites.
- Schedule: weekly cron, Wednesday → `#clawdbot`
- Scrapes pricing pages, feature pages, and blog indexes of: AgencyIQ, FoodChain ID, Registrar Corp, RegASK, SGS Digicomply, Redica Systems
- Diffs against last snapshot (store previous scrape in Supabase or local JSON)
- Posts changes: "Registrar Corp added 'AI-powered' to homepage. FoodChain ID changed pricing to $499/mo. SGS Digicomply published 3 new blog posts on MoCRA."
- Why: this is what Browse AI / Visualping charge $30-100/mo for

**Regulatory risk scorer** — Free tool / lead magnet.
- Trigger: Discord command with a company URL, e.g. "score https://acmefoods.com"
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
journalctl -u openclaw.service --no-pager -n 50
# Common: missing ANTHROPIC_API_KEY in systemd env
```

### Cron job didn't fire
```bash
su - openclaw -c 'openclaw cron list'   # Verify job exists + schedule
journalctl -u openclaw.service --since "9:00" --until "9:30"  # Check logs around fire time
```

### Scripts fail with auth errors
```bash
cat /home/openclaw/.openclaw/workspace/.env  # Verify keys present
# Test directly:
su - openclaw -c 'cd ~/.openclaw/workspace && node scripts/query-supabase.mjs --days 1 --limit 1'
```

### Deploy changes not taking effect
```bash
# Restart the service after deploying new scripts/skills
systemctl restart openclaw.service
```
