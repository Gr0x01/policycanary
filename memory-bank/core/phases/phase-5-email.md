# Phase 5: Intelligence Email

**Complexity:** High | **Sessions:** 2-3 | **Dependencies:** Phase 2C, Phase 4C
**Purpose:** Build the email generation and sending system — the core product. Free weekly digest, paid intelligence email, urgent alerts, and delivery tracking.

### Session Brief

```
TASK: Build the email system — query layer, email compiler, React Email
templates, sending via Resend, webhook handler for delivery tracking,
and cron scheduling. THE EMAIL IS THE PRODUCT.
The email system has been redesigned around subscriber PRODUCTS, not segments. Emails are organized by the subscriber's specific products and what regulatory actions affect them.

WHAT TO READ FIRST:
- /memory-bank/core/projectbrief.md — email product definition (free vs paid)
- /memory-bank/architecture/data-schema.md — Layer 7 (email tables)
- /memory-bank/architecture/llm-data-flow.md — email generation flow
- /memory-bank/architecture/techStack.md — model reference

COMPONENT 1: EMAIL QUERY LAYER (src/lib/email/queries.ts)

  Functions to pull data for email compilation:

  a) getProductMatchesForSubscriber(userId: string, dateRange: {start, end}):
     Returns regulatory items that matched the subscriber's products in the period.
     SELECT ri.*, ie.summary, ie.key_regulations,
            si.relevance, si.impact_summary, si.action_items, si.who_affected,
            si.deadline, sp.product_name, pim.match_score, pim.match_reasons
     FROM product_item_matches pim
     JOIN subscriber_products sp ON pim.product_id = sp.id
     JOIN regulatory_items ri ON pim.item_id = ri.id
     JOIN item_enrichments ie ON ri.id = ie.item_id
     LEFT JOIN segment_impacts si ON ri.id = si.item_id
     WHERE sp.user_id = $1
       AND ri.published_date >= $2 AND ri.published_date <= $3
       AND pim.match_score > 0.1
     ORDER BY pim.match_score DESC, si.relevance, ri.published_date DESC

  b) getProductIntelligenceData(userId: string):
     Returns matched items grouped by product name for email compilation.

  c) getActiveSubscribers(tier?: string):
     SELECT * FROM email_subscribers
     WHERE status = 'active'
       AND (tier IS NULL OR tier = $1)
     (No segment filter — all paid subscribers get product emails)

  d) getTrendContext():
     Keep existing trend context query — unchanged.

  e) getUrgentItems(since: Date):
     Items with relevance = 'critical' AND a product match for a subscriber.
     For urgent alert emails — triggered by Phase 4C, not just critical relevance.

COMPONENT 2: EMAIL COMPILER (src/lib/email/compiler.ts)

  async function compileEmail(type, segment, items, subscriber?):
    Returns compiled HTML for the email.

  a) FREE WEEKLY DIGEST:
     - Input: all items from the period (no segment filter — generic)
     - Template: headline + impact level + source link per item
     - Grouped by: relevance (critical/high first, then medium, then low)
     - NO full analysis, NO action items — just headlines
     - Same content for ALL free subscribers (not per-segment)
     - Generated once per week (not per subscriber)

  b) PRODUCT INTELLIGENCE EMAIL (paid only):
     - Event-driven: fires when product_item_matches exist for the subscriber
     - Custom per subscriber — organized by their specific products
     - Input: getProductIntelligenceData(userId) + subscriber product list
     - LLM generation (Claude Sonnet) for editorial wrapper:
       - Opening: "Here's what happened at FDA this week that affects your products"
       - Per-product sections: for each affected product, list matched items
         with full impact_summary, action items, citation links
       - Claude Sonnet prompt: "Organize this email around [subscriber's product
         names]. For each affected product, explain what the FDA action means
         specifically for that product by ingredient."
       - Closing: "All clear" products listed (products with no matches this week)
     - Weekly "all clear" email: if no product matches, send brief "Nothing
       affecting your products this week" confirmation

     The paid email uses enrichment data that already exists — Claude Sonnet
     is used ONLY for the editorial wrapper. The heavy analysis was done during enrichment.

  c) URGENT ALERT:
     - Triggered by Phase 4C matching engine when match_score > 0.5 AND
       item relevance = 'critical' for a subscriber's product
     - NOT triggered by general critical-relevance items alone
     - Full analysis of the specific item + which product(s) are affected
     - "Action Required: [Item Title] affects your [Product Name]" framing
     - Sent immediately, not batched

  d) WELCOME EMAIL:
     - Sent on free signup or paid signup
     - Confirms segments, sets expectations for delivery schedule
     - Free: "Your weekly digest arrives every Monday"
     - Paid: "Your first intelligence report is being prepared"

COMPONENT 3: REACT EMAIL TEMPLATES (src/lib/email/templates/)

  Use @react-email/components for all templates.

  a) FreeDigest.tsx
     - Policy Canary header/logo
     - "Your Weekly FDA Digest — [Segment]" subject line
     - Item list: title, impact badge (🔴🟡🟢), one-line teaser, link
     - "Get the full analysis" CTA → upgrade prompt
     - Unsubscribe link (using unsubscribe_token)

  b) PaidIntelligence.tsx
     - Policy Canary header
     - "Policy Canary Intelligence — Week of [Date]"
     - Editorial opening paragraph
     - Per-product sections (one per affected subscriber product):
       Product name as section header
       Matched items for that product: full impact_summary, action items
       as numbered list, citations with links, who_affected callout,
       deadline if present
     - "Your products — all clear this week" section for unaffected products
     - Trend watch section: rising topics
     - Upcoming deadlines section
     - Footer with subscription info + unsubscribe

  c) UrgentAlert.tsx
     - Red/amber header indicating urgency
     - "Urgent: [Item Title]"
     - Full analysis
     - Action items (prominent)
     - Source link for verification

  d) Welcome.tsx
     - Warm, professional welcome
     - Confirms: "You're signed up for [Segment(s)] intelligence"
     - Sets expectations: delivery schedule, what to expect
     - For free: teaser of what paid includes

COMPONENT 4: SENDING SYSTEM (src/lib/email/sender.ts)

  Use Resend API for sending.

  a) sendCampaign(campaign: EmailCampaign):
     1. Create email_campaign record (status: 'sending')
     2. Get subscriber list for the segment/tier
     3. For each subscriber:
        - Create email_sends record (status: 'queued')
        - Send via Resend API
        - Update email_sends with provider_message_id, status: 'sent'
     4. Use Resend batch API for efficiency (up to 100 per batch)
     5. Create email_campaign_items junction records
     6. Update email_campaign status: 'sent'

  b) sendUrgentAlert(item, subscribers):
     - Create campaign with type 'urgent_alert'
     - Send immediately to matched subscribers

  c) sendWelcome(subscriber):
     - Single email send on signup

  d) Resend configuration:
     - API key from RESEND_API_KEY
     - From: "Policy Canary <intelligence@policycanary.io>"
     - Reply-to: "support@policycanary.io"

COMPONENT 5: WEBHOOK HANDLER (src/app/api/email/webhook/route.ts)

  POST /api/email/webhook

  Resend webhook events:
  - email.delivered → update email_sends.status, delivered_at
  - email.opened → update opened_at
  - email.clicked → update clicked_at
  - email.bounced → update email_sends.status = 'bounced',
    bounce_type. Auto-update email_subscribers.status = 'bounced'
    for hard bounces
  - email.complained → update email_sends.status = 'complained',
    update email_subscribers.status = 'complained'

  Verify Resend webhook signature.

COMPONENT 6: CRON JOBS

  a) Weekly digest (src/app/api/cron/email-weekly/route.ts):
     - Runs Sunday evening / Monday morning
     - Free: compile one generic digest for all free subscribers
     - Paid (Monitor/Monitor+Research): compile custom product intelligence
       email per subscriber using their product match data
     - Weekly "all clear" for paid subscribers with no matches

  b) Urgent alerts (triggered by Phase 4C matching engine):
     - When Phase 4C finds match_score > 0.5 + critical relevance, fires
       immediately to the affected subscriber
     - Not a cron job — triggered from matcher.ts

  c) vercel.json addition:
     { "path": "/api/cron/email-weekly", "schedule": "0 10 * * 1" }
     // Monday 10 AM UTC

COMPONENT 7: MANUAL OPS CHECKLIST

  Things RB needs to do manually (not code):
  1. Configure DNS: SPF, DKIM, DMARC for policycanary.io
  2. Verify sending domain in Resend
  3. Domain warming: start with small batches (10-20) for first 2 weeks
  4. Set up webhook URL in Resend dashboard
  5. Test deliverability to Gmail, Outlook, corporate Exchange

ACCEPTANCE CRITERIA:
- [ ] Free digest compiles generically (no segment filter, one for all free subs)
- [ ] Product intelligence email is organized by subscriber's products
- [ ] Per-product sections show which items matched and why
- [ ] Weekly "all clear" generates when no product matches
- [ ] Urgent alerts fire when Phase 4C finds critical + high-score match
- [ ] Welcome email sends on signup
- [ ] Resend API sends emails successfully
- [ ] Webhook updates delivery/open/bounce status
- [ ] Hard bounces auto-deactivate subscribers
- [ ] Unsubscribe links work (one-click, using token)
- [ ] Email templates render correctly in email clients
- [ ] Campaign records track what was sent to whom
- [ ] Cron job triggers weekly send
- [ ] Email content is high quality (manual review)

SUBAGENTS:
- For template design: ui-designer for email layout
- For sending infrastructure: backend-architect for deliverability strategy
- After completion: code-reviewer (webhook security, PII handling)
```

### Files to Create
| File | Description |
|------|-------------|
| `src/lib/email/queries.ts` | Database queries for email data |
| `src/lib/email/compiler.ts` | Email compilation logic |
| `src/lib/email/sender.ts` | Resend API integration |
| `src/lib/email/templates/FreeDigest.tsx` | Free weekly digest template |
| `src/lib/email/templates/PaidIntelligence.tsx` | Paid intelligence template |
| `src/lib/email/templates/UrgentAlert.tsx` | Urgent alert template |
| `src/lib/email/templates/Welcome.tsx` | Welcome email template |
| `src/app/api/email/webhook/route.ts` | Resend webhook handler |
| `src/app/api/cron/email-weekly/route.ts` | Weekly email cron endpoint |

### Gotchas
- **Claude Sonnet is used for the editorial wrapper only.** The heavy analysis (summaries, action items, impact assessments) was already generated by Gemini during enrichment. Claude Sonnet adds the narrative voice and stitches the pre-existing intelligence into a readable email. This keeps Claude costs low.
- **Free digest is generated once per segment,** not per subscriber. Same content goes to all free subs in a segment.
- **Resend batch API** supports up to 100 recipients per call. For >100 subscribers, batch into groups.
- **Domain warming is manual.** Start with 10-20 sends, increase gradually over 2 weeks. Don't blast 500 emails on day 1.
- **Unsubscribe link is legally required.** Use `unsubscribe_token` for one-click unsubscribe. CAN-SPAM and GDPR compliance.
- **Email client rendering:** React Email helps, but test in Gmail, Outlook, and Apple Mail. HTML email is notoriously inconsistent.
