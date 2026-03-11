#!/usr/bin/env node
/**
 * query-intelligence.mjs — Query intelligence pages from Supabase
 *
 * Usage:
 *   node query-intelligence.mjs --status needs_refresh
 *   node query-intelligence.mjs --page-type ingredient --status published --limit 10
 *   node query-intelligence.mjs --status draft
 *
 * Flags:
 *   --page-type   Filter by page type (ingredient, enforcement, regulation)
 *   --status      Filter by status (draft, published, needs_refresh)
 *   --limit       Max results (default: 50)
 *
 * Env vars (required):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";

const { values: args } = parseArgs({
  options: {
    "page-type": { type: "string" },
    status: { type: "string" },
    limit: { type: "string", default: "50" },
  },
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

let query = supabase
  .from("intelligence_pages")
  .select("id, page_type, slug, title, excerpt, status, published_at, last_refreshed_at, refresh_reason, word_count")
  .order("updated_at", { ascending: false })
  .limit(parseInt(args.limit, 10));

if (args["page-type"]) {
  query = query.eq("page_type", args["page-type"]);
}

if (args.status) {
  query = query.eq("status", args.status);
}

const { data, error } = await query;

if (error) {
  console.error("Query error:", error.message);
  process.exit(1);
}

console.log(JSON.stringify(data, null, 2));
console.error(`\n${data.length} page(s) found`);
