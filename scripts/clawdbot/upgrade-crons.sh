#!/bin/bash
# Upgrade Anton's cron jobs with context-aware prompts
# Run on Pi: bash upgrade-crons.sh
#
# This removes existing crons and re-adds them with new prompts that give
# Anton decision authority over what to work on when each cron fires.

set -e

echo "=== Removing existing cron jobs ==="
echo "NOTE: 'openclaw cron remove' requires job IDs, not names."
echo "Run 'openclaw cron list' first, then remove each old job by ID:"
echo "  openclaw cron remove <job-id>"
echo ""
echo "Skipping automatic removal — add new jobs below."
echo "(Clean up old duplicates manually after verifying new jobs work.)"

echo ""
echo "=== Adding upgraded cron jobs ==="

# --- Nightly Review (11PM ET) ---
openclaw cron add \
  --name "nightly-review" \
  --cron "0 23 * * *" \
  --tz "America/New_York" \
  --session isolated \
  --message "NIGHTLY REVIEW — End of day operations.

1. Read SESSION-STATE.md. Extract any entries from 'Corrections This Session' and 'Decisions Made Today' into TACIT.md (Autonomy Patterns section). Format: - [date] [situation] → [what I did] → [outcome] → [lesson]

2. Business pulse:
   - node scripts/query-analytics.mjs --report weekly --days 1
   - Any anomalies? (0 items ingested on a weekday = flag it)
   - node scripts/posthog.mjs events --project pc --days 1 (check for signups, page views)

3. Summarize to #anton: items ingested today, content published, autonomous decisions made, anomalies detected. Keep it to 3-5 lines.

4. Reset SESSION-STATE.md: clear Decisions, Corrections, Business State. Keep In-Progress Work items. Update Business State with tonight's pulse results.

5. Check tomorrow's day of week. If a cron is scheduled (Mon=lead-finder+linkedin, Tue=seo-blog, Wed=linkedin, Fri=roundup), note relevant prep context in SESSION-STATE.md Current Focus. Example: if tomorrow is Friday, check how many enriched items this week so the roundup cron has a head start.

6. Run the nightly-review skill (knowledge graph update, memory decay) as normal." \
  --announce --channel slack --to "channel:C0AJX2E8087"

# --- Weekly Roundup (Fri 9AM ET) ---
openclaw cron add \
  --name "weekly-roundup" \
  --cron "0 9 * * 5" \
  --tz "America/New_York" \
  --session isolated \
  --message "WEEKLY ROUNDUP — Friday content production.

Read SESSION-STATE.md for any prep context from last night's review.

Step 1: Assess the week's data.
- node scripts/query-analytics.mjs --report all --days 7
- node scripts/query-supabase.mjs --days 7 --enriched-only --summary

Step 2: Make a call.
- If >= 5 enriched items this week: run the weekly-roundup skill as normal. Good data week.
- If 3-4 items: still do a roundup, but supplement with historical trend analysis from query-analytics. Thin weeks need more context.
- If < 3 items: pivot. Don't write a thin roundup. Instead, pick the most interesting single item and write a deep-dive analysis piece. Or check query-intelligence.mjs --status needs_refresh for an intelligence page worth updating. Post your reasoning to #anton.

Step 3: Whatever you write, verify it.
- Save draft to /tmp/draft-content.md
- node scripts/verify-content.mjs --content-file /tmp/draft-content.md --content-type blog --verbose
- If confidence >= 90 and 0 errors: post to #pc-content for Rashaad to review
- If errors: fix them, re-verify (max 2 attempts). If still failing, post draft WITH verification report for manual review.

Step 4: Draft Monday's LinkedIn post promoting the roundup (use linkedin-post skill format).

Update SESSION-STATE.md with what you produced and verification results." \
  --announce --channel slack --to "channel:C0AKRB695UH"

# --- SEO Blog (Tue 10AM ET) ---
openclaw cron add \
  --name "seo-blog-tuesday" \
  --cron "0 10 * * 2" \
  --tz "America/New_York" \
  --session isolated \
  --message "SEO BLOG — Tuesday content production.

Read SESSION-STATE.md for context.

Step 1: Evaluate what's most valuable right now.
- node scripts/query-supabase.mjs --days 4 --enriched-only --summary (anything significant since Friday?)
- node scripts/query-intelligence.mjs --status needs_refresh --limit 5 (stale intelligence pages?)
- node scripts/query-blog.mjs --limit 5 (what have we published recently? avoid topic overlap)

Step 2: Decide.
- Breaking FDA news since Friday? Write about that — it's timely and SEO-juicy.
- Stale intelligence pages? Refresh the most important one instead of a new blog post. A refreshed ingredient page with current data is higher value than another generic SEO post.
- Neither? Run the normal seo-blog-post skill with keyword cluster rotation.
- Post your decision and reasoning to #anton if you deviate from the normal skill.

Step 3: Write, verify, post to #pc-content for review.
- node scripts/verify-content.mjs --content-file /tmp/draft-content.md --content-type blog --verbose

Update SESSION-STATE.md." \
  --announce --channel slack --to "channel:C0AKRB695UH"

# --- LinkedIn Monday (Mon 10AM ET) ---
openclaw cron add \
  --name "linkedin-monday" \
  --cron "0 10 * * 1" \
  --tz "America/New_York" \
  --session isolated \
  --message "LINKEDIN MONDAY — Weekly kickoff content.

Read SESSION-STATE.md.

Check: did Friday's roundup get published? (node scripts/query-blog.mjs --limit 1)
- If roundup was published: draft LinkedIn promoting it (use linkedin-post skill, Listicle Tease or Data Hook format).
- If roundup is still pending (not published): skip LinkedIn promotion — you can't promote what isn't live. Instead, check for other unpromoted posts (node scripts/query-blog.mjs --not-promoted) and promote one of those. If nothing to promote, draft a standalone data insight from query-analytics.mjs.

Post draft to #pc-content. Update SESSION-STATE.md." \
  --announce --channel slack --to "channel:C0AKRB695UH"

# --- LinkedIn Wednesday (Wed 10AM ET) ---
openclaw cron add \
  --name "linkedin-wednesday" \
  --cron "0 10 * * 3" \
  --tz "America/New_York" \
  --session isolated \
  --message "LINKEDIN WEDNESDAY — Mid-week content.

Read SESSION-STATE.md.

Step 1: Find the best content source.
- node scripts/query-blog.mjs --not-promoted (unpromoted blog posts?)
- Check if Tuesday's SEO post was published and unpromoted
- node scripts/query-supabase.mjs --days 3 --enriched-only --summary (any striking data point this week?)

Step 2: Draft LinkedIn post.
- If unpromoted post exists: promote it (linkedin-post skill).
- If all posts promoted: draft standalone content. Use a striking data point, a regulatory deadline, or a trend from query-analytics.mjs. Fresh insight beats recycled content.
- Verify with: node scripts/verify-content.mjs --content-file /tmp/draft.md --content-type linkedin --verbose

Post to #pc-content. Update SESSION-STATE.md." \
  --announce --channel slack --to "channel:C0AKRB695UH"

# --- Lead Finder (Mon 8AM ET) ---
openclaw cron add \
  --name "lead-finder" \
  --cron "0 8 * * 1" \
  --tz "America/New_York" \
  --session isolated \
  --message "LEAD FINDER — Monday morning prospecting.

Read SESSION-STATE.md.

Step 1: Find leads.
- node scripts/query-leads.mjs --days 7
- If 0 leads in 7 days: expand to --days 14
- If still 0: note 'No new enforcement leads this period' in SESSION-STATE.md

Step 2: If leads found, evaluate and prioritize.
- Run lead-finder skill for top 3-5 leads
- Research each (company size, products, recent FDA history)
- Draft personalized outreach for each (read outreach-playbook.md first)
- Post drafts to #pc-outreach — Rashaad reviews and sends

Step 3: If no leads found, use the time productively.
- Check Notion PC Outreach DB for prospects without drafts (query-db)
- Check for intelligence pages needing refresh
- Research a new prospecting channel (where do QA directors hang out online?)
- Whatever you do, log it to SESSION-STATE.md so the value isn't lost

Update SESSION-STATE.md." \
  --announce --channel slack --to "channel:C0AK62A92D9"

echo ""
echo "=== Done. Listing updated crons ==="
openclaw cron list
