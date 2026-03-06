#!/usr/bin/env node
/**
 * query-analytics.mjs — Aggregate analytics from enriched regulatory data
 *
 * Usage:
 *   node query-analytics.mjs --report weekly        # Weekly stats summary
 *   node query-analytics.mjs --report trends        # Quarterly trend data
 *   node query-analytics.mjs --report substances    # Top substances (optionally filtered)
 *   node query-analytics.mjs --report allergens     # Allergen recall breakdown
 *   node query-analytics.mjs --report categories    # Top product categories
 *   node query-analytics.mjs --report deadlines     # Upcoming deadlines
 *   node query-analytics.mjs --report substance-detail --substance "SEMAGLUTIDE"
 *   node query-analytics.mjs --report all           # Everything (for weekly roundup context)
 *
 * Env vars (required):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Outputs JSON to stdout.
 */

import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    report: { type: "string", default: "weekly" },
    substance: { type: "string" },
    days: { type: "string", default: "7" },
    category: { type: "string" },
  },
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runSQL(query) {
  const { data, error } = await supabase.rpc("exec_sql", { query });
  if (error) {
    // Fallback: use REST-based approach
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`SQL error: ${await res.text()}`);
    return await res.json();
  }
  return data;
}

// Direct Supabase queries instead of raw SQL (works without exec_sql RPC)

async function weeklyStats(days) {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // Item counts by type
  const { data: items } = await supabase
    .from("regulatory_items")
    .select("item_type")
    .gte("published_date", since.split("T")[0]);

  const typeCounts = {};
  for (const item of items || []) {
    typeCounts[item.item_type] = (typeCounts[item.item_type] || 0) + 1;
  }

  // Action type counts from enrichments
  const { data: enrichments } = await supabase
    .from("item_enrichments")
    .select("regulatory_action_type, item_id, regulatory_items!inner(published_date)")
    .gte("regulatory_items.published_date", since.split("T")[0]);

  const actionCounts = {};
  for (const e of enrichments || []) {
    if (e.regulatory_action_type) {
      actionCounts[e.regulatory_action_type] = (actionCounts[e.regulatory_action_type] || 0) + 1;
    }
  }

  // Top substances this period
  const { data: subs } = await supabase
    .from("regulatory_item_substances")
    .select("substance_id, raw_substance_name, regulatory_items!inner(published_date)")
    .gte("regulatory_items.published_date", since.split("T")[0]);

  const subCounts = {};
  for (const s of subs || []) {
    const name = s.raw_substance_name || s.substance_id;
    subCounts[name] = (subCounts[name] || 0) + 1;
  }
  const topSubstances = Object.entries(subCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, count]) => ({ name, count }));

  // Top categories this period
  const { data: tags } = await supabase
    .from("item_enrichment_tags")
    .select("tag_value, regulatory_items!inner(published_date)")
    .eq("tag_dimension", "product_type")
    .gte("regulatory_items.published_date", since.split("T")[0]);

  const catCounts = {};
  for (const t of tags || []) {
    catCounts[t.tag_value] = (catCounts[t.tag_value] || 0) + 1;
  }
  const topCategories = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([category, count]) => ({ category, count }));

  return {
    period: `last_${days}_days`,
    total_items: items?.length || 0,
    by_type: typeCounts,
    by_action: actionCounts,
    top_substances: topSubstances,
    top_categories: topCategories,
  };
}

async function quarterlyTrends() {
  const { data: items } = await supabase
    .from("regulatory_items")
    .select("item_type, published_date")
    .gte("published_date", "2024-03-01")
    .order("published_date");

  const quarters = {};
  for (const item of items || []) {
    const d = new Date(item.published_date);
    const q = `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`;
    if (!quarters[q]) quarters[q] = {};
    quarters[q][item.item_type] = (quarters[q][item.item_type] || 0) + 1;
  }

  return { quarterly_trends: quarters };
}

async function topSubstances(limit = 30) {
  const { data } = await supabase
    .from("regulatory_item_substances")
    .select("substance_id, raw_substance_name");

  const counts = {};
  const names = {};
  for (const s of data || []) {
    const id = s.substance_id || s.raw_substance_name;
    counts[id] = (counts[id] || 0) + 1;
    if (s.raw_substance_name) names[id] = s.raw_substance_name;
  }

  return {
    top_substances: Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id, count]) => ({ substance: names[id] || id, count })),
  };
}

async function allergenBreakdown() {
  const allergens = [
    "COW MILK", "WHEAT", "SOYBEAN", "EGG", "PEANUT", "ALMOND",
    "SESAME SEED", "FISH, UNSPECIFIED", "PECAN", "WALNUT",
    "CASHEW NUT", "COCONUT", "CRUSTACEAN SHELLFISH",
  ];

  const { data } = await supabase
    .from("regulatory_item_substances")
    .select("raw_substance_name, regulatory_items!inner(item_type)")
    .in("raw_substance_name", allergens);

  const results = {};
  for (const row of data || []) {
    const name = row.raw_substance_name;
    if (!results[name]) results[name] = { total: 0, recalls: 0, warning_letters: 0, other: 0 };
    results[name].total++;
    const type = row.regulatory_items?.item_type;
    if (type === "recall") results[name].recalls++;
    else if (type === "warning_letter") results[name].warning_letters++;
    else results[name].other++;
  }

  return {
    allergen_breakdown: Object.entries(results)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([allergen, stats]) => ({ allergen, ...stats })),
  };
}

async function topCategories(limit = 30) {
  const { data } = await supabase
    .from("item_enrichment_tags")
    .select("tag_value, signal_source")
    .eq("tag_dimension", "product_type");

  const counts = {};
  const crossRefCounts = {};
  for (const t of data || []) {
    counts[t.tag_value] = (counts[t.tag_value] || 0) + 1;
    if (t.signal_source === "cross_reference") {
      crossRefCounts[t.tag_value] = (crossRefCounts[t.tag_value] || 0) + 1;
    }
  }

  return {
    top_categories: Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([category, count]) => ({
        category,
        total: count,
        cross_referenced: crossRefCounts[category] || 0,
      })),
  };
}

async function upcomingDeadlines() {
  const now = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("item_enrichments")
    .select("deadline, enrichment_title, regulatory_action_type, regulatory_items!inner(title, item_type, source_url)")
    .gte("deadline", now)
    .order("deadline")
    .limit(20);

  return {
    upcoming_deadlines: (data || []).map((d) => ({
      deadline: d.deadline,
      title: d.enrichment_title || d.regulatory_items?.title,
      item_type: d.regulatory_items?.item_type,
      action_type: d.regulatory_action_type,
      source_url: d.regulatory_items?.source_url,
    })),
  };
}

async function substanceDetail(substanceName) {
  if (!substanceName) {
    console.error("--substance required for substance-detail report");
    process.exit(1);
  }

  const { data } = await supabase
    .from("regulatory_item_substances")
    .select(`
      raw_substance_name,
      regulatory_items!inner(id, title, item_type, published_date, source_url,
        item_enrichments(regulatory_action_type, urgency_level, deadline))
    `)
    .ilike("raw_substance_name", `%${substanceName}%`);

  const byType = {};
  const byQuarter = {};
  const items = [];

  for (const row of data || []) {
    const ri = row.regulatory_items;
    const type = ri.item_type;
    byType[type] = (byType[type] || 0) + 1;

    const d = new Date(ri.published_date);
    const q = `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`;
    byQuarter[q] = (byQuarter[q] || 0) + 1;

    items.push({
      title: ri.title,
      type: ri.item_type,
      date: ri.published_date,
      source_url: ri.source_url,
      action_type: ri.item_enrichments?.[0]?.regulatory_action_type,
      urgency: ri.item_enrichments?.[0]?.urgency_level,
    });
  }

  return {
    substance: substanceName,
    total_items: data?.length || 0,
    by_type: byType,
    by_quarter: byQuarter,
    recent_items: items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
  };
}

async function recallClassifications() {
  const { data } = await supabase
    .from("regulatory_items")
    .select("enforcement_recall_classification")
    .eq("item_type", "recall")
    .not("enforcement_recall_classification", "is", null);

  const counts = {};
  for (const row of data || []) {
    const cls = row.enforcement_recall_classification;
    counts[cls] = (counts[cls] || 0) + 1;
  }

  return { recall_classifications: counts };
}

// Main
const report = args.report;
const days = parseInt(args.days, 10);
let result;

try {
  if (report === "weekly") {
    result = await weeklyStats(days);
  } else if (report === "trends") {
    result = await quarterlyTrends();
  } else if (report === "substances") {
    result = await topSubstances();
  } else if (report === "allergens") {
    result = await allergenBreakdown();
  } else if (report === "categories") {
    result = await topCategories();
  } else if (report === "deadlines") {
    result = await upcomingDeadlines();
  } else if (report === "substance-detail") {
    result = await substanceDetail(args.substance);
  } else if (report === "recalls") {
    result = await recallClassifications();
  } else if (report === "all") {
    const [weekly, trends, substances, allergens, categories, deadlines, recalls] =
      await Promise.all([
        weeklyStats(days),
        quarterlyTrends(),
        topSubstances(15),
        allergenBreakdown(),
        topCategories(15),
        upcomingDeadlines(),
        recallClassifications(),
      ]);
    result = { weekly, trends, substances, allergens, categories, deadlines, recalls };
  } else {
    console.error(`Unknown report: ${report}. Use: weekly, trends, substances, allergens, categories, deadlines, substance-detail, recalls, all`);
    process.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
