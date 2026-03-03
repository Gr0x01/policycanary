---
Last-Updated: 2026-03-03
Maintainer: RB
Status: Active
---

# Per-Product / Per-SKU Monitoring Pricing Research

## Purpose

Research into how SaaS products price product-level or SKU-level monitoring services, with the goal of understanding pricing models for a regulatory monitoring tool that tells food/supplement/cosmetics companies how FDA changes affect their SPECIFIC products.

---

## 1. Concrete Pricing Examples by Category

### A. Amazon / E-Commerce Seller Tools (Per-ASIN/Per-Product Tracking)

These are the closest analog to "per-product monitoring" pricing. They track specific products and tier pricing by the number of products tracked.

**Helium 10**
| Plan | Monthly | Annual (per mo) | ASINs Tracked | Inventory SKUs |
|------|---------|----------------|---------------|----------------|
| Platinum | $129 | $99 | 20 | 40 |
| Diamond | $359 | $279 | 1,000 | 500 |
| Enterprise | $1,499 | $1,499 | 5,000 | Custom |

- Effective cost per ASIN: Platinum = $6.45/ASIN/mo; Diamond = $0.36/ASIN/mo; Enterprise = $0.30/ASIN/mo
- Massive volume discount curve (18x cheaper per-ASIN at Enterprise vs Platinum)

**Jungle Scout**
| Plan | Monthly | Annual (per mo) | Products Tracked |
|------|---------|----------------|-----------------|
| Starter | $49 | $29 | 50 |
| Growth Accelerator | $79 | $49 | 100 |
| Brand Owner + CI | $149 | $99 | 2,000 |
| Cobalt (Enterprise) | Custom | Custom | 20,000 |

- Effective cost per product: Starter = $0.98/product/mo; Brand Owner = $0.07/product/mo
- 14x cheaper per product at top tier vs bottom tier

**SmartScout**
| Plan | Monthly | Annual (per mo) |
|------|---------|----------------|
| Basic | $29 | $25 |
| Essentials | $97 | $75 |
| Business | $187 | $158 |
| Enterprise | Custom | Custom |

**Keepa**
- EUR 19/month (~$21) flat fee
- Can track up to 24,000 ASINs/day on paid plan
- Essentially a flat-fee model, no per-ASIN charge

**Key Pattern:** Tiered plans with product limits that increase dramatically at higher tiers. The per-unit cost drops steeply with scale. Nobody charges literally "per ASIN" -- they use tier-gated limits.

---

### B. Competitor Price Monitoring Tools (Per-Product Pricing)

These track specific competitor product prices -- very analogous to per-SKU monitoring.

**Prisync**
| Model | Professional | Premium | Platinum |
|-------|------------|---------|----------|
| URL-Based | $99/mo | $199/mo | $399/mo |
| Channel-Based | $199/mo | $399/mo | $599/mo |
| Hybrid | $299/mo | $599/mo | $799/mo |

Product limits: ~50 (basic) / ~500 (standard) / unlimited (advanced)
- For 5,000+ products, custom pricing required
- Effective cost per product: $0.40-$2.00/product/mo at mid-tiers

**AWS Supply Chain (per-SKU-location-combination)**
- Supply Chain Insights: $0.13-$0.40 per SKU-location combination/month
- Demand Planning: $0.10-$0.30 per SKU-location combination/month
- Example: 25,000 combinations at Tier 1 = $10,000/month
- Pure usage-based, no base subscription
- Tiered volume discounts (price decreases with volume)

**Key Pattern:** Mix of tiered plans with product limits and pure usage-based per-SKU pricing. AWS is the clearest example of true per-unit pricing in this space.

---

### C. Brand / Social Monitoring Tools (Per-Keyword/Brand Tracking)

These track brand mentions -- the "unit" is a keyword/brand rather than a product.

**Brand24**
| Plan | Monthly | Annual (per mo) | Keywords | Mentions/mo |
|------|---------|----------------|----------|-------------|
| Individual | $99 | $79 | 3 | 2,000 |
| Team | $179 | $149 | 7 | 5,000 |
| Pro | $249 | $199 | 12 | 25,000 |
| Enterprise | $499 | $399 | 25 | 100,000 |

- Effective cost per keyword: $26-$33/keyword/mo at Individual, down to $16-$20 at Enterprise
- Two-axis pricing: keywords (brands tracked) AND mentions (volume)

**Visualping (website change monitoring)**
| Plan | Price | Pages Monitored |
|------|-------|----------------|
| Free | $0 | 5 pages, daily |
| Starter | ~$14/mo | 25 pages |
| Personal | $50/mo | 200 pages |
| Business | $140/mo | Varies |
| Enterprise | $3,000/year | Custom |

- Used for regulatory page monitoring (FDA, WHO, Codex)
- Per-page pricing model, essentially per-unit

**Key Pattern:** Keyword/entity count as the primary pricing axis, with volume (mentions/checks) as secondary axis.

---

### D. Trademark / Patent Monitoring (Per-Mark Pricing)

The most direct "per-item monitored" pricing model in a legal/compliance context.

**LegalZoom Trademark Monitoring**
- $175/year per trademark
- Pure per-mark pricing, no tiers
- Monitors USPTO database for infringements

**Hawthorn Law**
- $99/year per mark (first 5 marks)
- Additional marks up to 20 at no extra cost

**Trama (by Corsearch)**
- Three packages: Single Country, EU+, Global
- ~EUR 299-599/year per mark depending on scope
- Weekly email reports of confusingly similar marks

**Corsearch (enterprise)**
- $12,320/year for unlimited USPTO + state text searches
- Enterprise model: flat fee for unlimited usage

**General Range:**
- Budget services: $99-$225/mark/year
- Mid-market: $300-$600/mark/year
- Enterprise: $5,000-$15,000/year flat (unlimited marks)

**Key Pattern:** Small players charge per mark. As you scale up, per-mark pricing gives way to flat/tiered pricing. This is important -- it suggests per-product pricing works for small catalogs but enterprises want predictability.

---

### E. Compliance / Regulatory Monitoring Tools

**ComplyAdvantage (AML/KYC entity monitoring)**
| Plan | Price | Entities Monitored |
|------|-------|--------------------|
| Starter | $99.99/mo | Up to 2,000 |
| Enterprise | Custom | Unlimited |

- Effective cost per entity: ~$0.05/entity/mo at Starter
- Mid-market volume quote: ~$0.29/entity/mo for 10,000 entities (EEA+UK)
- Free tier for early-stage fintechs (ComplyLaunch)

**Registrar Corp (FDA compliance monitoring)**
- FDA Compliance Monitor: $1.99/month per monitored facility
- Registration monitoring: $195/year per facility
- ComplyHub (FSVP/supplier monitoring): Custom pricing, enterprise-focused
- Case study: "Small business saves $16,000+ annually" suggests $1,000-$2,000/year pricing range

**SGS Digicomply (food regulatory intelligence)**
- Enterprise-only pricing, no public tiers
- Team licenses required (minimum 3 users)
- Custom pricing based on features + users
- Estimated range: $10,000-$50,000/year based on enterprise food compliance tools

**Key Pattern:** Compliance tools either go very cheap per-unit (ComplyAdvantage at $0.05/entity) or hide pricing behind "contact sales." The per-entity model works well for clearly countable items (entities, facilities).

---

### F. Food/Supplement/Cosmetics Specific Tools

**Trustwell Genesis (nutrition labeling/formulation)**
- Custom pricing only, no public tiers
- Feature-based, not per-product

**ReciPal (nutrition label software)**
| Plan | Price | Recipes/Products |
|------|-------|-----------------|
| Single Serving | $29 one-time | 1 recipe |
| Business | $59/mo ($49 annual) | 50 recipes/month |
| Business Plus | $129/mo ($107 annual) | Unlimited |

- Per-product at low end ($29/recipe), flat subscription at high end
- Shows the transition from per-unit to unlimited

**Food Label Maker**
- Subscription model with unlimited labels at higher tiers
- Specific pricing not publicly listed

**FoodReady (HACCP/FDA compliance)**
- Three tiers: Restaurant, Manufacturer, Enterprise
- No public pricing; sales-led
- Feature-gated (not product-count-gated)

**CosmaComply (MoCRA compliance)**
- New entrant, free trial available
- AI-assisted MoCRA compliance
- No public pricing

**ENTR Technologies (formulation + labeling)**
- Cloud-based, subscription model
- Custom pricing, not publicly listed

**Key Finding:** NO existing tool in the food/supplement/cosmetics space charges per-product for regulatory monitoring. The closest is ReciPal's per-recipe pricing for label creation, but that's a different use case. This is a wide-open pricing model opportunity.

---

## 2. Pricing Model Analysis

### Per-Product Pricing: Pros and Cons

**Pros:**
- Directly ties cost to value (more products monitored = more value received)
- Low barrier to entry for small brands (5 products = small bill)
- Natural expansion revenue as customers add products
- Makes ROI calculation simple ("$X per product per month to stay compliant")
- Aligns with how the customer thinks about their business

**Cons:**
- Revenue unpredictability (customers can remove products)
- Can feel punitive for large catalogs (contract manufacturer with 500 products)
- Requires per-product setup/configuration work from the customer
- Billing complexity
- Customers may under-report or game the system

### What's Working Best in 2025-2026: Hybrid Pricing

The dominant trend across SaaS is **hybrid pricing**: base subscription + usage/unit-based component.

**Key Stats:**
- 85% of SaaS companies now use some form of usage-based pricing
- 31% use hybrid models (subscription + usage)
- Hybrid models report the highest median growth rate (21%), outperforming pure subscription and pure usage-based
- 78% of IT leaders experienced unexpected charges with pure usage-based -- driving backlash

**Best Practice:** Base subscription for predictable revenue + unit-based component for expansion revenue.

---

## 3. How Tools Handle Vastly Different Product Counts (5 SKUs vs 500 SKUs)

### Strategy 1: Tiered Plans with Product Limits (Most Common)

**Example: Helium 10**
- 20 ASINs at $129/mo (small seller)
- 1,000 ASINs at $359/mo (mid-size brand)
- 5,000 ASINs at $1,499/mo (enterprise)

**Example: Jungle Scout**
- 50 products at $49/mo
- 2,000 products at $149/mo
- 20,000 products at enterprise pricing

**How it works:** 3-4 tiers with 10-50x jumps in product limits between tiers. The jump from tier to tier is much bigger than the price increase, creating strong value at higher tiers.

### Strategy 2: Per-Unit with Volume Discounts

**Example: AWS Supply Chain**
- $0.40/SKU-location at Tier 1
- $0.13/SKU-location at highest volume
- Pure per-unit, price drops ~3x at scale

**Example: ComplyAdvantage**
- ~$0.05/entity at 2,000 entities
- ~$0.29/entity at 10,000 entities (mid-market negotiated)

### Strategy 3: Unlimited at Top Tier

**Example: Prisync**
- 50 products at $99/mo
- 500 products at $199/mo
- Unlimited at $399/mo

**Example: ReciPal**
- 50 recipes at $59/mo
- Unlimited at $129/mo

**How it works:** Cap the top tier at "unlimited" so large customers have a predictable max cost. Removes friction for enterprise.

### Strategy 4: Base + Per-Unit Overage

**Example: Brand24**
- Base plan includes X keywords
- Additional keywords available at per-keyword pricing
- Volume AND entity count pricing axes

### Recommendation for 5 SKUs vs 500 SKUs:

The most successful pattern for wide product-count ranges is **tiered plans with generous top-tier limits**, combined with enterprise/custom pricing for truly large catalogs:

| Tier | Products | Price |
|------|----------|-------|
| Starter | Up to 10 | $X/mo |
| Growth | Up to 50 | $Y/mo |
| Business | Up to 250 | $Z/mo |
| Enterprise | Unlimited | Custom |

This gives the 5-SKU brand a cheap entry point, the 50-SKU brand a clear mid-tier, and the 500-SKU contract manufacturer a high-touch enterprise conversation.

---

## 4. Applying This to Policy Canary

### Current Model (Segment-Based)
- Pro $299/mo: Intelligence for your selected segments
- All Access $499/mo: Intelligence for ALL segments

This is **industry-level monitoring**, not product-level. Everyone in the same segment gets the same intelligence.

### Potential Per-Product Layer

A per-product monitoring feature would add a layer ABOVE the current intelligence:

"Here's what FDA regulatory change X means for YOUR specific product -- Product Y with ingredients A, B, C, sold in categories D, E."

This requires:
1. Customer inputs their product catalog (product name, ingredients, claims, categories, distribution channels)
2. System matches regulatory changes to specific products
3. Alerts are product-specific, not just segment-specific

### Pricing Model Options for Product-Level Monitoring

**Option A: Products as an Add-On to Existing Tiers**
| Tier | Base | Product Add-On |
|------|------|---------------|
| Pro | $299/mo | +$15-25/product/mo |
| All Access | $499/mo | +$10-20/product/mo (volume discount) |

- 5-product brand: $299 + $125 = $424/mo
- 50-product brand: $499 + $750 = $1,249/mo
- Pros: Simple, scales with value
- Cons: Large catalogs get expensive fast

**Option B: Products Included in Tiered Plans**
| Tier | Price | Segments | Products Included |
|------|-------|----------|------------------|
| Pro | $299/mo | Selected | 0 (industry-level only) |
| Product Intelligence | $449/mo | Selected | Up to 25 products |
| All Access + Products | $699/mo | All | Up to 100 products |
| Enterprise | Custom | All | Unlimited |

- Pros: Clear upgrade path, products as premium feature
- Cons: More complex tier structure

**Option C: Hybrid Base + Per-Product**
| Component | Price |
|-----------|-------|
| Base (current Pro) | $299/mo |
| Product monitoring (per product) | $10-20/product/mo, decreasing with volume |
| Volume: 1-10 products | $20/product/mo |
| Volume: 11-50 products | $15/product/mo |
| Volume: 51-200 products | $10/product/mo |
| Volume: 200+ | Custom |

- 5-product brand: $299 + $100 = $399/mo
- 50-product brand: $299 + $200 + $600 = $1,099/mo
- 200-product manufacturer: $299 + $200 + $600 + $1,500 = $2,599/mo
- Pros: Scales smoothly, fair for all sizes
- Cons: Complex pricing, harder to communicate

**Option D: Products as a Separate Premium Tier (Simplest)**
| Tier | Price | What You Get |
|------|-------|-------------|
| Free | $0 | Weekly headlines |
| Pro | $299/mo | Full intelligence for your segments |
| All Access | $499/mo | Full intelligence, all segments |
| Product Intel | $799/mo | All Access + up to 50 product-specific alerts |
| Enterprise | Custom | Unlimited products, dedicated support |

- Pros: Simple to communicate, clear upgrade path
- Cons: Leaves money on table for large catalogs, may be too expensive for small brands who only want product-level

### Recommended Approach for Policy Canary

Given the solo-dev context and the existing pricing structure, **Option D (Products as Premium Tier)** is likely the best starting point because:

1. **It's simple** -- no per-unit billing complexity to build
2. **It preserves the current model** -- Pro and All Access stay unchanged
3. **It creates a clear upgrade path** -- Product Intel becomes the premium upsell
4. **It targets the highest-value customers** -- contract manufacturers and larger brands who will pay for product-specific intelligence
5. **It's testable** -- launch with 50-product limit, adjust based on demand

BUT: This should NOT be an MVP feature. Product-level monitoring requires:
- Product catalog input/management UI
- Ingredient-to-regulation mapping engine
- Per-product alert generation (much more complex than segment-level)
- Each customer's product data becomes a support burden

**Recommendation:** Launch with segment-level (current plan). Add product-level monitoring as a premium feature at Month 4-6, after validating demand with early customers. Price it as a tier ($799/mo) or add-on ($15-25/product), depending on what customers tell you they'd pay.

---

## 5. Key Takeaways

1. **Nobody in food/supplement/cosmetics charges per-product for regulatory monitoring.** This is a genuine white space.

2. **The dominant pattern is tiered plans with product limits** -- not pure per-unit pricing. Tiers give revenue predictability while product limits create natural upgrade pressure.

3. **Per-unit pricing ranges widely by domain:**
   - E-commerce product tracking: $0.07-$6.45/product/mo
   - Compliance entity monitoring: $0.05-$0.29/entity/mo
   - Trademark monitoring: $8-$50/mark/mo ($99-$600/mark/year)
   - Supply chain per-SKU: $0.10-$0.40/SKU-location/mo

4. **Hybrid pricing (base + usage) is the winning model in 2025-2026** -- 31% adoption and growing, highest growth rates.

5. **Large catalogs always get volume discounts** -- 3-18x cheaper per unit at enterprise vs starter tiers.

6. **"Unlimited" at the top tier removes friction** -- enterprises want predictable costs, not metered anxiety.

7. **Product-level monitoring is a premium feature, not a base feature** -- it requires significantly more infrastructure and creates more value per customer.

---

## Sources

### E-Commerce / Amazon Tools
- [Helium 10 Pricing](https://www.helium10.com/pricing/)
- [Jungle Scout Pricing](https://www.junglescout.com/pricing/)
- [SmartScout Pricing](https://www.demandsage.com/smartscout-pricing/)
- [Keepa Pricing Guide](https://fbamultitool.com/keepa-subscription-pricing-quick-guide-for-amazon-sellers/)

### Price Monitoring
- [Prisync Pricing](https://prisync.com/)
- [AWS Supply Chain Pricing](https://aws.amazon.com/aws-supply-chain/pricing/)

### Brand / Social Monitoring
- [Brand24 Pricing](https://brand24.com/prices/)
- [Visualping Pricing](https://visualping.io/pricing)

### Trademark Monitoring
- [LegalZoom Trademark Monitoring](https://www.legalzoom.com/business/intellectual-property/trademark-monitoring-pricing.html)
- [Hawthorn Law Trademark Watch](https://www.hawthornlaw.net/trademark-watch/)
- [Trademark Monitoring Costs](https://www.tramatm.com/en/trademark-questions-and-answers/trademark-monitoring/how-much-does-trademark-monitoring-cost)

### Compliance / Regulatory
- [ComplyAdvantage Pricing](https://complyadvantage.com/pricing/)
- [Registrar Corp ComplyHub](https://www.registrarcorp.com/software/complyhub/)
- [SGS Digicomply](https://www.digicomply.com/)

### Food/Supplement/Cosmetics Tools
- [FoodReady Pricing](https://foodready.ai/pricing/)
- [ReciPal Pricing](https://www.recipal.com/pricing)
- [Trustwell Genesis](https://www.trustwell.com/products/genesis/)
- [ENTR Technologies](https://www.entrtechnologies.com/)
- [CosmaComply](https://cosmacomply.vercel.app/)

### SaaS Pricing Trends
- [Metronome: State of Usage-Based Pricing 2025](https://metronome.com/state-of-usage-based-pricing-2025)
- [Maxio: Rise of Hybrid Pricing Models](https://www.maxio.com/blog/the-rise-of-hybrid-pricing-models)
- [SaaS Pricing Strategy Guide 2026](https://www.momentumnexus.com/blog/saas-pricing-strategy-guide-2026/)
- [Getmonetizely: SaaS Pricing 2025-2026](https://www.getmonetizely.com/blogs/complete-guide-to-saas-pricing-models-for-2025-2026)
- [Datadog Pricing Guide](https://www.cloudzero.com/blog/datadog-pricing/)
