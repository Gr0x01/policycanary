# Content Marketing Plan: Policy Canary

**Created:** 2026-03-04
**Status:** Draft — thinking through strategy before building

---

## The Idea

We're already parsing, enriching, and classifying FDA regulatory data (warning letters, Federal Register rules, enforcement actions, RSS feeds). That data is the raw material for a content marketing engine that builds authority, drives organic traffic, and feeds the free Weekly Update email.

The plan: automate content drafting with Clawdbot (OpenClaw) on a Vultr VPS, review/edit from Discord on mobile, publish to a blog section on policycanary.io.

---

## Why This Works

1. **Data advantage** — We ingest and enrich data that most content creators read manually. We can publish faster, more consistently, and with structured analysis nobody else has.
2. **SEO compounding** — Every blog post is a long-tail keyword target. "FDA warning letter [company name]" gets searched after every WL drops. We can be the first credible analysis.
3. **Authority building** — Consistent, data-driven FDA analysis positions Policy Canary as the expert voice in the space. Buyers trust brands that demonstrate knowledge before asking for money.
4. **Funnel** — Blog post (organic traffic) → email signup CTA → free Weekly Update → convert to paid Monitor tier.

---

## Content Types

| Type | Source Data | Cadence | Length | Example |
|------|-----------|---------|--------|---------|
| **Weekly FDA Roundup** | All enriched items from the week | Weekly (Friday) | 800-1,200 words | "FDA Week in Review: March 3-7, 2026" |
| **Warning Letter Deep Dive** | Single enriched WL with full text | 1-2x/week (when interesting WLs land) | 600-1,000 words | "What Went Wrong at [Company]: FDA Warning Letter Breakdown" |
| **Regulatory Trend Piece** | Aggregated enrichment tags (action types, product types, substances) | 2x/month | 1,000-1,500 words | "We Analyzed 422 FDA Warning Letters. Here Are the 5 Most Common Violations." |
| **Breaking Analysis** | High-severity enriched item (new rule, major recall, policy shift) | As needed (maybe 2-4x/month) | 400-800 words | "What the FDA's BHA Decision Means for Your Products" |

### Content That Works for Each Channel

**Blog (SEO, long-form)**
- All four types above
- Optimized for search: "FDA warning letter [company]", "FDA [substance] ban", "[regulation] compliance requirements"
- Every post ends with signup CTA

**LinkedIn (authority, short-form)**
- Condensed versions of blog posts (3-5 paragraphs)
- Data nuggets: single stats or trend observations from enrichment data
- Hot takes on breaking regulatory news (speed matters here)
- 3-5 posts/week

**Free Weekly Update Email (retention, conversion)**
- Same content as the Weekly Roundup blog post
- Two distribution channels, one piece of content
- Email drives opens/engagement, blog drives organic traffic

---

## The Clawdbot Setup

### Infrastructure

- **Vultr VPS**: Ubuntu 24.04, Docker, $6-12/mo
- **OpenClaw (Clawdbot)**: Self-hosted AI agent
- **Model**: Claude (Anthropic API key) for writing quality
- **Channel**: Discord
- **Data source**: Supabase (reads enriched regulatory items)
- **Publishing target**: policycanary.io/blog (Supabase `blog_posts` table or similar)

### Discord Channel Structure

```
#blog-drafts       — Full blog post drafts for review
#linkedin-drafts   — Short-form LinkedIn post drafts
#weekly-roundup    — Friday roundup drafts
#alerts            — Clawdbot pings when something big drops
```

### Automated Skills (Cron)

| Skill | Schedule | What It Does |
|-------|----------|-------------|
| `weekly-roundup` | Friday morning | Query week's enriched items → draft roundup → post to #weekly-roundup |
| `daily-scan` | Daily morning | Scan new enriched items → if notable, draft LinkedIn post → post to #linkedin-drafts |
| `wl-deep-dive` | On new WL enrichment (or daily check) | Pick interesting WLs → draft deep dive → post to #blog-drafts |
| `data-nugget` | Mon/Wed/Fri | Pull trend stat from enrichment tags → draft short LinkedIn post → post to #linkedin-drafts |

### The Mobile Review Workflow

```
Clawdbot posts draft to Discord channel
  ↓
You read on phone (notification or browse when convenient)
  ↓
Option A: "looks good, publish" → Clawdbot publishes
Option B: "make the intro punchier" → Clawdbot revises in thread → you approve
Option C: "skip this one" → Clawdbot archives
  ↓
Published to blog and/or LinkedIn
```

Key: Clawdbot learns your voice over time (persistent memory). Early on, more edits. Over time, drafts get closer to your style with fewer revisions needed.

---

## Blog on policycanary.io

### What We Need (High Level)

- `/blog` — index page with article cards, filterable by category
- `/blog/[slug]` — individual article pages with clean long-form typography
- Content stored in Supabase (so clawdbot can write to it)
- Markdown content rendered to HTML
- CTA (email signup) at the bottom of every post
- RSS feed for syndication
- "Blog" link in the site header nav

### What We Don't Need (MVP)

- No admin UI (clawdbot manages content via Supabase directly)
- No comments
- No author profiles (solo project)
- No image management
- No related articles

### Categories

- **Weekly Roundup** — the Friday digest
- **Warning Letter Analysis** — deep dives on specific WLs
- **Regulatory Trends** — data-driven pieces from aggregated enrichment data
- **Breaking Analysis** — fast-turn explainers on major news

---

## LinkedIn Publishing

### Dual Voice Strategy

Clawdbot manages two LinkedIn presences with distinct voices:

**Personal Account (RB)**
- Voice: Founder perspective. Opinionated, first-person, conversational. "I've been reading FDA warning letters every day for 6 months. Here's what I keep seeing..."
- Purpose: Builds personal brand, thought leadership. Personal accounts get 5-10x the organic reach of company pages on LinkedIn.
- Content: Hot takes, lessons learned, founder journey, "here's what surprised me in this week's data"
- Tone: Smart friend at a bar explaining FDA stuff. Casual authority.

**Policy Canary Company Page**
- Voice: Brand perspective. Authoritative, data-forward, polished. "This week: 3 new warning letters, 2 proposed rules, and a trend that supplement brands need to watch."
- Purpose: Brand building, SEO backlinks, company credibility for buyers doing due diligence.
- Content: Data-driven insights, product announcements, weekly summaries, trend reports
- Tone: The smart analyst you trust with your regulatory monitoring.

### Cross-Posting Strategy

- Same underlying data, different framing
- Personal post links to company page or blog for depth
- Company page shares data/analysis, personal account shares perspective/opinion
- Clawdbot drafts both versions in separate Discord channels: `#linkedin-personal` and `#linkedin-company`

### Publishing (Phased)

**Phase 1: Manual copy-paste from Discord**
- Clawdbot drafts in Discord, you copy/paste to LinkedIn app on phone
- Simple, no API integration needed
- Good enough while validating the content strategy

**Phase 2: LinkedIn API integration (later)**
- Clawdbot publishes directly via LinkedIn API on "ship it" command
- Requires OAuth setup for both personal + company page
- Build this only after the manual workflow is validated

### LinkedIn Content Format

**Personal posts:**
- First-person hook ("I just read an FDA warning letter that made me rethink...")
- 3-5 short paragraphs, conversational
- End with a question to drive comments
- Hashtags: #FDA #supplements #foodsafety #regulatory #founderlife

**Company posts:**
- Data-driven hook ("73% increase in CGMP violations. Here's the breakdown.")
- Structured with bullet points or numbered lists
- End with CTA to blog post or signup
- Hashtags: #FDAcompliance #MoCRA #regulatoryintelligence #foodsafety

---

## What Needs to Happen (Rough Order)

### Phase 1: Blog Section on Website
- [ ] Supabase table for blog posts
- [ ] `/blog` and `/blog/[slug]` routes
- [ ] Markdown rendering
- [ ] Header nav update
- [ ] RSS feed
- [ ] Seed 2-3 manually written posts to launch with content (not an empty blog)

### Phase 2: Clawdbot on Vultr
- [ ] Vultr VPS setup (Ubuntu 24.04, Docker)
- [ ] OpenClaw install + Discord channel connection
- [ ] Configure Anthropic API key + Supabase credentials
- [ ] Build `weekly-roundup` skill (first skill, proves the workflow)
- [ ] Test the draft → Discord review → publish loop

### Phase 3: Expand Skills
- [ ] `wl-deep-dive` skill
- [ ] `daily-scan` + `data-nugget` skills for LinkedIn
- [ ] `breaking-analysis` skill (triggered by high-severity items)
- [ ] Tune prompts based on editing patterns

### Phase 4: Consultant Relationship
- [ ] Identify 3-5 target consultants (EAS, FDAImports, Lachman, independents on LinkedIn)
- [ ] Initial outreach — "I'm building a product-level FDA monitoring tool, would you review it for accuracy?"
- [ ] Paid product review session (3-4 hrs)
- [ ] Incorporate feedback into enrichment prompts + content voice
- [ ] Set up monthly output review cadence
- [ ] Discuss referral arrangement once they've seen the product working

### Phase 5: LinkedIn Automation (Optional)
- [ ] LinkedIn API integration for direct publishing (personal + company)
- [ ] Or keep manual copy-paste if it works fine

---

## Content Voice & Positioning

**Tone:** Authoritative but accessible. Not academic, not breathless. Think "smart colleague who reads all the FDA stuff so you don't have to."

**What we are:** The people who read the fine print and tell you what it means for your products.

**What we're not:** A newsletter. A news aggregator. A law firm blog.

**Differentiators in content:**
- We cite specific data (enforcement stats, WL counts, substance analysis) because we have it in our DB
- We connect dots across sources (a WL + a proposed rule + a recall = a trend)
- We make it actionable ("here's what to check in your facility")
- We name specific substances and product types (not vague "supplements may be affected")

---

## Consultant Relationship

### The Idea

Pay a regulatory consultant to review the product and validate output quality on an ongoing basis. This serves three purposes:

1. **Quality assurance** — monthly review of a sample of enriched outputs and blog content ensures we're not publishing garbage or misinterpreting regulations
2. **Credibility** — "reviewed by [consultant name], [credentials]" on content adds authority
3. **Referral pipeline** — the consultant sees the product working, trusts it, and recommends it to their clients

### Structure

**Initial engagement: Product review**
- 3-4 hours of consultant time (~$500-$1,200, already budgeted in project brief)
- Show them the app, sample intelligence emails, sample blog output
- Key question: "Is this accurate? Would your clients find this useful?"
- Get specific feedback on enrichment quality, action item accuracy, regulatory nuance

**Ongoing: Monthly output review**
- Consultant reviews a sample of outputs (~10-15 enriched items + 2-3 blog posts)
- ~1-2 hours/month ($150-$500/mo)
- Flags inaccuracies, suggests improvements, confirms we're interpreting regulations correctly
- Feedback loops back into prompt tuning (clawdbot drafts, enrichment prompts)

**The referral angle:**
- Consultant sees real value → recommends to clients naturally
- Offer referral commission or affiliate deal (e.g., 20% of first 3 months)
- Their clients are EXACTLY our target buyer (small-mid supplement/food/cosmetics brands)
- This is the cheapest, highest-signal customer acquisition channel

### Who to Target

- EAS Consulting Group, FDAImports, Lachman Consultants (already identified as potential partners in project brief)
- Independent consultants with active LinkedIn presence in FDA/supplement/cosmetics space
- Someone who works with 10-50 small brands = 10-50 warm introductions

### Budget

| Item | Cost |
|------|------|
| Initial product review | $500-$1,200 (one-time) |
| Monthly output review | $150-$500/mo |
| Referral commissions | ~$60-$90 per referral (20% of $99 x 3 months) |

Worth it. One consultant who brings 5 clients pays for themselves. And the quality feedback makes the product better for everyone.

---

## SEO Keyword Research (DataForSEO, March 2026)

### Key Finding
**40 of 71 tested keywords have ZERO search volume** — including everything that describes our product category directly ("FDA regulatory monitoring", "FDA compliance monitoring tool", "ingredient compliance monitoring"). Nobody is searching for what we build by name. SEO must target **what they're already searching for**, not what we are.

### High-Value Keyword Clusters

| Cluster | Keywords | Vol | CPC | Strategy |
|---------|----------|-----|-----|----------|
| **FDA Warning Letters** | "FDA warning letter" (5,400), "FDA warning letter database" (480) | 5,880 | $11-13 | Deep-dive analysis posts per notable WL. Public searchable WL page. |
| **FDA Recalls** | "FDA recall list" (4,400), "food recall FDA" (2,900) | 7,300 | $2-3 | Weekly recall recap posts from enriched data. |
| **MoCRA** | "MoCRA FDA" (210), "MoCRA registration" (170), "MoCRA requirements" (70), "MoCRA compliance" (50) | 500 | $3-5 | Deadline-driven content. Evergreen guides. Time-sensitive = high conversion. |
| **Supplement Regulations** | "FDA supplement regulations" (480), "FDA 483 observations" (90) | 570 | $8-9 | Enforcement pattern analysis. CGMP deep-dives. |
| **Food Additives/Bans** | "FDA red 40 ban" (40), "FDA banned ingredients" (20) | 60 | $0 | Low volume but EXACT target buyer. Ingredient-specific posts. |
| **Consultant Adjacent** | "FDA regulatory consultant" (40) | 40 | $21.67 | Highest CPC = highest intent. Content targeting people looking for consultant alternatives. |

### Zero-Volume Keywords (Don't Target These)
FDA regulatory monitoring, FDA regulatory intelligence, FDA regulatory alerts, FDA compliance monitoring tool, supplement product monitoring, ingredient compliance monitoring, product recall monitoring, regulatory risk monitoring, affordable FDA compliance, FDA compliance cost

### SEO Content Strategy
1. **Warning letter analysis** = rank for "FDA warning letter" cluster (5,400 vol, $11.78 CPC)
2. **Recall recaps** = rank for "FDA recall list" / "food recall FDA" (7,300 combined vol)
3. **MoCRA guides** = deadline-driven, high conversion intent
4. **Public warning letter database page** = rank for "FDA warning letter database" (480 vol, $12.95 CPC) — our enriched data IS this
5. **483 observation analysis** = rank for "FDA 483 observations" (90 vol, $9.31 CPC)

### Blog Post to Conversion Funnel
Blog post (organic) -> "Policy Canary monitors this for YOUR products" CTA -> email signup -> free weekly update -> trial -> paid

---

## Open Questions

1. ~~**Blog design**~~ — DONE. Consistent with marketing site.
2. ~~**Seed content**~~ — DONE. Clawdbot + weekly roundup live.
3. **Content calendar** — should clawdbot maintain a content calendar in Supabase? Or just react to incoming data?
4. **Cover images** — generate with AI (DALL-E/Midjourney)? Use stock? Skip images entirely for MVP?
5. **Byline** — RB's name on personal LinkedIn, "Policy Canary" on company posts and blog?
6. **Consultant selection** — who specifically? Need to research active FDA consultants on LinkedIn who work with small supplement/food brands.
7. **Consultant review format** — structured rubric (accuracy score, nuance score) or freeform feedback?
8. **Public warning letter database** — high-SEO-value page. Build as /app/warnings public view? Or /resources/warning-letters?

---

## Cost Estimate

| Item | Cost | Frequency |
|------|------|-----------|
| Vultr VPS (OpenClaw) | $6-12 | Monthly |
| Anthropic API (content drafting) | $10-30 | Monthly |
| Consultant: initial product review | $500-$1,200 | One-time |
| Consultant: monthly output review | $150-$500 | Monthly |
| Referral commissions | ~$60-$90 per referral | Per conversion |
| LinkedIn API | Free | — |
| **Monthly ongoing** | **$166-$542/mo** | |
| **One-time setup** | **$500-$1,200** | |

The consultant cost is the biggest line item but also the highest-ROI: quality assurance + credibility + referral pipeline. One referred client paying $99/mo covers the consultant's monthly fee.
