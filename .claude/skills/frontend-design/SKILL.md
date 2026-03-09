---
name: frontend-design
description: Guidelines for creating distinctive, high-quality frontend UI for Policy Canary. Use when building or modifying React components, pages, or visual elements.
---

# Policy Canary Frontend Design Guidelines

## Design Thinking

Before coding, understand the core aesthetic direction: **Stripe-level precision with ambient depth.**

- **Purpose**: What problem does this interface solve? Who uses it? (Founders/Quality Directors who need actionable regulatory intelligence).
- **Tone**: Precise, Vigilant, Calibrated, Calm.
- **Constraints**: Technical requirements (Next.js, Tailwind CSS, accessibility).
- **Differentiation**: The UI must instantly communicate that we know the subscriber's specific products.

CRITICAL: **Always read `.claude/agents/brand-guardian.md` before making design decisions.** The Brand Guardian is the north star. Where this skill document and the Brand Guardian conflict, the Brand Guardian wins.

## Frontend Aesthetics

### Typography
Policy Canary uses a strict, technically credible typography system based on the IBM Plex family.

**Never use**: Inter, Roboto, Arial, Open Sans, Lato, or system fonts.

- **App UI / Headlines**: `IBM Plex Sans` (`font-sans`). Use for all UI elements, primary headers, and general copy.
- **Email / Marketing Hero**: `IBM Plex Serif` (`font-serif`). Use only for editorial moments, like product names in email headers or large marketing statements. NOT for web app UI.
- **Data / Citations**: `IBM Plex Mono` (`font-mono`). Use for regulation numbers (e.g., 21 CFR 111), ingredient codes, and source links.

### Color & Theme
Rely on the defined CSS variables in `src/app/globals.css`.

- **Dark Surfaces**: `#0F172A` (`var(--color-surface-dark)`). Used for sidebars, headers, and backgrounds.
- **Canary Yellow**: `#EAC100` (`var(--color-canary)`). Use *only* on dark backgrounds for brand moments: logo mark, email top rule, favicon, active sidebar dot. **Never use for urgency.**
- **Amber**: `#D97706` (`var(--color-amber)`). Use for CTAs, deadline text, and watch-state badges.
- **Urgent**: `#DC2626` (`var(--color-urgent)`). Genuine regulatory urgency only.
- **Confirmed/Clear**: `#059669` (`var(--color-clear)`). All-clear states, confirmed compliant.
- **Watch/Pending**: `#3B82F6` (`var(--color-watch)`).

*Note: Status colors (red/amber/green/blue) appear as small dots (8px) and badges — never as thick borders or full background fills on cards.*

### Motion
- Motion must be meaningful: scroll-triggered reveals, state transitions (loading to data), or card hover lifts.
- Use `framer-motion` for complex staggered reveals and smooth layout animations.
- Rely on CSS transitions for micro-interactions (e.g., `.motion-safe-spring`, `.soft-card`).
- Honor `prefers-reduced-motion`.

### Spatial Composition & UI Components
- **Cards**: White surface (`var(--color-surface)`), 1px border (`var(--color-border)`), 4px radius, subtle float shadow (`var(--shadow-float)`). Use the `.soft-card` and `.card-surface` utility classes where appropriate.
- **Spacing**: Use an 8px grid. Typical card padding is 24px (`p-6`). Section spacing on marketing pages is 64–80px.
- **Buttons**: 4px radius.
  - Primary: `#0F172A` fill, white text.
  - Amber CTA: `#D97706` fill, white text.
  - Secondary: White fill, `#E2E8F0` border.
- **Hierarchy**: Product names, action items, and deadlines must be immediately findable. Use generous whitespace to manage regulatory density.

### Backgrounds & Visual Details
Create atmosphere and depth rather than flat colors:
- Use predefined ambient gradients from `globals.css` (e.g., `.hero-gradient`, `.section-soft`, `--gradient-dark-surface`).
- Modals/dropdowns should use backdrop blur (`backdrop-blur-sm`) and layer above the page with depth shadow.
- Do not use abstract regulatory clipart, scales of justice, or generic stock photography. Use real product labels and real regulatory documents for imagery.

## Avoid
NEVER use generic AI-generated aesthetics or patterns:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Purple gradients or generic SaaS palettes
- "Maximalist chaos" or "Brutalist" extremes—Policy Canary is calm and precise.
- Vague copy ("Regulatory changes could impact you") instead of specific data ("Your Marine Collagen Powder is affected").

## Implementation
- **Pixel-Perfect Precision**: Every spacing decision is intentional. The craft signals trustworthiness.
- **Production-Grade Code**: Code must be clean, responsive, and functional.
- **Context-Specific Character**: Interpret creatively but stay within the strict bounds of the brand identity. The UI must feel grounded, authoritative, and deeply integrated with the user's specific product catalog.

Elegance comes from executing the vision well. Code must be production-grade and functional.

No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. Interpret creatively and make unexpected choices that feel genuinely designed for the context.
