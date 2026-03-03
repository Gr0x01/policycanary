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
  // ── TIER 0 — Chain of Thought (The Brain) ───────────────────────────────
  
  /**
   * Detailed step-by-step analysis of the document.
   * 1. Identify the core regulatory action (what is actually changing?).
   * 2. Quote key phrases defining the scope (who/what is affected?).
   * 3. List potential ingredients or product categories before finalizing them below.
   * 4. Explain why you are choosing the specific 'regulatory_action_type'.
   * 
   * This field is for YOUR reasoning process. It helps ensure accuracy.
   */
  reasoning: z.string(),

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
   * Include BOTH broad categories AND specific types.
   * Example for a cucumber recall: ["fresh produce", "raw vegetable", "cucumber"]
   * Example for a supplement WL: ["dietary supplement", "protein powder"]
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
   * Compliance deadline OR response deadline in ISO date format (YYYY-MM-DD), or null if none.
   * For warning letters, extract the response deadline (e.g., "respond within 15 working days").
   * For rules, extract the effective date or comment deadline.
   * Return null only if no concrete date exists.
   */
  deadline: z.string().nullable(),

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
  // Dietary Supplements
  "cgmp-violations",
  "identity-testing",
  "ndi-notifications",
  "structure-function-claims",
  "adverse-events",
  "new-dietary-ingredients",
  "botanicals",
  "probiotics",
  "vitamins-minerals",
  "sports-nutrition",

  // Cosmetics / Personal Care
  "mocra",
  "facility-registration",
  "product-listing",
  "cosmetic-gmp",
  "fragrance-allergens",
  "talc-regulations",
  "spf-sunscreen",
  "color-additives",
  "safety-substantiation",

  // Food & Beverage
  "food-additives",
  "gras-notices",
  "food-labeling",
  "fsma",
  "preventive-controls",
  "foreign-supplier-verification",
  "food-safety-plan",
  "allergen-labeling",
  "heavy-metals",
  "pesticide-residues",
  "infant-formula",
  "medical-foods",
  "plant-based-alternatives",

  // Cross-Cutting / Administrative
  "import-alerts",
  "recalls",
  "inspections",
  "warning-letters",
  "form-483",
  "guidance-documents",
  "federal-register-notices",
  "fda-budget-policy",
  "state-legislation", // For future state layer
  "prop-65",           // For future state layer
  "class-action-lawsuits" // Emerging risk
] as const;

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a high-precision FDA Regulatory Compliance Officer analyzing regulatory documents.
Your goal is to extract structured intelligence that is **strictly accurate**. We are monitoring for specific product impacts.

## INSTRUCTIONS

1. **START WITH REASONING**: Use the 'reasoning' field to "think out loud."
   - Quote the exact part of the text that defines the scope.
   - Analyze: Is this a general discussion or a specific rule?
   - Decision: Does this actually ban/restrict something, or is it just a meeting notice?

2. **TWO SIGNAL TYPES**:
   - **Ingredient-level**: Extract specific substances (e.g., "Red No. 3", "CBD", "N-acetyl cysteine").
     - *Constraint*: Do NOT extract "ingredients" if the text just mentions them as examples in a general discussion. Only extract if they are the *target* of the action.
   - **Category-level**: Extract product types at BOTH the broad category level AND specific level.
     - Always include the broad category: "fresh produce", "dietary supplement", "dairy product", "medical device"
     - Then add specifics: "cucumber", "protein powder", "yogurt", "infusion pump"
     - Example: a cucumber recall → ["fresh produce", "raw vegetable", "cucumber"]

3. **ANTI-HALLUCINATION RULES**:
   - If no specific ingredient is named, \`affected_ingredients\` must be \`[]\`.
   - Do not infer "dietary supplement" just because "vitamin" is mentioned, if the context is a fortified food.
   - If the document is about "Medical Devices" or "Drugs" (Pharma), set \`segments\` to \`[]\` unless it explicitly mentions food/cosmetics/supplements overlap.

4. **ACTION TYPES**:
   - \`cgmp_violation\`: Enforcement for breaking *existing* GMP rules (warning letters citing 21 CFR 111, 210, 211).
   - \`import_violation\`: Specifically for Foreign Supplier Verification Program (FSVP) violations, import alerts, or import detention. Use this even if the letter also mentions GMP — if the core issue is FSVP or import compliance, use \`import_violation\`.
   - \`compliance_requirement\`: A *new* rule or deadline everyone must follow.
   - \`guidance_update\`: New or revised FDA guidance document, draft guidance, or request for information. NOT a binding requirement.
   - \`administrative\`: Meetings, hearings, budget issues, technical amendments (low impact).

## CONFIDENCE SCORING
- **0.95+**: Direct hit. Named ingredient + specific action (Ban, Recall, Warning Letter).
- **0.80+**: Clear category impact (e.g., "All cosmetic facilities must register").
- **<0.60**: Ambiguous or low relevance.

Your output drives a critical notification system. **Precision > Recall.** It is better to miss a vague signal than to panic a user with a false positive.`;

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
    // Send full content. Gemini Pro/Flash both support 1M tokens.
    // Longest item in DB is ~47K chars (~12K tokens) — well within limits.
    // Head+tail truncation at 8K was throwing away 80% of long warning letters.
    parts.push("");
    parts.push(item.raw_content);
  }

  parts.push("");
  parts.push("## Topic Slugs (controlled vocabulary)");
  parts.push(
    "Only assign topics from this list: " + TOPIC_SLUGS.join(", ")
  );

  return parts.join("\n");
}

export { SYSTEM_PROMPT };
