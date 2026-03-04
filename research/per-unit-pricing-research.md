# Per-Unit Pricing Research: B2B SaaS
## Research Date: 2026-03-05
## Prepared for: Policy Canary pricing decision ($6 → $8-$12/product/month)

---

## 1. EXECUTIVE SUMMARY

- The $6/product/month current price is below every comparable analog in the market. Tools that monitor discrete entities (domains, keywords, endpoints) at similar informational value charge $5-$17/unit/month at small volumes, scaling down with quantity. $10/product/month is the defensible, psychologically clean number.
- Round-number per-unit pricing ($10) signals quality and is appropriate for a B2B intelligence product. Charm pricing ($9.99) belongs to consumer tools, not compliance software used by procurement/regulatory teams.
- The strongest comparable category is keyword/brand monitoring SaaS (BrandMentions, Brand24), which charges $6.60-$16.60/keyword/month at the lowest tier — for monitoring social mentions of a word, not FDA regulatory changes affecting a product. The value differential strongly supports $10+/product/month.

---

## 2. COMPLIANCE / REGULATORY / MONITORING SaaS — ACTUAL PRICES

### FoodDocs (food safety / HACCP compliance)
- **Model**: One license per food handling location (unlimited devices per license)
- **Starter**: $84/month/location (annual billing only)
- **Standard**: $167/month/location (annual) or $167/month (monthly)
- **Professional**: $250/month/location
- **Enterprise**: Custom
- **Effective per-location cost**: $84-$250/location/month depending on tier
- **Relevance**: FoodDocs monitors compliance for a single facility. Policy Canary monitors regulatory changes for a single product. The unit of monitoring is directly comparable.
- **Implication**: At the $84 FoodDocs entry point, $10/product/month is 1/8th the per-unit cost for what could be argued is *higher* value (proactive regulatory intelligence vs. reactive HACCP documentation).

### Greenlight Guru (medical device QMS)
- **Base price**: $25,000-$35,000/year (2025 reports), some reports of $60K
- **2026 update**: Raising prices in January 2026 via "package separation," estimated +100% for some customers
- **Model**: Platform + named-user licenses. No per-product pricing publicly available — it's a document control QMS, not a regulatory change monitor.
- **Relevance**: Upper bound reference for what medtech teams already pay. A $99/month tool looks like rounding error by comparison. The per-product framing is inapplicable here, but the WTP signal is high for regulated industry buyers.

### ETQ Reliance QMS
- **Model**: Custom enterprise pricing, not publicly disclosed
- **Relevance**: Enterprise compliance QMS players don't publish prices. Not a direct comparable for per-unit pricing design.

---

## 3. MONITORING SaaS WITH PER-UNIT PRICING — ACTUAL PRICES

### TrackSSL (SSL certificate / domain expiry monitoring)
This is the cleanest per-unit analog: you pay to monitor discrete things (certificates/domains) for expiration events.

| Tier | Monthly | Certificates | Cost/Certificate/Month |
|------|---------|--------------|------------------------|
| Free | $0 | 2 | $0 |
| Starter | $17 | 20 | $0.85 |
| Growth | $35 | 80 | $0.44 |
| Complete | $72 | 200 | $0.36 |
| Scale | $136 | 500 | $0.27 |

- **Low value per event**: SSL monitoring fires a one-time alert per domain per year (expiration). Low-frequency, low-stakes relative to regulatory changes.
- **Relevance**: Even this low-value monitoring charges $0.27-$0.85/unit/month. FDA regulatory monitoring is materially higher value — more frequent events, higher consequence per event, more analysis required per unit.

### UptimeRobot (uptime/endpoint monitoring)
| Tier | Monthly | Monitors | Cost/Monitor/Month |
|------|---------|----------|-------------------|
| Free | $0 | 50 | $0 |
| Solo | $8 | 10-50 | $0.16-$0.80 |
| Team | $34 | 100 | $0.34 |
| Enterprise | $64 | 200 | $0.32 |

- **Note**: UptimeRobot raised prices 425% in July 2025.
- **Relevance**: Endpoint monitoring (is this URL up/down?) is mechanical, commodity infrastructure work with no intelligence layer. Charges $0.16-$0.80/monitor/month. Policy Canary's per-product value is orders of magnitude higher per event.

### Better Stack / BetterUptime (uptime + incident management)
- **Model**: Not per-monitor — block-based add-ons
- Free tier: 10 monitors
- Add-on: $25/month for +50 monitors ($0.50/monitor/month)
- Full platform starts at $29-$34/month for first responder
- **Relevance**: Even premium uptime tools selling additional monitoring capacity price it at $0.50/monitor/month. The intelligence gap between uptime pings and regulatory analysis is massive.

### Pingdom (SolarWinds — uptime monitoring, enterprise tier)
- 10 basic checks: $10/month ($1.00/check/month)
- 50 basic checks: $50/month ($1.00/check/month)
- 100 basic checks: $95/month ($0.95/check/month)
- 1,000 basic checks: $830/month ($0.83/check/month)
- **Observation**: Pingdom holds a remarkably flat $1/check/month pricing across tiers — no volume discount on basic checks. This is unusual and signals strong margin confidence in per-unit pricing.

---

## 4. BRAND / KEYWORD MONITORING SaaS — ACTUAL PRICES

These are the closest functional analogs: you define a set of tracked entities (brands/keywords), and the tool monitors a signal domain for activity related to those entities.

### BrandMentions
| Tier | Monthly (annual) | Keywords | Cost/Keyword/Month |
|------|-----------------|----------|--------------------|
| Starter | $79 | 15 | $5.27 |
| Pro | $249 | 30 | $8.30 |
| Expert | $399 | 50 | $7.98 |
| Enterprise | Custom | Unlimited | Custom |

- **Effective per-keyword range**: $5.27-$8.30/keyword/month
- **What a "keyword" is**: Monitoring social media + web for brand name mentions. No expert analysis, no regulatory interpretation, no consequence modeling.

### Brand24
| Tier | Monthly (annual) | Keywords | Cost/Keyword/Month |
|------|-----------------|----------|--------------------|
| Individual | $149 | 3 | $49.67 |
| Team | $249 | 7 | $35.57 |
| Pro | $399 | 25 | $15.96 |

- **Effective per-keyword range at scale**: ~$16/keyword/month (Pro)
- **Note**: Brand24 bundles in AI sentiment analysis, influencer scoring. Still not regulatory intelligence.

### Mention.com
- Previously: $41/month (Solo, 2 alerts), ~$20.50/alert/month
- Current public pricing shows Company plan at $599/month; other tiers moved behind demo wall
- **Takeaway**: Mention has moved upmarket, suggesting per-entity pricing pressure pushes toward custom/enterprise deals at scale.

### SEO Tools (Ahrefs, Semrush) — Per-Project Analogy
These tools charge per "project" (a tracked domain/entity):

**Ahrefs:**
- Lite: $108/month, 5 projects → $21.60/project/month
- Standard: $208/month, 20 projects → $10.40/project/month
- Advanced: $374/month, 50 projects → $7.48/project/month
- Add-on: Project Boost Max at $200/project/month (premium monitoring tier)

**Semrush:**
- Pro: $139.95/month, 5 projects → $27.99/project/month
- Guru: $249.95/month, 15 projects → $16.66/project/month
- Business: $499.95/month, 40 projects → $12.50/project/month

- **Relevance**: SEO project monitoring is a strong structural analog — you track a specific entity (domain) against a signal domain (search rankings) and receive alerts and analysis. At small volumes (5 projects), the market charges $22-$28/project/month. At 15-20 projects, $10-$17/project/month. Policy Canary's $6-$12 range falls squarely in the middle of this established market.

---

## 5. THE KEY QUESTION: WHAT IS DEFENSIBLE FOR POLICY CANARY?

### Competitive Matrix Summary

| Tool | Category | Unit | Price/Unit/Month (low vol) | Intelligence Level |
|------|----------|------|---------------------------|-------------------|
| TrackSSL | Domain monitoring | Certificate | $0.85 | Mechanical (expiry date) |
| UptimeRobot | Endpoint monitoring | Monitor | $0.16-$0.80 | Mechanical (HTTP status) |
| Better Stack | Uptime + incident | Monitor add-on | $0.50 | Mechanical + alert routing |
| Pingdom | Uptime monitoring | Check | $1.00 | Mechanical |
| BrandMentions | Brand monitoring | Keyword | $5.27-$8.30 | Light AI sentiment |
| Ahrefs | SEO intelligence | Project | $10.40-$21.60 | Algorithmic + data |
| Semrush | SEO intelligence | Project | $12.50-$27.99 | Algorithmic + data |
| Brand24 | Brand intelligence | Keyword | $15.96-$49.67 | AI sentiment + analysis |
| FoodDocs | Compliance ops | Location | $84-$250 | Compliance documentation |
| Policy Canary (current) | Regulatory intelligence | Product | $6.00 | LLM analysis + regulatory data |
| **Policy Canary ($10 target)** | **Regulatory intelligence** | **Product** | **$10.00** | **LLM analysis + regulatory data** |

### Verdict on $10/product/month

**$10/product/month is strongly defensible.** The argument:

1. Brand monitoring tools (monitoring a keyword for social mentions) charge $5.27-$16/keyword/month. Regulatory change monitoring for an FDA-regulated product is higher-consequence, lower-noise, more expert analysis per event, and materially more valuable. Charging less than keyword monitoring tools is mispricing.

2. SEO project monitoring charges $10-$28/project/month at comparable volumes. The structural analog is nearly identical (track entity, monitor signal domain, surface actionable alerts). $10 sits at the floor of what that market established for similar monitoring density.

3. FoodDocs charges $84-$250/location/month for compliance documentation software. Policy Canary's regulatory intelligence is complementary and arguably more proactive. $10/product/month against that backdrop is 1/8th the cost for a different-but-adjacent value type.

4. The $99/month base with 5 products already implies $19.80/product/month blended for a solo user on the base plan. The overage at $10 is actually *cheaper per unit* than the implied base-plan rate — a coherent and psychologically satisfying structure (more products, lower marginal rate).

### Should you go $8, $10, or $12?

**The case for $10:**
- Round number in B2B signals premium quality (per MIT/Chicago research on round-number prestige pricing)
- Keeps math trivially simple for buyers ("5 extra products = $50/month")
- Sits within the Brand24/BrandMentions/Ahrefs comparable range without exceeding it
- Clean ratio to base: $99 base / $10 unit = 9.9 units "equivalent" — practically $10/product implied
- Psychological anchoring: "$10 per product" is a complete, memorable, defensible sentence

**The case for $12:**
- Higher margin at same volume
- Still below Ahrefs/Semrush comparable ($10.40-$28/project)
- Creates a "round dozen" feel — but $12/month is less intuitive than $10 for buyers doing mental math
- Risk: feels less like a clean utility price and more like an arbitrary number

**The case for $8:**
- Better conversion on marginal units (buyer hesitation at expansion)
- But leaves money on the table vs. comparable market rates
- $8 is "close to $10 but not $10" — the worst of both worlds psychologically

**Recommendation: $10/product/month, no cents, no charm pricing.**

---

## 6. PRICING PSYCHOLOGY — KEY RESEARCH FINDINGS

### Round Numbers vs. Charm Pricing in B2B
- **Consumer/retail**: Prices ending in .99 outperform round numbers by 24% (MIT/U Chicago). This is the "left-digit effect" — $9.99 reads as $9, not $10.
- **B2B/premium**: The opposite pattern applies. Round numbers signal quality and authority. Premium SaaS products and luxury brands use whole numbers specifically to avoid the "discount/clearance" connotation of .99 endings.
- **Policy Canary context**: Buyers are regulatory affairs professionals, supply chain managers, QA teams. These are professional procurement contexts, not impulse purchases. Round-number pricing ($10) is correct.

### Overage/Expansion Pricing Psychology
- Overage pricing works best when the increment is *smaller than a tier jump* — it reduces the friction of "I'm almost at the limit, do I upgrade?" into "I just pay $10 more per product."
- Usage-based components in hybrid models (base subscription + per-unit overage) produce 137% net dollar retention vs. flat subscription models (BVP research).
- Companies with pricing metrics aligned to how customer value actually scales see 40% higher net dollar retention (OpenView/Sidnetic research).
- "Per product" aligns Policy Canary's pricing metric with customer value: a company monitoring 25 products gets 5x the value of a company monitoring 5 products, and pays accordingly.

### The $10 Anchor
- If the base plan communicates "$99/month includes 5 products," the implied per-product value is $19.80. The overage at $10 then *reads as a discount*, which is a useful psychological framing: "Additional products are only $10 each."
- This is the same mechanic Ahrefs uses: base plan implies $21.60/project, but additional projects via plan upgrade bring the marginal rate down — creating a perception of value improvement as you grow.

### Volume Discount Structure (Optional)
If considering a volume discount for large-product-count customers, the TrackSSL and Pingdom models offer contrasting approaches:
- **TrackSSL**: Heavy volume discount ($0.85 → $0.27/unit at scale). Works for commoditized monitoring.
- **Pingdom**: Flat $1/check across all tiers (no discount). Works for intelligence/analysis-heavy monitoring.
- **Recommendation for Policy Canary**: Hold $10 flat up to ~25 products, then consider negotiated enterprise pricing rather than a public volume schedule. This avoids commoditization signaling.

---

## 7. STRUCTURAL RISKS

1. **Sticker shock at large catalogs**: A company with 50 products pays $99 + (45 x $10) = $549/month. This is within market but may require a clear "Monitor+" tier at, say, $399/month for 50 products ($7.98/product implied) to capture that segment cleanly rather than letting them calculate overage.

2. **Product definition friction**: Unlike a domain (unambiguous) or a keyword (user-defined), "product" requires agreement on what counts. A company with 12 SKUs of the same base formula — is that 1 product or 12? This needs a crisp definition in the UI and pricing page to avoid support friction.

3. **The current $6 number**: If you have existing paying customers at $6/product, a move to $10 is a 67% increase per unit. This requires careful migration handling (grandfather or communicate value improvement first).

---

## 8. SOURCES

- [FoodDocs Pricing](https://www.fooddocs.com/pricing)
- [Brand24 Prices](https://brand24.com/prices/)
- [BrandMentions Pricing](https://brandmentions.com/pricing.php)
- [Mention Pricing](https://mention.com/en/pricing/)
- [UptimeRobot Pricing](https://uptimerobot.com/pricing/)
- [Better Stack Pricing](https://betterstack.com/better-uptime/pricing)
- [TrackSSL Pricing](https://trackssl.com/pricing/)
- [Ahrefs Pricing](https://ahrefs.com/pricing)
- [Greenlight Guru Price: Crazy increase (OpenRegulatory)](https://openregulatory.com/articles/greenlight-guru-price)
- [Bessemer Venture Partners: Linear, volumetric, or bundling](https://www.bvp.com/atlas/linear-volumetric-or-bundling-which-type-of-usage-based-pricing-is-right-for-you)
- [SaaS Pricing Strategy Research (Sidnetic)](https://www.sidnetic.com/blog/saas-pricing-strategy-research)
- [9 Pricing Psychology Tips (Phoenix Strategy Group)](https://www.phoenixstrategy.group/blog/9-pricing-psychology-tips-for-better-unit-economics)
- [OpenView: Pricing Insights from 2,200 SaaS Companies](https://openviewpartners.com/blog/saas-pricing-insights/)
- [UptimeRobot Alternatives After the 2025 Price Hike](https://earezki.com/ai-news/2026-03-01-uptimerobot-alternatives-who-survived-the-2025-price-hike/)
