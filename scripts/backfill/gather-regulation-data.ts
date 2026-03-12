/**
 * gather-regulation-data.ts
 *
 * Pure data gathering — NO LLM calls.
 * Queries items by regulation-related enrichment tags,
 * outputs JSON context files for subagent-driven content generation.
 *
 * Usage:
 *   npx tsx scripts/backfill/gather-regulation-data.ts
 *   npx tsx scripts/backfill/gather-regulation-data.ts --regulation "MoCRA"
 *   npx tsx scripts/backfill/gather-regulation-data.ts --output-dir /tmp/regulations
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
    regulation: { type: "string" },
    "output-dir": { type: "string", default: "scripts/backfill/output/regulations" },
  },
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const outputDir = resolve(process.cwd(), args["output-dir"]!);
mkdirSync(outputDir, { recursive: true });

// Curated regulation list from research
const DEFAULT_REGULATIONS = [
  { name: "MoCRA", searchTerms: ["MoCRA", "Modernization of Cosmetics Regulation"] },
  { name: "FSMA 204", searchTerms: ["FSMA 204", "Food Traceability Rule"] },
  { name: "Red No. 3 Ban", searchTerms: ["Red No. 3", "FD&C Red No. 3", "erythrosine"] },
  { name: "Food Dye Phase-Out", searchTerms: ["food dye", "artificial color", "color additive"] },
  { name: "GRAS Reform", searchTerms: ["GRAS", "Generally Recognized as Safe"] },
  { name: "Section 781 Hemp CBD", searchTerms: ["Section 781", "hemp", "CBD regulation"] },
  { name: "Front-of-Pack Labeling", searchTerms: ["front-of-pack", "nutrition label"] },
  { name: "Dietary Supplement GMP", searchTerms: ["21 CFR 111", "supplement GMP", "dietary supplement manufacturing"] },
  { name: "PFAS Food Contact", searchTerms: ["PFAS", "food contact", "per- and polyfluoroalkyl"] },
  { name: "Ultra-Processed Food", searchTerms: ["ultra-processed", "UPF", "processed food definition"] },
];

async function gatherRegulationData(regulation: { name: string; searchTerms: string[] }) {
  console.log(`\nGathering data for: ${regulation.name}`);

  // Search for items by enrichment tags matching regulation terms
  const allItemIds = new Set<string>();

  for (const term of regulation.searchTerms) {
    // Search enrichment tags
    const { data: tags } = await supabase
      .from("item_enrichment_tags")
      .select("item_id")
      .ilike("tag_value", `%${term}%`)
      .limit(200);

    if (tags) {
      for (const t of tags) allItemIds.add(t.item_id);
    }

    // Also search item titles directly
    const { data: titleMatches } = await supabase
      .from("regulatory_items")
      .select("id")
      .ilike("title", `%${term}%`)
      .limit(200);

    if (titleMatches) {
      for (const t of titleMatches) allItemIds.add(t.id);
    }
  }

  const itemIds = Array.from(allItemIds);
  if (itemIds.length === 0) {
    console.warn(`  No items found for "${regulation.name}"`);
    return null;
  }

  console.log(`  Found ${itemIds.length} related items`);

  // Get regulatory items
  const allItems = [];
  for (let i = 0; i < itemIds.length; i += 100) {
    const batch = itemIds.slice(i, i + 100);
    const { data: items } = await supabase
      .from("regulatory_items")
      .select(
        "id, title, item_type, published_date, source_url, issuing_office, effective_date, comment_deadline, cfr_references"
      )
      .in("id", batch)
      .order("published_date", { ascending: false });
    if (items) allItems.push(...items);
  }

  // Get enrichments
  const allEnrichments = [];
  for (let i = 0; i < itemIds.length; i += 100) {
    const batch = itemIds.slice(i, i + 100);
    const { data: enrichments } = await supabase
      .from("item_enrichments")
      .select("id, item_id, summary, key_regulations, key_entities, regulatory_action_type, deadline")
      .in("item_id", batch);
    if (enrichments) allEnrichments.push(...enrichments);
  }

  // Get all enrichment tags
  const allTags = [];
  for (let i = 0; i < itemIds.length; i += 100) {
    const batch = itemIds.slice(i, i + 100);
    const { data: tags } = await supabase
      .from("item_enrichment_tags")
      .select("item_id, tag_dimension, tag_value, signal_source")
      .in("item_id", batch);
    if (tags) allTags.push(...tags);
  }

  // Extract affected categories from tags
  const categories = new Set<string>();
  for (const tag of allTags) {
    if (tag.tag_dimension === "product_type") {
      categories.add(tag.tag_value);
    }
  }

  // Extract CFR references
  const cfrRefs = new Set<string>();
  for (const item of allItems) {
    if (item.cfr_references && Array.isArray(item.cfr_references)) {
      for (const ref of item.cfr_references) cfrRefs.add(ref);
    }
  }

  // Key deadlines from items
  const deadlines = allItems
    .filter((i) => i.effective_date || i.comment_deadline)
    .map((i) => ({
      item_title: i.title,
      effective_date: i.effective_date,
      comment_deadline: i.comment_deadline,
    }));

  return {
    regulation_name: regulation.name,
    search_terms: regulation.searchTerms,
    item_count: allItems.length,
    affected_categories: Array.from(categories),
    cfr_references: Array.from(cfrRefs),
    key_deadlines: deadlines,
    items: allItems,
    enrichments: allEnrichments,
    tags: allTags,
  };
}

// Run
async function main() {
  const regulations = args.regulation
    ? [{ name: args.regulation, searchTerms: [args.regulation] }]
    : DEFAULT_REGULATIONS;

  console.log(`Gathering regulation data for ${regulations.length} regulations...`);
  console.log(`Output: ${outputDir}`);

  let gathered = 0;
  for (const reg of regulations) {
    try {
      const data = await gatherRegulationData(reg);
      if (data) {
        const slug = reg.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const outFile = join(outputDir, `${slug}.json`);
        writeFileSync(outFile, JSON.stringify(data, null, 2));
        console.log(`  Wrote: ${outFile}`);
        gathered++;
      }
    } catch (err) {
      console.error(`  Error gathering "${reg.name}":`, (err as Error).message);
    }
  }

  console.log(`\nDone. ${gathered}/${regulations.length} regulations gathered.`);
}

main().catch(console.error);
