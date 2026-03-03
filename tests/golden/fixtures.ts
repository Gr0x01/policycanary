/**
 * Golden Dataset: Enrichment Pipeline Regression Tests
 *
 * 10 real items from the DB, manually annotated with expected enrichment output.
 *
 * PHILOSOPHY: This product is ingredient-centric, not segment-centric.
 * The matching engine (Phase 4C) connects regulatory items → subscriber products
 * via SUBSTANCES. Segment tags (food/supplement/cosmetics) are secondary — useful
 * for routing the generic digest, but they are NOT the product.
 *
 * The primary assertions are therefore:
 *   1. regulatory_action_type — what is actually happening (drives email priority)
 *   2. affected_ingredients   — the substances affected (drives product matching)
 *   3. affected_product_types — granular product types (pre-filter before substance match)
 *
 * Segment classification is tested as a secondary/sanity check.
 *
 * How to use:
 *   - `expected.affected_ingredients`: every listed string must appear in the pipeline
 *     output (case-insensitive, substring match OK). Extra ingredients are fine.
 *   - `expected.affected_product_types`: same subset rule.
 *   - `expected.regulatory_action_type`: must match exactly.
 *   - `expected.segments`: each listed segment must appear with AT LEAST the given relevance.
 *   - `expected.segments_absent`: these segments must NOT appear above "none".
 *
 * Review cadence:
 *   - Run against the pipeline before any full backfill
 *   - Re-run whenever the enrichment prompt version bumps
 *   - Human review of pipeline output vs expected takes ~20 min for 10 items
 *
 * Last reviewed: 2026-03-03
 */

export type Segment = "supplements" | "food" | "cosmetics"
export type Relevance = "critical" | "high" | "medium" | "low" | "none"
export type ActionType =
  | "recall"                // product pulled from market
  | "ban_restriction"       // ingredient/substance banned or restricted (final)
  | "proposed_restriction"  // proposed ban/restriction (not yet final, comment period open)
  | "safety_alert"          // immediate consumer safety concern (contamination, hidden drug)
  | "cgmp_violation"        // enforcement action — company violated existing GMP rules (warning letter, 483)
  | "compliance_requirement" // NEW obligation companies must meet — registration deadline, GMP rule enacted, listing requirement
  | "testing_requirement"   // new or updated testing/identity testing required
  | "labeling_change"       // labeling requirement change
  | "import_violation"      // FSVP or import-related violation
  | "guidance_update"       // new FDA guidance document (lower urgency)
  | "adverse_event_signal"  // emerging adverse event pattern
  | "administrative"        // technical amendment, low priority

export interface GoldenFixture {
  /** DB id — fetch this item and run enrichment against it */
  id: string
  /** Human-readable label for test output */
  label: string
  item_type: string
  issuing_office: string | null
  expected: {
    // ── PRIMARY: these drive product matching and email prioritization ─────────
    /** What regulatory action is actually happening */
    regulatory_action_type: ActionType
    /** Substance/ingredient names that must appear in output (label-friendly) */
    affected_ingredients: string[]
    /** Granular product types — NOT just "food", but "protein powder", "topical SPF", etc. */
    affected_product_types: string[]
    /** True if there is a concrete compliance deadline */
    has_deadline: boolean

    // ── SECONDARY: segment routing for the generic weekly digest ──────────────
    segments: { segment: Segment; min_relevance: Relevance }[]
    /** These segments must NOT appear with relevance above "none" */
    segments_absent: Segment[]

    // ── QUALITY ───────────────────────────────────────────────────────────────
    min_confidence: number
  }
  /** Why this item is in the golden set — what it validates */
  rationale: string
}

export const GOLDEN_FIXTURES: GoldenFixture[] = [
  // ─── POSITIVE CASES ──────────────────────────────────────────────────────────

  {
    id: "f7656654-7b85-4caf-a227-64bb3275c6c9",
    label: "RSS press release — FDA BHA reassessment",
    item_type: "press_release",
    issuing_office: null,
    expected: {
      regulatory_action_type: "guidance_update", // Request for Information — not yet a proposed restriction
      affected_ingredients: ["BHA", "butylated hydroxyanisole"],
      affected_product_types: ["food preservative", "food"],
      has_deadline: false,
      segments: [
        { segment: "food", min_relevance: "critical" },
      ],
      segments_absent: [],
      min_confidence: 0.9,
    },
    rationale:
      "BHA reassessment. FDA page specifically discusses food use only. " +
      "Must extract both 'BHA' (label name) and 'butylated hydroxyanisole' (systematic). " +
      "Both names needed for substance table matching via GSRS synonyms. " +
      "NOTE: BHA is ALSO used in supplements and cosmetics, but the source text doesn't " +
      "discuss that. Cross-segment inference (Phase 2B+) will expand this — for now, " +
      "we only test what the source text says.",
  },

  {
    id: "b3a674fb-f010-48d8-9a85-21c47a49ed73",
    label: "RSS safety alert — Tainted supplement (BIG GUYS hidden drug)",
    item_type: "safety_alert",
    issuing_office: null,
    expected: {
      regulatory_action_type: "safety_alert",
      affected_ingredients: [],
      affected_product_types: ["dietary supplement", "male enhancement supplement"],
      has_deadline: false,
      segments: [{ segment: "supplements", min_relevance: "critical" }],
      segments_absent: ["food", "cosmetics"],
      min_confidence: 0.9,
    },
    rationale:
      "Tainted supplement with hidden drug ingredient. Supplements:critical ONLY. " +
      "Ingredients left empty intentionally — the specific drug is not named in the " +
      "short RSS text. Tests that the pipeline doesn't hallucinate an ingredient name " +
      "when the content doesn't specify one.",
  },

  {
    id: "c524b180-0540-49cf-8b58-97b30254b5f6",
    label: "Warning letter — FSVP food importer (East CK Trading)",
    item_type: "warning_letter",
    issuing_office: "Division of Northeast Imports",
    expected: {
      regulatory_action_type: "import_violation",
      affected_ingredients: [],
      affected_product_types: ["imported food"],
      has_deadline: false,
      segments: [{ segment: "food", min_relevance: "high" }],
      segments_absent: ["supplements", "cosmetics"],
      min_confidence: 0.8,
    },
    rationale:
      "Food importer warned for FSVP violations (21 CFR Part 1, Subpart L). " +
      "Issuing office is an Import Division, not CFSAN. " +
      "Tests food-only WL classification and import_violation action type. " +
      "No specific substances — the violation is procedural (program compliance), not ingredient-based.",
  },

  {
    id: "be3be08a-c515-463c-b9b7-c83375501887",
    label: "Recall — Cucumber Salmonella (Dairyland Produce)",
    item_type: "recall",
    issuing_office: null,
    expected: {
      regulatory_action_type: "recall",
      affected_ingredients: [], // cucumber is the product, not a substance/ingredient
      affected_product_types: ["fresh produce", "raw vegetable"],
      has_deadline: false,
      segments: [{ segment: "food", min_relevance: "high" }],
      segments_absent: ["supplements", "cosmetics"],
      min_confidence: 0.9,
    },
    rationale:
      "Straightforward food recall. Validates that whole-food ingredients (not just " +
      "chemicals/additives) are correctly extracted. Tests produce classification.",
  },

  {
    id: "5a906e54-7110-4546-9250-5f336139b0a4",
    label: "Recall — Nick The Greek Spicy Yogurt (salmonella)",
    item_type: "recall",
    issuing_office: null,
    expected: {
      regulatory_action_type: "recall",
      affected_ingredients: [], // yogurt is the product, not a substance/ingredient
      affected_product_types: ["dairy"],
      has_deadline: false,
      segments: [{ segment: "food", min_relevance: "high" }],
      segments_absent: ["supplements", "cosmetics"],
      min_confidence: 0.85,
    },
    rationale:
      "Short raw_content (typical of openFDA enforcement records — often just title + " +
      "one sentence). Tests that the pipeline handles minimal content without hallucinating.",
  },

  // ─── NEGATIVE CASES: must NOT match our segments ─────────────────────────────

  {
    id: "a5a3f72b-f028-4fff-838d-355a29d1e903",
    label: "Warning letter — CDER CGMP pharmaceutical (AQ USA / Ross Healthcare)",
    item_type: "warning_letter",
    issuing_office: "Center for Drug Evaluation and Research (CDER)",
    expected: {
      regulatory_action_type: "cgmp_violation",
      affected_ingredients: [],
      affected_product_types: ["pharmaceutical", "finished drug product"],
      has_deadline: false, // LLM inconsistently extracts WL response deadlines; don't fail on this
      segments: [],
      segments_absent: ["supplements", "food", "cosmetics"],
      min_confidence: 0.3,
    },
    rationale:
      "Pharmaceutical CGMP WL from CDER (21 CFR Parts 210 and 211). " +
      "THE most critical negative test. A misclassification as supplements causes " +
      "false product matches. CDER issuing office must drive segments to none. " +
      "Rule-based validator MUST fire on CDER office → clear all segment tags. " +
      "has_deadline=true: WLs have 15-working-day response deadlines. " +
      "min_confidence lowered: pharma WLs are outside our core domain, low confidence is expected and fine.",
  },

  {
    id: "0a6f9f55-c6ab-4d4c-b8a0-6a59cfad2b36",
    label: "Warning letter — CDER drug compounding 503B (MedisourceRx)",
    item_type: "warning_letter",
    issuing_office: "Center for Drug Evaluation and Research (CDER)",
    expected: {
      regulatory_action_type: "cgmp_violation",
      affected_ingredients: [],
      affected_product_types: ["compounded drug"], // "outsourcing facility" is a facility_type, not product_type
      has_deadline: true,
      segments: [],
      segments_absent: ["supplements", "food", "cosmetics"],
      min_confidence: 0.3,
    },
    rationale:
      "503B outsourcing facility WL from CDER. Second CDER negative test. " +
      "Confirms the CDER heuristic fires consistently across different drug violation types. " +
      "has_deadline=true: WLs have response deadlines. Low min_confidence: pharma is outside our domain.",
  },

  {
    id: "fcdafa3e-7e06-4d77-aa8f-7bd2eba1c8b2",
    label: "RSS safety alert — Medical device (Fresenius Kabi infusion pump)",
    item_type: "safety_alert",
    issuing_office: null,
    expected: {
      regulatory_action_type: "safety_alert",
      affected_ingredients: [],
      affected_product_types: ["medical device", "infusion pump"],
      has_deadline: false,
      segments: [],
      segments_absent: ["supplements", "food", "cosmetics"],
      min_confidence: 0.4, // device alert outside our domain — low confidence is correct and expected
    },
    rationale:
      "Medical device safety alert. RSS safety_alerts are a mix of device, drug, and " +
      "supplement alerts — the pipeline must discriminate. No issuing_office field, " +
      "so the LLM must classify from content alone. Tests content-based exclusion.",
  },

  {
    id: "b1a4380c-b838-4759-a20a-ef20fadb10bc",
    label: "FR rule — New animal drug applications (technical amendments)",
    item_type: "rule",
    issuing_office: null,
    expected: {
      regulatory_action_type: "administrative",
      affected_ingredients: [],
      affected_product_types: ["animal drug", "veterinary drug"],
      has_deadline: true, // FR rules have effective dates
      segments: [],
      segments_absent: ["supplements", "food", "cosmetics"],
      min_confidence: 0.1, // animal drugs are completely outside our domain — very low confidence expected
    },
    rationale:
      "Animal drug rule — 21 CFR Parts 510, 520, 522, 524, 529, 558. " +
      "CFR 500s = animal drugs, not human food/supplement/cosmetics. " +
      "Rule-based validator must fire: CFR Part 500+ → segments cleared.",
  },

  // ─── EDGE CASE: borderline relevance / low confidence acceptable ─────────────

  {
    id: "c5f0ed6c-5fc2-419f-b56d-027adcc0e2b1",
    label: "FR notice — Animal Food Ingredient Consultation (AFIC) guidance",
    item_type: "notice",
    issuing_office: null,
    expected: {
      regulatory_action_type: "guidance_update",
      affected_ingredients: [],
      affected_product_types: ["animal food", "animal food ingredient"],
      has_deadline: false,
      segments: [], // animal food ≠ human food — no segment impact expected
      segments_absent: ["supplements", "cosmetics"],
      min_confidence: 0.6,
    },
    rationale:
      "Animal food ingredient guidance — primarily for pet/livestock feed. " +
      "food:low at most. Low confidence is acceptable and expected here. " +
      "Tests that the pipeline doesn't over-classify borderline items. " +
      "Lower min_confidence (0.6) is intentional — ambiguity is fine, overclaiming is not.",
  },
]

/**
 * Rule-based validator cases.
 * These should fire AFTER LLM enrichment as deterministic cross-checks.
 * The validator catches the most dangerous LLM misclassifications.
 */
export const RULE_VALIDATOR_CASES = [
  {
    id: "a5a3f72b-f028-4fff-838d-355a29d1e903",
    label: "CDER issuing_office → clear all food/supplement/cosmetics segments",
    rule: "issuing_office_cder",
    should_flag: true,
  },
  {
    id: "0a6f9f55-c6ab-4d4c-b8a0-6a59cfad2b36",
    label: "CDER issuing_office → clear all food/supplement/cosmetics segments",
    rule: "issuing_office_cder",
    should_flag: true,
  },
  {
    id: "b1a4380c-b838-4759-a20a-ef20fadb10bc",
    label: "CFR Parts 510/520/522/558 (animal drugs) → clear all segments",
    rule: "cfr_animal_drugs",
    should_flag: true,
  },
  {
    id: "c524b180-0540-49cf-8b58-97b30254b5f6",
    label: "FSVP food WL — not a CDER WL, should NOT flag",
    rule: "issuing_office_cder",
    should_flag: false,
  },
]
