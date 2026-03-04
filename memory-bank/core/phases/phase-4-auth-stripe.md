# Phase 4: Auth & Subscriptions

**Complexity:** Medium-High | **Sessions:** 2 | **Dependencies:** Phase 1, Phase 3
**Purpose:** Add Supabase Auth, Stripe checkout, webhook handling, and route protection. Connect email_subscribers to users on upgrade.

**STATUS:** Phase 4A (Auth) COMPLETE. Phase 4B (Stripe Subscriptions) COMPLETE. Stripe Dashboard setup needed (manual).

### Session Brief

```
TASK: Implement authentication (Supabase Auth) and subscriptions (Stripe)
so users can sign up, start a trial, and subscribe to Monitor or Monitor+Research.

WHAT TO READ FIRST:
- /memory-bank/architecture/techStack.md — Stripe, Supabase config
- /memory-bank/architecture/data-schema.md — users, email_subscribers tables
- /memory-bank/core/projectbrief.md — pricing tiers, trial details

COMPONENT 1: SUPABASE AUTH (src/lib/supabase/)

  a) Auth setup:
     - Email/password authentication via Supabase Auth
     - Magic link option (passwordless)
     - Supabase Auth middleware for session management

  b) Auth pages:
     - src/app/(auth)/login/page.tsx — login form
     - src/app/(auth)/signup/page.tsx — registration form
       Collects: email, password, name, company_name
       No sector selection — "We'll personalize based on the products you add"
       After signup → redirect to /app/onboarding (Phase 4B)
     - src/app/(auth)/callback/route.ts — OAuth/magic link callback

  c) On signup:
     - Supabase Auth creates the auth user
     - Trigger/webhook creates row in public.users table:
       id = auth.uid(), email, name, subscription_tier = 'free'
     - Check email_subscribers for existing record with same email:
       if found, set email_subscribers.user_id = new user id
       (links free subscriber to their new account)

  d) Middleware (src/middleware.ts):
     - Refresh Supabase auth session on every request
     - Protect /app/* routes — redirect to /login if not authenticated
     - Protect /app/* routes — check subscription_tier for paid features
     - Marketing routes (/, /pricing, /sample) are always public

COMPONENT 2: STRIPE INTEGRATION

  a) Products and Prices (create in Stripe dashboard, store IDs in env):
     2 base price points + 1 per-product price:
     - Monitor Monthly: $49/month
     - Monitor+Research Monthly: $249/month
     - Extra Product: $6/month per product beyond 5 (use Stripe metered or quantity)

     Env vars:
     STRIPE_PRICE_MONITOR_MONTHLY=price_xxx
     STRIPE_PRICE_MONITOR_RESEARCH_MONTHLY=price_xxx
     STRIPE_PRICE_EXTRA_PRODUCT=price_xxx

     Per-product billing: 5 products included in each paid plan.
     If subscriber has >5 products, charge (count - 5) × $6/mo.
     Simplest approach: Stripe subscription with a quantity item for extra products.
     Update product count in Stripe when subscriber adds/removes products.

  b) Checkout API route (src/app/api/stripe/checkout/route.ts):
     POST /api/stripe/checkout
     Body: { priceId: string }

     - Verify authenticated user
     - Get or create Stripe customer (store stripe_customer_id in users)
     - Create Stripe Checkout Session:
       mode: 'subscription',
       trial_period_days: 14,
       success_url: '/app?success=true',
       cancel_url: '/pricing'
     - Return session URL

  c) Customer portal (src/app/api/stripe/portal/route.ts):
     POST /api/stripe/portal
     - Create Stripe billing portal session
     - Return portal URL
     (For managing subscription, updating payment, canceling)

  d) Webhook handler (src/app/api/stripe/webhook/route.ts):
     POST /api/stripe/webhook

     CRITICAL: Verify webhook signature using STRIPE_WEBHOOK_SECRET.
     Do NOT process unverified webhooks.

     Handle events:
     - checkout.session.completed:
       Map price ID → tier (monitor or monitor_research)
       Update users.subscription_tier
       Update email_subscribers.tier (if linked)

     - customer.subscription.updated:
       Handle plan changes (upgrade/downgrade)
       Update users.subscription_tier

     - customer.subscription.deleted:
       Set users.subscription_tier = 'free'
       Update email_subscribers.tier = 'free' (if linked)

     - invoice.payment_failed:
       Log — may want to notify user or grace period (future)

COMPONENT 3: ROUTE PROTECTION

  a) Middleware checks:
     - /app/* → must be authenticated
     - /app/search, /app/enforcement, /app/trends → must be monitor_research
     - /app/products, /app/feed → must be monitor or monitor_research
     - /api/stripe/checkout → must be authenticated
     - /api/stripe/webhook → public (verified by signature)
     - /api/cron/* → verified by cron secret

  b) Helper: getCurrentUser(request) → { user, tier }

  c) Tier-based content filtering:
     - Free: web app shows limited content (latest 5 items, no search)
     - Monitor: /app/feed + /app/products (product-filtered feed)
     - Monitor+Research: full access (search, enforcement, trends, all data)

COMPONENT 4: ACCOUNT PAGES

  - src/app/(app)/settings/page.tsx — account settings
    Show: email, name, company, current plan, product count vs limit
    Actions: manage subscription (→ Stripe portal), manage products (→ /app/products)
    "You're monitoring X products. Your plan includes 5; you're paying for X extra."
  - src/app/(app)/layout.tsx — authenticated app layout
    Sidebar navigation, user menu, plan badge

ACCEPTANCE CRITERIA:
- [x] Users can sign up with magic link (email/OTP)
- [x] Users table is populated on signup (via auth/callback upsert)
- [x] Existing email_subscribers are linked on checkout (webhook matches by email)
- [x] Stripe checkout creates subscriptions with 14-day trial
- [x] Webhook correctly updates access_level on payment events
- [x] Webhook verifies Stripe signature
- [x] Proxy (middleware) protects /app/* routes
- [ ] Free users see limited content (UI gating not yet implemented)
- [ ] Monitor users access /app/products and /app/feed (product onboarding Phase 4C)
- [ ] Monitor+Research users access /app/search, /app/enforcement, /app/trends (deferred — coming soon)
- [x] Stripe customer portal works for subscription management
- [x] Auth session persists across page reloads
- [x] PricingTable updated ($99 Monitor, $399 Research coming soon)
- [x] AppNav shows Upgrade/Manage Billing based on access_level
- [x] Login next=checkout flow works (unauthenticated → login → auto-checkout)
- [x] Triple code-reviewed (4 critical + 9 warning fixes applied)

SUBAGENTS:
- During: backend-architect for auth flow review
- After: code-reviewer (CRITICAL — auth + payment security)
```

### Files to Create
| File | Description |
|------|-------------|
| `src/app/(auth)/login/page.tsx` | Login page |
| `src/app/(auth)/signup/page.tsx` | Registration page |
| `src/app/(auth)/callback/route.ts` | Auth callback handler |
| `src/middleware.ts` | Auth + route protection middleware |
| `src/app/api/stripe/checkout/route.ts` | Stripe checkout session |
| `src/app/api/stripe/portal/route.ts` | Stripe customer portal |
| `src/app/api/stripe/webhook/route.ts` | Stripe webhook handler |
| `src/app/(app)/settings/page.tsx` | Account settings |
| `src/app/(app)/layout.tsx` | Authenticated app layout |
| `src/lib/stripe/helpers.ts` | Stripe utility functions |

### Gotchas
- **Webhook signature verification is non-negotiable.** Never process unverified webhooks.
- **14-day trial:** Set `trial_period_days: 14` in Stripe Checkout. During trial, users should have full access.
- **email_subscribers → users linking:** When a free subscriber creates an account, find their `email_subscribers` record by email and set `user_id`. This preserves their subscription history.
- **Stripe price IDs are environment-specific.** Test mode and live mode have different IDs.
- **Supabase Auth user ID = users table PK.** The `users.id` should be the same UUID as `auth.users.id` from Supabase Auth.
