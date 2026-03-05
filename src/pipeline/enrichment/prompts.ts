/**
 * Enrichment prompts and Zod schema.
 *
 * DESIGN: Two signal types, both first-class.
 * - Ingredient-level: affected_ingredients → regulatory_item_substances → substance_id matching
 * - Category-level: affected_product_categories / facility_type_tags / claims_tags / regulation_tags
 *   → item_enrichment_tags (4 dimensions) → Phase 4C category_overlap matching
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
   * Signal Type 2 — Product category matching (controlled vocabulary).
   * Which product categories from the PRODUCT_CATEGORY_SLUGS list does this item affect?
   * Classify all FDA-regulated sectors honestly. Return [] only for purely administrative items.
   */
  affected_product_categories: z.array(z.string()),

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

  // ── TIER 2 — metadata ─────────────────────────────────────────────────────

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
      claim_text: z.string(),
      quote_text: z.string(),
      source_section: z.string(),
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

export const PRODUCT_CATEGORY_SLUGS = [
  // Cosmetics (17) — MoCRA/VCRP 21 CFR 720.4
  "baby_products",
  "bath_preparations",
  "eye_makeup",
  "fragrance",
  "hair_coloring",
  "hair_preparations_non_coloring",
  "lipstick",
  "makeup_not_eye",
  "manicuring",
  "oral_hygiene",
  "personal_cleanliness",
  "shaving_preparations",
  "skin_care",
  "suntan_preparations",
  "tattoo",
  "other_cosmetic",
  "professional_salon",

  // Food (46) — 21 CFR 170.3(n) + extensions
  "baked_goods",
  "nonalcoholic_beverages",
  "breakfast_cereals",
  "chewing_gum",
  "coffee_tea",
  "condiments_relishes",
  "confections_frostings",
  "dairy_products",
  "egg_products",
  "fats_oils",
  "fish_products",
  "fresh_fruits_vegetables",
  "frozen_dairy",
  "fruit_vegetable_juices",
  "gelatins_puddings",
  "grain_products_pastas",
  "gravies_sauces",
  "hard_candy_cough_drops",
  "herbs_spices_seasonings",
  "instant_coffee_tea",
  "jams_jellies",
  "meat_products",
  "milk_products",
  "imitation_dairy",
  "nut_products",
  "plant_protein_products",
  "poultry_products",
  "processed_fruits_vegetables",
  "reconstituted_vegetables",
  "snack_foods",
  "soft_candy",
  "soups_soup_mixes",
  "sugar_substitutes",
  "sugars_syrups",
  "sweet_sauces_toppings",
  "alcoholic_beverages",
  "bottled_water",
  "baby_food",
  "food_contact_materials",
  "food_preservatives",
  "infant_formula",
  "medical_foods",
  "pet_food",
  "animal_feed",
  "dietary_conventional_foods",
  "other_food",

  // Supplements (19) — DSLD-derived
  "amino_acids_peptides",
  "botanicals_herbal",
  "enzymes",
  "essential_fatty_acids",
  "fiber_supplements",
  "mineral_supplements",
  "multivitamins",
  "mushroom_supplements",
  "probiotics_prebiotics",
  "protein_powders",
  "single_vitamins",
  "specialty_supplements",
  "sports_performance",
  "weight_management",
  "joint_bone_health",
  "digestive_health",
  "immune_support",
  "beauty_supplements",
  "other_supplement",

  // Pharmaceutical (~10)
  "prescription_drugs",
  "otc_drugs",
  "compounded_drugs",
  "generic_drugs",
  "biosimilars",
  "controlled_substances",
  "ophthalmic_drugs",
  "injectable_drugs",
  "topical_drugs_pharma",
  "pediatric_drugs",

  // Medical Devices (~8)
  "class_i_devices",
  "class_ii_devices",
  "class_iii_devices",
  "in_vitro_diagnostics",
  "combination_products",
  "digital_health_devices",
  "implantable_devices",
  "radiation_emitting_devices",

  // Biologics (~7)
  "vaccines",
  "blood_products",
  "cell_gene_therapy",
  "tissue_products",
  "allergenics",
  "xenotransplantation",
  "human_cells_tissues",

  // Tobacco (~6)
  "cigarettes_combustible",
  "vape_e_cigarettes",
  "smokeless_tobacco",
  "nicotine_products",
  "cigars",
  "pipe_tobacco",
  "hookah_waterpipe",

  // Veterinary (~5)
  "veterinary_drugs",
  "animal_devices",
  "animal_biologics",
  "medicated_animal_feed",
  "veterinary_medical_devices",
] as const;

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a high-precision regulatory document analyst reviewing FDA regulatory documents.
Your goal is to extract structured intelligence that is **strictly accurate**. We are monitoring for specific product impacts.

## INSTRUCTIONS

1. **START WITH REASONING**: Use the 'reasoning' field to "think out loud."
   - Quote the exact part of the text that defines the scope.
   - Analyze: Is this a general discussion or a specific rule?
   - Decision: Does this actually ban/restrict something, or is it just a meeting notice?

2. **TWO SIGNAL TYPES**:
   - **Ingredient-level**: Extract specific substances that are the *target* of the action (e.g., "Red No. 3", "CBD", "BHA").
     - Do NOT extract ingredients mentioned only as examples in general discussions.
   - **Product categories**: Which product categories does this item affect? Use ONLY slugs from the PRODUCT CATEGORY SLUGS list provided below.
     - Classify ALL FDA regulatory items accurately regardless of sector — food, supplements, cosmetics, pharma, devices, biologics, tobacco, veterinary.
     - Pick the most specific matching categories. A cucumber recall → \`["fresh_fruits_vegetables"]\`. A CDER warning letter about compounded drugs → \`["compounded_drugs"]\`. A 510(k) clearance for a diagnostic → \`["in_vitro_diagnostics"]\`.

3. **ANTI-HALLUCINATION RULES**:
   - If no specific ingredient is named, \`affected_ingredients\` must be \`[]\`.
   - Do not infer supplement categories just because "vitamin" is mentioned in a fortified food context.
   - \`affected_product_categories\` must ONLY contain slugs from the provided list. Do not invent slugs.
   - If no slug in the list fits the item, return \`[]\`. Only return empty when the item is truly administrative with no product-sector relevance.

4. **ACTION TYPES**:
   - \`cgmp_violation\`: Enforcement for breaking *existing* GMP rules (warning letters citing 21 CFR 111, 210, 211).
   - \`import_violation\`: Specifically for Foreign Supplier Verification Program (FSVP) violations, import alerts, or import detention. Use this even if the letter also mentions GMP — if the core issue is FSVP or import compliance, use \`import_violation\`.
   - \`compliance_requirement\`: A *new* rule or deadline everyone must follow.
   - \`guidance_update\`: New or revised FDA guidance document, draft guidance, or request for information. NOT a binding requirement.
   - \`administrative\`: Meetings, hearings, budget issues, technical amendments (low impact).

## CONFIDENCE SCORING
- **0.95+**: Direct hit. Named ingredient + specific action (Ban, Recall, Warning Letter).
- **0.80+**: Clear category impact (e.g., "All cosmetic facilities must register", "CDER drug approval").
- **<0.60**: Ambiguous or low relevance.
- Confidence reflects enrichment quality, not sector relevance. A well-classified pharma item deserves high confidence.

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

  parts.push("");
  parts.push("## Product Category Slugs (controlled vocabulary)");
  parts.push(
    "Only assign product categories from this list: " +
      PRODUCT_CATEGORY_SLUGS.join(", ")
  );

  return parts.join("\n");
}

export { SYSTEM_PROMPT };
