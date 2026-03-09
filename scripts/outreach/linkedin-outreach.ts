#!/usr/bin/env npx tsx
/**
 * LinkedIn Outreach Generator
 *
 * Queries DSLD for supplement companies whose products contain ingredients
 * subject to recent FDA actions, generates personalized DM cheat sheets,
 * and outputs JSON for Notion import (via Claude MCP).
 *
 * Usage:
 *   npx tsx scripts/linkedin-outreach.ts                    # Full run → writes outreach-targets.json
 *   npx tsx scripts/linkedin-outreach.ts --dry-run          # Preview without writing JSON
 *   npx tsx scripts/linkedin-outreach.ts --ingredient turmeric  # Filter by ingredient
 *   npx tsx scripts/linkedin-outreach.ts --limit 20         # Limit records
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = val;
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const ingredientFilter = args.includes("--ingredient")
  ? args[args.indexOf("--ingredient") + 1]
  : null;
const limit = args.includes("--limit")
  ? parseInt(args[args.indexOf("--limit") + 1], 10)
  : 500;

// ---------------------------------------------------------------------------
// FDA action hooks — map ingredient to the most compelling regulatory item
// ---------------------------------------------------------------------------
interface FDAHook {
  ingredient: string;
  patterns: string[]; // ILIKE patterns for dsld_ingredients
  actionTitle: string;
  actionType: string;
  actionDate: string;
  actionSummary: string; // 1-sentence for DM context
  dmAngle: string; // the "why you should care" for the DM
}

const FDA_HOOKS: FDAHook[] = [
  {
    ingredient: "turmeric",
    patterns: ["%turmeric%", "%curcum%"],
    actionTitle:
      "Qunol Extra Strength Turmeric Capsules Recall — Mold Contamination",
    actionType: "recall",
    actionDate: "2026-02-04",
    actionSummary:
      "Qunol recalled its Extra Strength Turmeric Capsules after mold was detected in raw material lots.",
    dmAngle:
      "mold contamination was found in raw turmeric material — the recall affected finished goods across multiple lots",
  },
  {
    ingredient: "moringa",
    patterns: ["%moringa%"],
    actionTitle:
      "Multiple Moringa Product Recalls — Salmonella Contamination",
    actionType: "recall",
    actionDate: "2026-02-13",
    actionSummary:
      "Multiple moringa supplement brands recalled for Salmonella, including 7 reported illnesses and 3 hospitalizations.",
    dmAngle:
      "multiple moringa products were recalled for Salmonella contamination, with hospitalizations reported",
  },
  {
    ingredient: "ashwagandha",
    patterns: ["%ashwagandha%"],
    actionTitle:
      "Eniva USA Warning Letter — CGMP Violations (Identity Testing Failures)",
    actionType: "warning_letter",
    actionDate: "2026-02-03",
    actionSummary:
      "FDA cited Eniva USA for failing to establish product specifications and identity testing for Ashwagandha Gummies.",
    dmAngle:
      "FDA cited a supplement manufacturer for identity testing failures specifically on ashwagandha products",
  },
  {
    ingredient: "sea_moss",
    patterns: ["%sea moss%", "%irish moss%"],
    actionTitle:
      "Sea Moss Gel Superfood Recalls — Clostridium Botulinum Contamination",
    actionType: "recall",
    actionDate: "2026-02-11",
    actionSummary:
      "Multiple sea moss gel products recalled across flavors for potential Clostridium botulinum contamination.",
    dmAngle:
      "multiple sea moss products were recalled for potential botulinum contamination — a serious safety issue for gel-format supplements",
  },
  {
    ingredient: "bee_pollen",
    patterns: ["%bee pollen%"],
    actionTitle:
      "CC Pollen Company Warning Letter — CGMP Violations (Bee Pollen Identity Testing)",
    actionType: "warning_letter",
    actionDate: "2026-02-03",
    actionSummary:
      "CC Pollen received a warning letter for failing to conduct identity testing for bee pollen and rejecting out-of-spec components.",
    dmAngle:
      "FDA cited a bee pollen manufacturer for identity testing failures and rejecting out-of-spec silica — their products were deemed adulterated",
  },
  {
    ingredient: "royal_jelly",
    patterns: ["%royal jelly%"],
    actionTitle:
      "CC Pollen Company Warning Letter — CGMP Violations (Royal Jelly)",
    actionType: "warning_letter",
    actionDate: "2026-02-03",
    actionSummary:
      "CC Pollen received a warning letter covering both bee pollen and royal jelly products for CGMP failures.",
    dmAngle:
      "FDA cited a manufacturer for CGMP failures affecting both bee pollen and royal jelly products — identity testing was a key violation",
  },
  {
    ingredient: "collagen",
    patterns: ["%collagen%"],
    actionTitle:
      "OptiWize Collagen Plus Recall — Manganese Below Labeled Amount",
    actionType: "recall",
    actionDate: "2026-02-11",
    actionSummary:
      "OptiWize Collagen Plus recalled after NSF testing found manganese levels below the labeled quantity.",
    dmAngle:
      "a collagen supplement was recalled when third-party NSF testing found ingredient levels below what was on the label",
  },
  {
    ingredient: "beetroot",
    patterns: ["%beetroot%", "%beet root%"],
    actionTitle:
      "New FDA Rule: Beetroot Red Listed as Exempt Color Additive (Effective March 23, 2026)",
    actionType: "rule",
    actionDate: "2026-02-06",
    actionSummary:
      "FDA issued a final rule listing Beetroot Red as a color additive exempt from certification, effective March 23, 2026.",
    dmAngle:
      "the FDA just finalized a rule on beetroot red as a color additive — new compliance requirements take effect March 23",
  },
  {
    ingredient: "ginger",
    patterns: ["%ginger%"],
    actionTitle:
      "Organic Ginger Root Herbal Supplement Recall — Unapproved Drug Claims & Misbranded",
    actionType: "recall",
    actionDate: "2025-12-31",
    actionSummary:
      "Ginger root capsules recalled because the FDA deemed claims like 'natural anti-inflammatory properties' and 'supports gut' to be unapproved drug claims.",
    dmAngle:
      "a ginger supplement was recalled because the FDA deemed claims like 'supports gut health' and 'anti-inflammatory' to be unapproved drug claims — a lot of ginger brands are making similar claims right now",
  },
  {
    ingredient: "spirulina",
    patterns: ["%spirulina%"],
    actionTitle:
      "Live it Up Super Greens Recall — Salmonella Typhimurium (Class I)",
    actionType: "recall",
    actionDate: "2026-02-04",
    actionSummary:
      "Super Greens powder containing spirulina recalled (Class I) for Salmonella Typhimurium contamination.",
    dmAngle:
      "a super greens supplement containing spirulina was just recalled Class I for Salmonella Typhimurium — that's the most serious recall classification the FDA uses",
  },
  {
    ingredient: "chlorella",
    patterns: ["%chlorella%"],
    actionTitle:
      "Live it Up Super Greens Recall — Salmonella Typhimurium (Class I)",
    actionType: "recall",
    actionDate: "2026-02-04",
    actionSummary:
      "Super Greens powder containing chlorella recalled (Class I) for Salmonella Typhimurium contamination.",
    dmAngle:
      "a super greens supplement containing chlorella was just recalled Class I for Salmonella Typhimurium — that's the most serious recall classification the FDA uses",
  },
  {
    ingredient: "echinacea",
    patterns: ["%echinacea%"],
    actionTitle:
      "Herbal Supplement Line Recall — Unapproved Drug Claims & Missing Supplement Facts",
    actionType: "recall",
    actionDate: "2025-12-31",
    actionSummary:
      "An entire line of herbal supplements including echinacea recalled for unapproved drug claims and missing Supplement Facts panels.",
    dmAngle:
      "the FDA recalled an entire herbal supplement line for unapproved drug claims and missing Supplement Facts labels — echinacea products were specifically affected",
  },
  {
    ingredient: "fenugreek",
    patterns: ["%fenugreek%"],
    actionTitle:
      "Herbal Supplement Line Recall — Unapproved Drug Claims & Missing Supplement Facts",
    actionType: "recall",
    actionDate: "2025-12-31",
    actionSummary:
      "An entire line of herbal supplements including fenugreek recalled for unapproved drug claims and missing Supplement Facts panels.",
    dmAngle:
      "the FDA recalled an entire herbal supplement line for unapproved drug claims and missing Supplement Facts labels — fenugreek products were specifically affected",
  },
  {
    ingredient: "elderberry",
    patterns: ["%elderberry%", "%sambucus%"],
    actionTitle:
      "Organic Baby Bedtime Drops Recall — Yeast Contamination (Elderberry)",
    actionType: "recall",
    actionDate: "2025-10-15",
    actionSummary:
      "Elderberry + vitamin C liquid supplement for infants recalled multiple times for yeast contamination.",
    dmAngle:
      "an elderberry supplement was recalled multiple times for yeast contamination — and it was marketed to infants, which means heightened FDA scrutiny on elderberry products going forward",
  },
  {
    ingredient: "chaga",
    patterns: ["%chaga%", "%lion%s mane%", "%reishi%"],
    actionTitle:
      "Chaga Mushroom Supplement Recall — Anti-Cancer Claims & Missing Supplement Facts",
    actionType: "recall",
    actionDate: "2025-12-31",
    actionSummary:
      "Chaga mushroom supplement recalled for making anti-cancer claims and missing its Supplement Facts panel entirely.",
    dmAngle:
      "the FDA recalled a mushroom supplement for anti-cancer claims and a missing Supplement Facts label — the claims crackdown is hitting the functional mushroom category hard",
  },
  {
    ingredient: "senna",
    patterns: ["%senna%"],
    actionTitle:
      "Celebration Herbals Senna Leaf Tea Recall — Potential Salmonella",
    actionType: "recall",
    actionDate: "2025-12-24",
    actionSummary:
      "Senna leaf herbal tea recalled for possible Salmonella contamination.",
    dmAngle:
      "a senna leaf tea was recalled for potential Salmonella contamination — senna products are already under scrutiny for laxative-related structure/function claims",
  },
  {
    ingredient: "fish_oil",
    patterns: ["%fish oil%", "%omega-3%", "%omega 3%"],
    actionTitle:
      "Hi-Tech Pharmaceuticals Fish Oil Recall — Unapproved Drug Claims",
    actionType: "recall",
    actionDate: "2025-09-24",
    actionSummary:
      "Fish oil supplement recalled for claims like 'supports cardiovascular health' and 'may help with joint pain' deemed unapproved drug claims.",
    dmAngle:
      "a fish oil supplement was recalled because claims like 'supports cardiovascular health' were deemed unapproved drug claims — a lot of omega-3 brands make these exact claims",
  },
  {
    ingredient: "colostrum_allergen",
    patterns: ["%colostrum%"],
    actionTitle:
      "Two Colostrum Supplement Recalls — Undeclared Milk Allergen (Feb 2026)",
    actionType: "recall",
    actionDate: "2026-02-25",
    actionSummary:
      "Two separate colostrum supplements recalled in February for failing to declare milk as an allergen — colostrum is a milk product.",
    dmAngle:
      "two colostrum supplements were recalled in February for undeclared milk allergen — the FDA considers colostrum a milk product, and a lot of colostrum brands may not be declaring the allergen correctly",
  },
];

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

function writeJsonOutput(records: Record<string, any>[]): void {
  const jsonPath = resolve(process.cwd(), "scripts/outreach/demo-output/outreach-targets.json");
  const { writeFileSync, mkdirSync } = require("fs");
  mkdirSync(resolve(process.cwd(), "scripts/outreach/demo-output"), { recursive: true });
  writeFileSync(jsonPath, JSON.stringify(records, null, 2));
  console.log(`\n[json] Wrote ${records.length} records to ${jsonPath}`);
  console.log(`[next] Ask Claude to push these to Notion via MCP`);
}

// ---------------------------------------------------------------------------
// DM draft generator
// ---------------------------------------------------------------------------

function generateDM(
  companyName: string,
  sampleProduct: string,
  hook: FDAHook
): string {
  // Short, specific, no links, no pitch
  return `Hey — I was looking into the recent FDA ${hook.actionType === "recall" ? "recall" : hook.actionType === "rule" ? "rule change" : "warning letter"} involving ${hook.ingredient.replace("_", " ")} and noticed your ${sampleProduct} could be relevant. ${hook.dmAngle.charAt(0).toUpperCase() + hook.dmAngle.slice(1)}. Are you tracking this?`;
}

// ---------------------------------------------------------------------------
// Priority scoring
// ---------------------------------------------------------------------------

function scorePriority(
  productsAffected: number,
  totalProducts: number,
  hook: FDAHook
): "High" | "Medium" | "Low" {
  const ratio = productsAffected / totalProducts;
  const isRecall = hook.actionType === "recall";

  // High: >30% of products affected, or recall + >20%, or >5 products affected
  if (ratio > 0.3 || (isRecall && ratio > 0.2) || productsAffected > 5) {
    return "High";
  }
  // Medium: 2+ products or recall
  if (productsAffected >= 2 || isRecall) {
    return "Medium";
  }
  return "Low";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== LinkedIn Outreach Generator ===\n");
  if (dryRun) console.log("[mode] DRY RUN\n");
  if (ingredientFilter) console.log(`[filter] Ingredient: ${ingredientFilter}\n`);

  const hooks = ingredientFilter
    ? FDA_HOOKS.filter((h) => h.ingredient === ingredientFilter)
    : FDA_HOOKS;

  if (hooks.length === 0) {
    console.error(`No FDA hook found for ingredient: ${ingredientFilter}`);
    console.error(
      `Available: ${FDA_HOOKS.map((h) => h.ingredient).join(", ")}`
    );
    process.exit(1);
  }

  const allRecords: Record<string, any>[] = [];

  for (const hook of hooks) {
    console.log(
      `\n--- ${hook.ingredient.toUpperCase()} (${hook.actionType}) ---`
    );
    console.log(`  FDA action: ${hook.actionTitle}`);

    // Query dsld_ingredients for matching products

    // Step 1: Find DSLD products with the ingredient
    let ingredientQuery = supabase
      .from("dsld_ingredients")
      .select("dsld_id, ingredient_name");

    // Build OR filter for multiple patterns
    const orFilters = hook.patterns
      .map((p) => `ingredient_name.ilike.${p}`)
      .join(",");
    const { data: ingredientData, error: ingredientErr } = await ingredientQuery
      .or(orFilters)
      .limit(5000);

    if (ingredientErr) {
      console.error(`  Error querying ingredients: ${ingredientErr.message}`);
      continue;
    }
    if (!ingredientData || ingredientData.length === 0) {
      console.log(`  No DSLD products found with ${hook.ingredient}`);
      continue;
    }

    const matchedDsldIds = [...new Set(ingredientData.map((r) => r.dsld_id))];
    console.log(
      `  Found ${matchedDsldIds.length} DSLD products with ${hook.ingredient}`
    );

    // Step 2: Get companies for those products (manufacturers only)
    // Query in batches to avoid URL length limits
    const companyMap = new Map<
      string,
      { dsldIds: Set<number>; products: Set<string> }
    >();

    const BATCH = 200;
    for (let i = 0; i < matchedDsldIds.length; i += BATCH) {
      const batch = matchedDsldIds.slice(i, i + BATCH);
      const { data: companyData } = await supabase
        .from("dsld_companies")
        .select("dsld_id, company_name")
        .in("dsld_id", batch)
        .eq("is_manufacturer", true);

      if (companyData) {
        for (const row of companyData) {
          const existing = companyMap.get(row.company_name);
          if (existing) {
            existing.dsldIds.add(row.dsld_id);
          } else {
            companyMap.set(row.company_name, {
              dsldIds: new Set([row.dsld_id]),
              products: new Set(),
            });
          }
        }
      }
    }

    // Step 3: Get product names + total product counts per company
    for (const [companyName, info] of companyMap) {
      // Get total products for this manufacturer
      const { count } = await supabase
        .from("dsld_companies")
        .select("dsld_id", { count: "exact", head: true })
        .eq("company_name", companyName)
        .eq("is_manufacturer", true);

      const totalProducts = count ?? 0;

      // Filter: 3-200 total products, at least 1 with the ingredient
      if (totalProducts < 3 || totalProducts > 200 || info.dsldIds.size < 1) {
        companyMap.delete(companyName);
        continue;
      }

      // Get product names for the matched dsld_ids
      const sampleIds = [...info.dsldIds].slice(0, 8);
      const { data: productData } = await supabase
        .from("dsld_products")
        .select("product_name")
        .in("dsld_id", sampleIds);

      if (productData) {
        for (const p of productData) {
          info.products.add(p.product_name);
        }
      }

      // Pick the best product name for the DM — prefer one that mentions the ingredient
      const allProductNames = [...info.products];
      const ingredientWords = hook.ingredient.replace("_", " ").split(" ");
      const bestProduct =
        allProductNames.find((name) =>
          ingredientWords.some((w) => name.toLowerCase().includes(w.toLowerCase()))
        ) ?? allProductNames[0] ?? companyName;
      const sampleProducts = allProductNames.slice(0, 3);
      const priority = scorePriority(info.dsldIds.size, totalProducts, hook);

      const record: Record<string, any> = {
        Company: companyName,
        "Total Products": totalProducts,
        "Ingredient Hook": hook.ingredient.replace("_", " "),
        "Products Affected": info.dsldIds.size,
        "Sample Products": sampleProducts.join("\n"),
        "FDA Action": hook.actionTitle,
        "FDA Action Type": hook.actionType,
        "FDA Action Date": hook.actionDate,
        "DM 1 Draft": generateDM(companyName, bestProduct, hook),
        Status: "Not Started",
        Priority: priority,
      };

      allRecords.push(record);
    }

    console.log(
      `  ${[...companyMap].length} companies qualify (5-50 products, 2+ matches)`
    );
  }

  // Sort by priority (High > Medium > Low), then by products affected
  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
  allRecords.sort((a, b) => {
    const pa = priorityOrder[a.Priority as keyof typeof priorityOrder] ?? 2;
    const pb = priorityOrder[b.Priority as keyof typeof priorityOrder] ?? 2;
    if (pa !== pb) return pa - pb;
    return (b["Products Affected"] ?? 0) - (a["Products Affected"] ?? 0);
  });

  // Apply limit
  const finalRecords = allRecords.slice(0, limit);

  console.log(`\n=== RESULTS: ${finalRecords.length} outreach targets ===\n`);

  // Print summary
  const byIngredient = new Map<string, number>();
  const byPriority = new Map<string, number>();
  for (const r of finalRecords) {
    byIngredient.set(
      r["Ingredient Hook"],
      (byIngredient.get(r["Ingredient Hook"]) ?? 0) + 1
    );
    byPriority.set(r.Priority, (byPriority.get(r.Priority) ?? 0) + 1);
  }

  console.log("By ingredient:");
  for (const [k, v] of byIngredient) console.log(`  ${k}: ${v}`);
  console.log("\nBy priority:");
  for (const [k, v] of byPriority) console.log(`  ${k}: ${v}`);

  // Print top 10 for preview
  console.log("\nTop 10 targets:");
  for (const r of finalRecords.slice(0, 10)) {
    console.log(
      `  [${r.Priority}] ${r.Company} — ${r["Products Affected"]}/${r["Total Products"]} products (${r["Ingredient Hook"]})`
    );
  }

  // Always write JSON output
  if (!dryRun) {
    writeJsonOutput(finalRecords);
  }
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
