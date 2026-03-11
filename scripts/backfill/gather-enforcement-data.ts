/**
 * gather-enforcement-data.ts
 *
 * Pure data gathering — NO LLM calls.
 * Queries distinct companies with enforcement actions from 2025+,
 * outputs JSON context files for subagent-driven content generation.
 *
 * Usage:
 *   npx tsx scripts/backfill/gather-enforcement-data.ts
 *   npx tsx scripts/backfill/gather-enforcement-data.ts --company "ByHeart"
 *   npx tsx scripts/backfill/gather-enforcement-data.ts --min-actions 2 --output-dir /tmp/enforcement
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
    company: { type: "string" },
    "min-actions": { type: "string", default: "1" },
    "output-dir": { type: "string", default: "scripts/backfill/output/enforcement" },
  },
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const outputDir = resolve(process.cwd(), args["output-dir"]!);
mkdirSync(outputDir, { recursive: true });

async function getCompanies(): Promise<string[]> {
  if (args.company) return [args.company];

  // Get distinct companies from enforcement items since 2025
  const { data, error } = await supabase
    .from("regulatory_items")
    .select("enforcement_company_name")
    .in("item_type", ["warning_letter", "recall", "import_alert", "483_observation"])
    .gte("published_date", "2025-01-01")
    .not("enforcement_company_name", "is", null);

  if (error || !data) {
    console.error("Error fetching companies:", error?.message);
    return [];
  }

  // Count occurrences and filter by min actions
  const counts = new Map<string, number>();
  for (const row of data) {
    const name = row.enforcement_company_name as string;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  const minActions = parseInt(args["min-actions"]!, 10);
  return Array.from(counts.entries())
    .filter(([, count]) => count >= minActions)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
}

async function gatherCompanyData(companyName: string) {
  console.log(`\nGathering data for: ${companyName}`);

  // Get all enforcement items for this company
  const { data: items } = await supabase
    .from("regulatory_items")
    .select(
      "id, title, item_type, published_date, source_url, issuing_office, enforcement_company_name, enforcement_violation_types"
    )
    .eq("enforcement_company_name", companyName)
    .order("published_date", { ascending: false });

  if (!items || items.length === 0) {
    console.warn(`  No items found for "${companyName}"`);
    return null;
  }

  console.log(`  Found ${items.length} enforcement items`);

  const itemIds = items.map((i) => i.id);

  // Get enrichments
  const allEnrichments = [];
  for (let i = 0; i < itemIds.length; i += 100) {
    const batch = itemIds.slice(i, i + 100);
    const { data: enrichments } = await supabase
      .from("item_enrichments")
      .select("id, item_id, summary, impact_level, action_required, audience_tags")
      .in("item_id", batch);
    if (enrichments) allEnrichments.push(...enrichments);
  }

  // Get enrichment tags
  const allTags = [];
  for (let i = 0; i < itemIds.length; i += 100) {
    const batch = itemIds.slice(i, i + 100);
    const { data: tags } = await supabase
      .from("item_enrichment_tags")
      .select("item_id, tag_dimension, tag_value, signal_source")
      .in("item_id", batch);
    if (tags) allTags.push(...tags);
  }

  // Summarize action types
  const actionTypes: Record<string, number> = {};
  const violationTypes = new Set<string>();
  for (const item of items) {
    actionTypes[item.item_type] = (actionTypes[item.item_type] ?? 0) + 1;
    if (item.enforcement_violation_types) {
      for (const v of item.enforcement_violation_types) violationTypes.add(v);
    }
  }

  const dates = items.map((i) => i.published_date).filter(Boolean).sort();

  return {
    company_name: companyName,
    total_actions: items.length,
    action_types: actionTypes,
    violation_types: Array.from(violationTypes),
    date_range: {
      earliest: dates[0] ?? null,
      latest: dates[dates.length - 1] ?? null,
    },
    items,
    enrichments: allEnrichments,
    tags: allTags,
  };
}

// Run
const companies = await getCompanies();
console.log(`Gathering enforcement data for ${companies.length} companies...`);
console.log(`Output: ${outputDir}`);

let gathered = 0;
for (const name of companies) {
  try {
    const data = await gatherCompanyData(name);
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

console.log(`\nDone. ${gathered}/${companies.length} companies gathered.`);
