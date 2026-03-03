/**
 * Enrichment prompts and Zod schema.
 *
 * DESIGN: Two signal types, both first-class.
 * - Ingredient-level: affected_ingredients → regulatory_item_substances → substance_id matching
 * - Category-level: affected_product_types / facility_type_tags / claims_tags / regulation_tags
 *   → item_enrichment_tags (4 dimensions) → Phase 4C category_overlap matching
 *
 * segment_impacts (food/supplement/cosmetics) = PRESENTATION ONLY — not used for matching.
 */

import { z } from "zod";
import type { RegulatoryItem } from "../../types/database";

// ---------------------------------------------------------------------------
// Output schema (drives generateObject + DB writes)
// ---------------------------------------------------------------------------

export const EnrichmentOutputSchema = z.object({
  // ── TIER 1 — product matching + email priority ───────────────────────────

  /**
   * What regulatory action is actually happening.
   * cgmp_violation  = someone got a warning letter FOR violating existing GMP rules
   * compliance_requirement = a NEW rule/deadline that companies MUST now comply with
   */
  regulatory_action_type: z.enum([
    "recall",
    "ban_restriction",
    "proposed_restriction",
    "safety_alert",
    "cgmp_violation",
    "compliance_requirement",
    "testing_requirement",
    "labeling_change",
    "import_violation",
    "guidance_update",
    "adverse_event_signal",
    "administrative",
  ]),

  /**
   * Signal Type 1 — Ingredient-level matching.
   * Include BOTH common/label names AND systematic names when known.
   * Example: ["BHA", "butylated hydroxyanisole"]
   * If the item has no specific ingredient, return [].
   * DO NOT hallucinate ingredients not mentioned in the content.
   */
  affected_ingredients: z.array(z.string()),

  /**
   * Signal Type 2 — Category-level matching.
   * GRANULAR product types — not just "dietary supplement" but "protein powder", "topical SPF", etc.
   * These go to item_enrichment_tags[product_type].
   */
  affected_product_types: z.array(z.string()),

  /**
   * Facility types affected (for item_enrichment_tags[facility_type]).
   * Examples: "dietary supplement manufacturer", "outsourcing facility", "cosmetic contract manufacturer"
   * Return [] if the item doesn't specifically address a facility type.
   */
  affected_facility_types: z.array(z.string()),

  /**
   * Regulatory claims affected (for item_enrichment_tags[claims]).
   * Examples: "structure-function claims", "health claims", "organic certification"
   * Return [] if not relevant.
   */
  affected_claims: z.array(z.string()),

  /**
   * Specific regulations or CFR parts (for item_enrichment_tags[regulation]).
   * Examples: "21 CFR 111", "MoCRA", "FSVP", "FSMA Preventive Controls"
   * Return [] if no specific regulation is central to the item.
   */
  affected_regulations: z.array(z.string()),

  /**
   * Compliance deadline in ISO date format (YYYY-MM-DD), or null if none.
   * Must be a valid calendar date — do not return relative dates like "Q2 2026".
   */
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),

  // ── TIER 2 — segment routing (generic digest only) ───────────────────────

  /**
   * Segment impacts for the generic weekly digest.
   * Only include segments with relevance != 'none'.
   * This is NOT used for Phase 4C product matching.
   */
  segments: z.array(
    z.object({
      segment: z.enum(["supplements", "cosmetics", "food"]),
      relevance: z.enum(["critical", "high", "medium", "low"]),
      impact_summary: z.string().max(500),
      action_items: z.array(z.string()),
      who_affected: z.string().max(200),
    })
  ),

  // ── TIER 3 — metadata ────────────────────────────────────────────────────

  /** 2-3 sentence plain-language summary for dashboard display. */
  summary: z.string().max(1000),

  /** CFR citations and key regulatory references. */
  key_regulations: z.array(z.string()),

  /** Company names, ingredients, products mentioned. */
  key_entities: z.array(z.string()),

  /**
   * Confidence in overall classification quality.
   * Low (<0.7) = ambiguous content or insufficient information.
   */
  confidence: z.number().min(0).max(1),

  /**
   * Topic tags from controlled vocabulary (slug + confidence).
   * Only use slugs from the provided list.
   */
  topics: z.array(
    z.object({
      slug: z.string(),
      confidence: z.number().min(0).max(1),
    })
  ),

  /**
   * Supporting citations — quotes from the source document.
   * Only include quotes that are verbatim substrings of the source.
   */
  citations: z.array(
    z.object({
      claim_text: z.string().max(300),
      quote_text: z.string().max(600),
      source_section: z.string().max(200),
    })
  ),
});

export type EnrichmentOutput = z.infer<typeof EnrichmentOutputSchema>;

// ---------------------------------------------------------------------------
// Controlled vocabulary
// ---------------------------------------------------------------------------

export const TOPIC_SLUGS = [
  // Supplements
  "cgmp-violations",
  "identity-testing",
  "ndi-notifications",
  "labeling-claims",
  "adverse-events",
  "product-recalls",
  "import-safety",
  // Cosmetics
  "facility-registration",
  "product-listing",
  // Food
  "food-additives",
  "allergen-documentation",
] as const;

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a regulatory affairs expert analyzing FDA regulatory documents for companies that manufacture food, dietary supplement, and cosmetic products.

Your job is to extract structured intelligence that helps these companies understand:
1. Whether this regulatory item affects their specific INGREDIENTS or SUBSTANCES
2. Whether this regulatory item affects their PRODUCT TYPES, FACILITY TYPES, or REGULATORY OBLIGATIONS

## TWO SIGNAL TYPES — BOTH ARE REQUIRED

**Signal Type 1 — Ingredient-level:**
Extract specific substance or ingredient names that are directly implicated.
- Include BOTH common names AND systematic names when both are known (e.g., "BHA" AND "butylated hydroxyanisole")
- These names will be matched against subscriber product ingredient lists
- If no specific ingredient is named, return affected_ingredients = []
- DO NOT hallucinate ingredients. If the content doesn't name one, leave the list empty.

**Signal Type 2 — Category-level:**
Extract what TYPES of products, facilities, or regulations are affected.
- affected_product_types: granular product categories ("protein powder", "topical sunscreen", "infant formula") — NOT just "dietary supplement"
- affected_facility_types: facility categories covered ("outsourcing facility", "cosmetic contract manufacturer")
- affected_claims: regulatory claims affected ("structure-function claims", "MoCRA product listing")
- affected_regulations: specific regulations ("21 CFR 111", "MoCRA", "FSVP")
Category-level signals are equally important as ingredient-level — they're how we match GMP rules, registration deadlines, and labeling changes to subscriber products.

## SEGMENT CLASSIFICATION (secondary — for routing only)
Classify into supplements/cosmetics/food segments ONLY for the purpose of the generic weekly digest.
Critical rule: Items from CDER (Center for Drug Evaluation and Research) or CDRH (Center for Devices) must have segments = []. Pharmaceutical and medical device actions are NOT relevant to food/supplement/cosmetic companies.

## ACTION TYPE DISTINCTION
- cgmp_violation: A company received an enforcement action (warning letter, 483) for VIOLATING existing GMP rules
- compliance_requirement: A NEW rule or deadline that companies MUST comply with going forward (MoCRA registration, new CGMP rule, labeling format requirement)

## CONFIDENCE SCORING
- 0.9+: Clear, unambiguous content with specific substances or well-defined regulatory scope
- 0.7-0.9: Moderate clarity; one or two dimensions are well-defined
- 0.5-0.7: Ambiguous content, animal/device/pharmaceutical domain possible, or very short text
- <0.5: Should rarely happen; means you genuinely cannot classify this item`;

export function buildEnrichmentPrompt(item: RegulatoryItem): string {
  const parts: string[] = [];

  // Structured context (helps LLM before seeing raw content)
  parts.push("## Item Context");
  parts.push(`Item type: ${item.item_type}`);
  parts.push(`Published: ${item.published_date}`);

  if (item.issuing_office) {
    parts.push(`Issuing office: ${item.issuing_office}`);
  }

  if (item.cfr_references && item.cfr_references.length > 0) {
    const refs = item.cfr_references
      .map((r) => `21 CFR Part ${r.part}`)
      .join(", ");
    parts.push(`CFR references: ${refs}`);
  }

  if (item.effective_date) {
    parts.push(`Effective date: ${item.effective_date}`);
  }

  if (item.comment_deadline) {
    parts.push(`Comment deadline: ${item.comment_deadline}`);
  }

  parts.push("");
  parts.push("## Document Content");
  parts.push(item.title);

  if (item.action_text) {
    parts.push("");
    parts.push(item.action_text);
  }

  if (item.raw_content) {
    // Trim very long content to avoid token waste — LLM gets the key info from the start
    const content =
      item.raw_content.length > 8000
        ? item.raw_content.slice(0, 8000) + "\n\n[content truncated for length]"
        : item.raw_content;
    parts.push("");
    parts.push(content);
  }

  parts.push("");
  parts.push("## Topic Slugs (controlled vocabulary)");
  parts.push(
    "Only assign topics from this list: " + TOPIC_SLUGS.join(", ")
  );

  return parts.join("\n");
}

export { SYSTEM_PROMPT };
