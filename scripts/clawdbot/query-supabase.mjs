#!/usr/bin/env node
/**
 * query-supabase.mjs — Query enriched regulatory items from Supabase
 *
 * Usage:
 *   node query-supabase.mjs --days 7 --enriched-only
 *   node query-supabase.mjs --type warning_letter --days 14 --limit 20
 *   node query-supabase.mjs --days 7 --enriched-only --summary
 *
 * Flags:
 *   --days N          Items from last N days (default: 7)
 *   --type TYPE       Filter by item_type (warning_letter, federal_register, recall, rss)
 *   --limit N         Max results (default: 50)
 *   --enriched-only   Only items with enrichment data
 *   --summary         Include enrichment summary (title, action_type, segments, substances)
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
    days: { type: "string", default: "7" },
    type: { type: "string" },
    limit: { type: "string", default: "50" },
    "enriched-only": { type: "boolean", default: false },
    summary: { type: "boolean", default: false },
  },
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const days = parseInt(args.days, 10);
const limit = parseInt(args.limit, 10);
const since = new Date(Date.now() - days * 86400000).toISOString();

// Build query
let query = supabase
  .from("regulatory_items")
  .select(
    args.summary
      ? `id, external_id, item_type, title, source_url, published_date, created_at,
         item_enrichments (
           enrichment_title, regulatory_action_type, urgency_level, deadline,
           segment_impacts (segment_name, impact_level, signal_source),
           regulatory_item_substances (substance_name, context),
           item_enrichment_tags (tag_dimension, tag_value, signal_source)
         )`
      : `id, external_id, item_type, title, source_url, published_date, content_snippet, created_at`
  )
  .gte("created_at", since)
  .order("created_at", { ascending: false })
  .limit(limit);

if (args.type) {
  query = query.eq("item_type", args.type);
}

if (args["enriched-only"]) {
  query = query.not("item_enrichments", "is", null);
}

const { data, error } = await query;

if (error) {
  console.error("Supabase query error:", error.message);
  process.exit(1);
}

// For enriched-only, filter out items with no enrichments (left join returns null)
const results = args["enriched-only"]
  ? data.filter((item) => {
      if (args.summary) {
        return item.item_enrichments && item.item_enrichments.length > 0;
      }
      return true;
    })
  : data;

console.log(JSON.stringify({ count: results.length, items: results }, null, 2));
