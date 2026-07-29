# Policy Canary

FDA regulatory intelligence for food, supplement, and cosmetics companies. Monitors FDA data sources daily, enriches items with LLMs, matches them against subscriber product profiles, and delivers weekly intelligence emails plus a web app.

**Live**: [policycanary.io](https://policycanary.io) · Vercel (hosting) · Supabase (DB) · Inngest (pipeline) · Resend (email) · Stripe (billing)

## Getting oriented

- `CLAUDE.md` — agent rules and the start procedure
- `.koda/memory/` — project knowledge base (index: `MEMORY.md`; local to this machine, not in git)
- `Documents/` — research corpus and plans (git-tracked)

## Commands

```bash
npm run dev          # local dev server
npm run type-check   # TypeScript check
npm run test:e2e     # Playwright e2e tests
npm run email:dev    # email template preview (port 3001)
```

## Layout

```
src/            # Next.js app (App Router), pipeline, email, lib
scripts/        # backfills, clawdbot (Anton) content automation, ops
supabase/       # migrations
Documents/      # research + plans (human-readable)
.koda/memory/   # agent knowledge base (local)
```
