# Phase 3: Marketing Site

**Complexity:** Medium | **Sessions:** 2-3 | **Dependencies:** Phase 1
**Purpose:** Build the public-facing marketing site — landing page, pricing page, and sample report page. Plus email signup API.

### Session Brief

```
TASK: Build the Policy Canary marketing site — landing page, pricing page,
and sample report page. This is the first thing prospects see. It must
communicate the value proposition clearly and capture email signups.

WHAT TO READ FIRST:
- /memory-bank/core/projectbrief.md — positioning, pricing, value prop
- .claude/agents/brand-guardian.md — voice, tone, visual identity
- .claude/skills/frontend-design/SKILL.md — frontend design guidelines

DESIGN DIRECTION:
Read the brand guardian for full guidance. Key points:
- Clean, professional, information-dense. NOT flashy or consumer-facing.
- Think: Bloomberg meets a well-designed newsletter
- Sharp corners, generous whitespace, strong typography
- Authoritative and precise copy — specific numbers, named regulations
- The sample report is the conversion tool — show the actual product

PAGE 1: LANDING PAGE (src/app/(marketing)/page.tsx)

  Sections (top to bottom):

  a) HERO
     - Headline: Clear value prop in one sentence (brand voice: authoritative)
     - Subheadline: What it does, who it's for, why now
     - Primary CTA: "Start Free" or "Get the Free Digest"
     - Secondary CTA: "See a Sample Report" (links to sample report page)
     - Visual: mock email preview or data visualization

  b) PROBLEM STATEMENT
     - "The FDA is shrinking. Enforcement is surging. Who's watching?"
     - Stats from market research: MoCRA deadlines, 73% warning letter
       increase, 3,859 FDA employees lost
     - Make the pain real and timely

  c) HOW IT WORKS
     - 3-step visual: We monitor → We analyze → You act
     - Emphasize: "The analysis is already done when it hits your inbox"

  d) FREE vs PAID COMPARISON
     - Side-by-side: what free email shows vs what paid email shows
     - Use a real-ish example: same regulatory item, headline-only vs
       full analysis with action items
     - This is the key conversion visualization

  e) WHO IT'S FOR
     - Buyer role cards: Founder, QA Manager, Product Manager, VP Regulatory
     - Each role card with 2-3 specific pain points (product-centric)
       e.g., Founder: "Which of my 32 SKUs is affected by this warning?"
             QA Manager: "Does the new BHA guidance affect our moisturizer line?"
             Product Manager: "What does this recall mean for my collagen launch?"
     - NOT industry cards — organize by buyer role, not product sector

  f) SOCIAL PROOF (placeholder for now)
     - "Trusted by regulatory teams at..." (fill in after launch)
     - Or: industry logos (FDA, Federal Register as data sources)

  g) EMAIL SIGNUP (email + name only)
     - Email, name fields only
     - NO industry checkboxes — sectors are inferred from products, not selected at signup
     - Tagline: "We'll personalize based on the products you add after signup"
     - "Get the free weekly digest"
     - On submit → POST /api/signup → insert email_subscribers

  h) FOOTER
     - Links: Pricing, Sample Report, Privacy Policy, Terms
     - "Policy Canary — Regulatory intelligence for food, supplement,
       and cosmetic companies"

PAGE 2: PRICING PAGE (src/app/(marketing)/pricing/page.tsx)

  - Three-column pricing table: Free / Monitor $49/mo / Monitor+Research $249/mo
  - Monthly billing only at launch. NO annual/monthly toggle.
  - Per-product pricing: 5 products included in paid plans. Extra products: $6/product/mo.
    Show a small note below the plan price: "Includes 5 products. +$6/mo per additional product."
  - Feature comparison:
    | Feature | Free | Monitor | Monitor+Research |
    | Weekly headline digest | ✓ | ✓ | ✓ |
    | Product-specific intelligence | - | ✓ | ✓ |
    | Urgent product alerts | - | ✓ | ✓ |
    | Products included | - | 5 | 5 |
    | Web app access | - | ✓ | ✓ |
    | AI search | - | - | ✓ |
    | Enforcement database | - | - | ✓ |
    | Trend analysis | - | - | ✓ |
  - CTA: "Start Free" / "Start Monitoring" / "Start Monitoring+Research"
  - FAQ section below:
    - "How does per-product billing work?" — 5 products included, $6/mo each beyond that
    - "What counts as a product?" — any supplement, food, or cosmetic you add
    - "Can I change my plan?" — yes, upgrade/downgrade anytime via account settings
    - "Is there an annual option?" — not yet, monthly billing only at launch
  - Value justification: "$49/mo < 1 hour of a regulatory consultant's time"
  - Remove: annual/monthly toggle, All Access tier

PAGE 3: SAMPLE REPORT (src/app/(marketing)/sample/page.tsx)

  THIS IS THE KEY CONVERSION TOOL. Show what the paid product intelligence email looks like.

  - Render a realistic product intelligence email as a web page
  - Use a specific product example: "Your Marine Collagen Powder" — organized
    around the subscriber's product, not a generic industry digest
  - Show: product name in subject/header, full analysis of how the regulatory
    action affects that specific product's ingredients, action items with deadlines,
    citation links, ingredient-level specificity ("your product contains whey protein
    isolate, which is directly affected by...")
  - Side annotation: "← This is what free subscribers see" (generic headline)
    vs "← Monitor subscribers get this" (product-specific full analysis)
  - CTA at bottom: "Add your products and get this in your inbox"

API ROUTE: EMAIL SIGNUP (src/app/api/signup/route.ts)

  POST /api/signup
  Body: { email, name?, source?: string }
  (No sector selection — sectors are inferred from products, not selected at signup)

  Logic:
  1. Validate email format
  2. Check if email already exists in email_subscribers
     - If exists and active: return "already subscribed"
     - If exists and unsubscribed: reactivate
  3. Generate unsubscribe_token (crypto.randomUUID())
  4. Insert into email_subscribers:
     - tier = 'free'
     - status = 'active'
     - source = 'signup_form'
  5. Return success
  6. (Future) Send welcome email via Resend

  Validation:
  - Zod schema for request body
  - Email format validation
  - Rate limiting: basic (IP-based, 5/minute)

COMPONENTS TO BUILD:

  src/components/marketing/
    Header.tsx              # Navigation header
    Footer.tsx              # Site footer
    Hero.tsx                # Landing page hero section
    PricingTable.tsx         # Pricing comparison component
    SignupForm.tsx           # Email signup form
    FeatureComparison.tsx    # Free vs paid side-by-side
    BuyerRoleCard.tsx        # Buyer role cards (Founder, QA Manager, etc.)
    SampleReport.tsx         # Sample intelligence email display

  src/app/(marketing)/layout.tsx  # Marketing layout with header/footer

COPY DIRECTION:
- Read brand guardian for voice/tone
- Authoritative, specific, no fluff
- Lead with the problem (manual monitoring is failing)
- Show the transformation (what your inbox looks like with Policy Canary)
- Specific numbers: "73% increase in warning letters", "$49/mo < 1 hour
  of your time", "12 warning letters cited identity testing failures"
- No "AI-powered" buzzwords. No startup hype.

ACCEPTANCE CRITERIA:
- [ ] Landing page renders with all sections
- [ ] Pricing page shows Monitor ($49) and Monitor+Research ($249) correctly
- [ ] Per-product pricing note is visible (+$6/mo per product beyond 5)
- [ ] NO annual/monthly toggle (monthly billing only)
- [ ] Sample report page shows realistic intelligence email
- [ ] Email signup form is email + name only (no sector selection)
- [ ] Email signup form submits successfully
- [ ] /api/signup creates email_subscriber records
- [ ] Duplicate emails are handled gracefully
- [ ] All pages are responsive (mobile + desktop)
- [ ] Copy follows brand voice guidelines
- [ ] Pages load fast (no unnecessary client-side JS)
- [ ] Run `npm run test:e2e` — basic navigation tests pass

SUBAGENTS:
- Before starting: Read frontend-design skill
- During: Use ui-designer for layout decisions if needed
- After: frontend-developer for implementation review
- After: code-reviewer for API route security
```

### Files to Create
| File | Description |
|------|-------------|
| `src/app/(marketing)/page.tsx` | Landing page |
| `src/app/(marketing)/pricing/page.tsx` | Pricing page |
| `src/app/(marketing)/sample/page.tsx` | Sample report page |
| `src/app/(marketing)/layout.tsx` | Marketing layout |
| `src/app/api/signup/route.ts` | Email signup API |
| `src/components/marketing/*.tsx` | 8+ marketing components |

### Gotchas
- **Sample report is the conversion tool.** Don't skimp on it. Use realistic regulatory content.
- **Copy is critical.** This is a B2B product for regulatory professionals. Startup-speak will kill credibility.
- **Monthly only at launch.** No annual/monthly toggle. No annual pricing in the UI.
- **No sector checkboxes on the signup form.** Sectors are derived from products. Subscribers add products, not sectors.
- **No Stripe integration yet.** Pricing CTAs link to signup form (free) or a "coming soon" state (paid). Stripe comes in Phase 4.
- **SSR these pages.** Marketing pages should be server-rendered for SEO. No client components unless needed for interactivity (signup form, pricing toggle).
