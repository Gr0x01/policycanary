/**
 * gather-ingredient-data.ts
 *
 * Pure data gathering — NO LLM calls.
 * Queries Supabase for all regulatory items related to given substances,
 * outputs JSON context files for subagent-driven content generation.
 *
 * Usage:
 *   npx tsx scripts/backfill/gather-ingredient-data.ts
 *   npx tsx scripts/backfill/gather-ingredient-data.ts --substance "Red No. 3"
 *   npx tsx scripts/backfill/gather-ingredient-data.ts --output-dir /tmp/ingredients
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve, join } from "path";
import { createRequire } from "module";

// Shim "server-only"
const require = createRequire(import.meta.url);
require.cache[require.resolve("server-only")] = {
  id: "server-only",
  filename: require.resolve("server-only"),
  loaded: true,
  exports: {},
} as NodeJS.Module;

// Load .env.local
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed
      .slice(eqIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    substance: { type: "string" },
    "output-dir": { type: "string", default: "scripts/backfill/output/ingredients" },
  },
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Default substance list — high-impact ingredients from research
const DEFAULT_SUBSTANCES = [
  "Red No. 3",
  "Red 40",
  "BHA",
  "titanium dioxide",
  "Yellow 5",
  "Yellow 6",
  "Blue 1",
  "Blue 2",
  "Green 3",
  "potassium bromate",
  "propylparaben",
  "brominated vegetable oil",
  "azodicarbonamide",
  "NMN",
  "formaldehyde",
  "talc",
  "lead",
  "CBD",
  "cannabidiol",
  "kratom",
  "sucralose",
  "aspartame",
  "carrageenan",
  "sodium nitrite",
  "parabens",
];

const substances = args.substance
  ? [args.substance]
  : DEFAULT_SUBSTANCES;

const outputDir = resolve(process.cwd(), args["output-dir"]!);
mkdirSync(outputDir, { recursive: true });

async function gatherSubstanceData(substanceName: string) {
  console.log(`\nGathering data for: ${substanceName}`);

  // 1. Find substance in substances table
  const { data: substanceRows } = await supabase
    .from("substances")
    .select("id, name, unii")
    .ilike("name", `%${substanceName}%`)
    .limit(5);

  if (!substanceRows || substanceRows.length === 0) {
    console.warn(`  No substance found for "${substanceName}"`);
    return null;
  }

  const substanceIds = substanceRows.map((s) => s.id);
  console.log(`  Found ${substanceRows.length} substance match(es)`);

  // 2. Find regulatory items linked via regulatory_item_substances
  const { data: itemLinks } = await supabase
    .from("regulatory_item_substances")
    .select("item_id, substance_id, match_confidence")
    .in("substance_id", substanceIds);

  if (!itemLinks || itemLinks.length === 0) {
    console.warn(`  No regulatory items linked to "${substanceName}"`);
    return { substance: substanceRows[0], items: [], enrichments: [], tags: [] };
  }

  const itemIds = [...new Set(itemLinks.map((l) => l.item_id))];
  console.log(`  Found ${itemIds.length} linked regulatory items`);

  // 3. Get regulatory items (batch by 100)
  const allItems = [];
  for (let i = 0; i < itemIds.length; i += 100) {
    const batch = itemIds.slice(i, i + 100);
    const { data: items } = await supabase
      .from("regulatory_items")
      .select(
        "id, title, item_type, published_date, source_url, issuing_office, enforcement_company_name, enforcement_violation_types"
      )
      .in("id", batch);
    if (items) allItems.push(...items);
  }

  // 4. Get enrichments for these items
  const allEnrichments = [];
  for (let i = 0; i < itemIds.length; i += 100) {
    const batch = itemIds.slice(i, i + 100);
    const { data: enrichments } = await supabase
      .from("item_enrichments")
      .select("id, item_id, summary, impact_level, action_required, audience_tags")
      .in("item_id", batch);
    if (enrichments) allEnrichments.push(...enrichments);
  }

  // 5. Get enrichment tags for these items
  const allTags = [];
  for (let i = 0; i < itemIds.length; i += 100) {
    const batch = itemIds.slice(i, i + 100);
    const { data: tags } = await supabase
      .from("item_enrichment_tags")
      .select("item_id, tag_dimension, tag_value, signal_source")
      .in("item_id", batch);
    if (tags) allTags.push(...tags);
  }

  return {
    substance: substanceRows[0],
    all_matches: substanceRows,
    item_count: allItems.length,
    items: allItems,
    enrichments: allEnrichments,
    tags: allTags,
  };
}

// Run
console.log(`Gathering ingredient data for ${substances.length} substances...`);
console.log(`Output: ${outputDir}`);

let gathered = 0;
for (const name of substances) {
  try {
    const data = await gatherSubstanceData(name);
    if (data) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const outFile = join(outputDir, `${slug}.json`);
      writeFileSync(outFile, JSON.stringify(data, null, 2));
      console.log(`  Wrote: ${outFile}`);
      gathered++;
    }
  } catch (err) {
    console.error(`  Error gathering "${name}":`, (err as Error).message);
  }
}

console.log(`\nDone. ${gathered}/${substances.length} substances gathered.`);
