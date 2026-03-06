# Phase 5: Intelligence Email — SHIPPED (2026-03-06)

**Complexity:** High | **Sessions:** 1 | **Dependencies:** Phase 2C, Phase 4C
**Purpose:** Email generation and sending system — the core product. Free weekly newsletter, paid intelligence briefing, urgent alerts, delivery tracking.

### What Was Built

| File | Description |
|------|-------------|
| `src/lib/email/constants.ts` | Design tokens (colors, fonts, addresses), shared across all templates |
| `src/lib/email/queries.ts` | Email data layer — briefing data, newsletter data, subscriber queries, campaign/send tracking |
| `src/lib/email/compiler.ts` | Claude Sonnet editorial generation + React Email rendering for all 3 template types |
| `src/lib/email/sender.ts` | Resend API with single + batch send, List-Unsubscribe headers |
| `src/lib/email/templates/BriefingEmail.tsx` | Paid weekly briefing — 3-zone architecture, BLUF, badges, action items |
| `src/lib/email/templates/WeeklyNewsletter.tsx` | Free newsletter — lead story, THE NUMBER, bridge CTA |
| `src/lib/email/templates/AlertEmail.tsx` | Urgent regulatory alert — red top rule, confidence badge |
| `src/app/api/email/send-weekly/route.ts` | Cron endpoint for paid + free weekly sends |
| `src/app/api/email/webhook/route.ts` | Resend delivery/bounce tracking with svix HMAC verification |
| `src/app/api/email/unsubscribe/route.ts` | CAN-SPAM one-click unsubscribe using unsubscribe_token |
| `emails/*.tsx` | Preview files with mock data for React Email dev server |

### Architecture Decisions

- **No free tier.** 14-day reverse trial with hard cutoff. Free newsletter is separate (Policy Canary Weekly).
- **Product naming:** "Product Intelligence Briefing" (never "email"), "Regulatory Alert", "Policy Canary Weekly"
- **Three-zone architecture** for paid briefings: YOUR PRODUCTS / YOUR INDUSTRY / ACROSS FDA
- **BLUF pattern** — verdict first, then context. "Items to consider" (never "action required").
- **Confidence calibration** — badges match regulatory status: "Rule Final" / "Proposed" / "Guidance Pending" / "Confirmed Recall"
- **Claude Sonnet editorial wrapper only** — heavy analysis done during enrichment. Sonnet adds narrative voice.
- **Token-based unsubscribe** — uses `email_subscribers.unsubscribe_token`, not raw DB id
- **List-Unsubscribe headers** on all emails for Gmail/Yahoo deliverability
- **Timing-safe comparisons** on cron secret and webhook signature verification

### Compliance Review (2026-03-06)

All emails reviewed by legal-compliance-checker and brand-guardian subagents. Key fixes applied:
- Full "not legal advice" disclaimer on all emails including free newsletter
- Inline AI disclosure on lead story and per-product sections
- "For your review, not legal advice" framing (not "not compliance advice")
- Source links on every regulatory item
- Bounce/complaint auto-deactivation

### Still Needed
- [ ] Welcome email template (sent on signup/trial start)
- [ ] Shadow briefing teaser for expired trials (monthly)
- [ ] Vercel cron config in `vercel.json`
- [ ] DNS setup: SPF, DKIM, DMARC for policycanary.io
- [ ] Domain verification in Resend
- [ ] Domain warming (start with 10-20 sends)
- [ ] Deliverability testing (Gmail, Outlook, Apple Mail)

### Env Vars Needed
```
RESEND_API_KEY=           # Resend sending
RESEND_WEBHOOK_SECRET=    # Webhook signature verification (whsec_... format)
CRON_SECRET=              # Protects weekly send endpoint
```

### Preview
```bash
npm run email:dev   # React Email dev server on port 3001
```

### Gotchas
- React Email dev server needs `npx` prefix (local dep)
- `@react-email/components` re-exports `render` — no separate import needed
- AI SDK uses `maxOutputTokens` not `maxTokens`
- Newsletter `total_items` in `<Preview>` needs `String()` coercion (ReactNode type)
- Svix HMAC: secret has "whsec_" prefix that must be stripped before base64 decode
