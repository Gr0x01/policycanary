#!/usr/bin/env npx tsx
/**
 * LinkedIn Outreach Generator
 *
 * Queries DSLD for supplement companies whose products contain ingredients
 * subject to recent FDA actions, generates personalized DM cheat sheets,
 * and pushes to Airtable for tracking.
 *
 * Usage:
 *   npx tsx scripts/linkedin-outreach.ts                    # Full run
 *   npx tsx scripts/linkedin-outreach.ts --dry-run          # Preview without Airtable push
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

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = "appaGh4aKp9sEswAW";
const AIRTABLE_TABLE_NAME = "LinkedIn Outreach";

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
  : 100;

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
];

// ---------------------------------------------------------------------------
// Airtable helpers
// ---------------------------------------------------------------------------

async function airtableFetch(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const resp = await fetch(`https://api.airtable.com/v0${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Airtable ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function ensureTable(): Promise<string> {
  // Check if table exists
  const meta = await airtableFetch(
    `/meta/bases/${AIRTABLE_BASE_ID}/tables`
  );
  const existing = meta.tables.find(
    (t: any) => t.name === AIRTABLE_TABLE_NAME
  );
  if (existing) {
    console.log(`[airtable] Using existing table: ${AIRTABLE_TABLE_NAME}`);
    return existing.id;
  }

  // Create table with fields
  console.log(`[airtable] Creating table: ${AIRTABLE_TABLE_NAME}`);
  const result = await airtableFetch(
    `/meta/bases/${AIRTABLE_BASE_ID}/tables`,
    {
      method: "POST",
      body: JSON.stringify({
        name: AIRTABLE_TABLE_NAME,
        fields: [
          { name: "Company", type: "singleLineText" },
          { name: "Total Products", type: "number", options: { precision: 0 } },
          { name: "Ingredient Hook", type: "singleLineText" },
          {
            name: "Products Affected",
            type: "number",
            options: { precision: 0 },
          },
          { name: "Sample Products", type: "multilineText" },
          { name: "FDA Action", type: "singleLineText" },
          { name: "FDA Action Type", type: "singleLineText" },
          { name: "FDA Action Date", type: "date", options: { dateFormat: { name: "us" } } },
          { name: "DM 1 Draft", type: "multilineText" },
          { name: "LinkedIn Person", type: "singleLineText" },
          { name: "LinkedIn URL", type: "url" },
          { name: "Person Title", type: "singleLineText" },
          {
            name: "Status",
            type: "singleSelect",
            options: {
              choices: [
                { name: "Not Started", color: "grayLight2" },
                { name: "DM Sent", color: "blueLight2" },
                { name: "Replied", color: "greenLight2" },
                { name: "Meeting Set", color: "purpleLight2" },
                { name: "Not Interested", color: "redLight2" },
                { name: "Signed Up", color: "yellowLight2" },
              ],
            },
          },
          {
            name: "Priority",
            type: "singleSelect",
            options: {
              choices: [
                { name: "High", color: "redLight2" },
                { name: "Medium", color: "yellowLight2" },
                { name: "Low", color: "grayLight2" },
              ],
            },
          },
          { name: "Notes", type: "multilineText" },
        ],
      }),
    }
  );
  console.log(`[airtable] Created table: ${result.id}`);
  return result.id;
}

async function pushRecords(
  tableId: string,
  records: Record<string, any>[]
): Promise<void> {
  // Airtable max 10 records per request
  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10).map((fields) => ({ fields }));
    await airtableFetch(`/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`, {
      method: "POST",
      body: JSON.stringify({ records: batch }),
    });
    console.log(
      `[airtable] Pushed ${Math.min(i + 10, records.length)}/${records.length} records`
    );
  }
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
  if (dryRun) console.log("[mode] DRY RUN — no Airtable push\n");
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

      // Filter: 5-50 total products, at least 2 with the ingredient
      if (totalProducts < 5 || totalProducts > 50 || info.dsldIds.size < 2) {
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

  // If --json flag, dump full data for subagent DM generation
  if (args.includes("--json")) {
    const jsonPath = resolve(process.cwd(), "scripts/demo-output/outreach-targets.json");
    const { writeFileSync, mkdirSync } = await import("fs");
    mkdirSync(resolve(process.cwd(), "scripts/demo-output"), { recursive: true });
    writeFileSync(jsonPath, JSON.stringify(finalRecords, null, 2));
    console.log(`\n[json] Wrote ${finalRecords.length} records to ${jsonPath}`);
  }

  // Print top 10 for preview
  console.log("\nTop 10 targets:");
  for (const r of finalRecords.slice(0, 10)) {
    console.log(
      `  [${r.Priority}] ${r.Company} — ${r["Products Affected"]}/${r["Total Products"]} products (${r["Ingredient Hook"]})`
    );
  }

  // Push to Airtable
  if (!dryRun && AIRTABLE_TOKEN) {
    console.log("\n--- Pushing to Airtable ---");
    try {
      const tableId = await ensureTable();
      await pushRecords(tableId, finalRecords);
      console.log(
        `\n[done] ${finalRecords.length} records pushed to Airtable "${AIRTABLE_TABLE_NAME}"`
      );
    } catch (err: any) {
      console.error(`[airtable] Error: ${err.message}`);
      console.log(
        "[airtable] Records generated but not pushed. Run again or check token."
      );
    }
  } else if (!AIRTABLE_TOKEN) {
    console.log("\n[skip] No AIRTABLE_TOKEN — skipping Airtable push");
  } else {
    console.log("\n[dry-run] Skipping Airtable push");
  }
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
