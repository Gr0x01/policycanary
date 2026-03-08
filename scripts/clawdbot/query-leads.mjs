#!/usr/bin/env node
/**
 * query-leads.mjs — Find companies cited in recent FDA enforcement that aren't subscribers
 *
 * Usage:
 *   node query-leads.mjs                          # Last 7 days, warning letters + recalls
 *   node query-leads.mjs --days 14                # Extend lookback window
 *   node query-leads.mjs --type warning_letter    # Only warning letters
 *   node query-leads.mjs --type recall            # Only recalls
 *   node query-leads.mjs --include-subscribers     # Show all, including existing subscribers
 *
 * Env vars (required):
 *   SUPABASE_URL
 *   SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)
 *
 * Outputs JSON to stdout: leads grouped by company with enforcement details.
 */

import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    days: { type: "string", default: "7" },
    type: { type: "string" },
    "include-subscribers": { type: "boolean", default: false },
  },
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const days = parseInt(args.days, 10);
const since = new Date(Date.now() - days * 86400000).toISOString();

// Step 1: Get recent enforcement items with company names
const enforcementTypes = args.type
  ? [args.type]
  : ["warning_letter", "recall"];

let query = supabase
  .from("regulatory_items")
  .select(
    `id, item_type, title, source_url, published_date, created_at,
     enforcement_company_name, enforcement_company_address, enforcement_fei_number,
     enforcement_recipient_name, enforcement_recipient_title,
     enforcement_violation_types, enforcement_cited_regulations,
     enforcement_recall_classification, enforcement_recall_status,
     enforcement_distribution_pattern, enforcement_products,
     item_enrichments (summary, regulatory_action_type, deadline),
     item_enrichment_tags (tag_dimension, tag_value)`
  )
  .in("item_type", enforcementTypes)
  .gte("published_date", since)
  .not("enforcement_company_name", "is", null)
  .order("published_date", { ascending: false })
  .limit(500);

const { data: items, error: itemsError } = await query;

if (itemsError) {
  console.error("Query error:", itemsError.message);
  process.exit(1);
}

if (!items || items.length === 0) {
  console.log(
    JSON.stringify({
      count: 0,
      leads: [],
      message: `No enforcement items with company names in last ${days} days`,
    })
  );
  process.exit(0);
}

// Step 2: Get all subscriber company names for exclusion
const { data: subscribers, error: subError } = await supabase
  .from("users")
  .select("company_name, email, fei_number")
  .not("company_name", "is", null);

if (subError) {
  console.error("Subscriber query error:", subError.message);
  process.exit(1);
}

const subscriberCompanies = new Set(
  (subscribers || []).map((s) => s.company_name?.toLowerCase().trim())
);
const subscriberFEIs = new Set(
  (subscribers || [])
    .filter((s) => s.fei_number)
    .map((s) => s.fei_number.trim())
);

// Step 3: Group items by company and filter out subscribers
const companyMap = new Map();

for (const item of items) {
  const companyName = item.enforcement_company_name.trim();
  const companyKey = companyName.toLowerCase();
  const fei = item.enforcement_fei_number?.trim();

  const isSubscriber =
    subscriberCompanies.has(companyKey) ||
    (fei && subscriberFEIs.has(fei));

  if (!args["include-subscribers"] && isSubscriber) continue;

  if (!companyMap.has(companyKey)) {
    companyMap.set(companyKey, {
      company_name: companyName,
      fei_number: fei || null,
      address: item.enforcement_company_address || null,
      is_subscriber: isSubscriber,
      actions: [],
      product_categories: new Set(),
    });
  }

  const entry = companyMap.get(companyKey);

  // Extract product categories from tags (joined directly on regulatory_items)
  const categories = [];
  if (item.item_enrichment_tags?.length > 0) {
    for (const tag of item.item_enrichment_tags) {
      if (tag.tag_dimension === "product_type") {
        categories.push(tag.tag_value);
        entry.product_categories.add(tag.tag_value);
      }
    }
  }

  entry.actions.push({
    id: item.id,
    type: item.item_type,
    title: item.title,
    source_url: item.source_url,
    published_date: item.published_date,
    recipient: item.enforcement_recipient_name
      ? `${item.enforcement_recipient_name}${item.enforcement_recipient_title ? `, ${item.enforcement_recipient_title}` : ""}`
      : null,
    violations: item.enforcement_violation_types || [],
    regulations: item.enforcement_cited_regulations || [],
    products: item.enforcement_products || [],
    recall_class: item.enforcement_recall_classification || null,
    recall_status: item.enforcement_recall_status || null,
    distribution: item.enforcement_distribution_pattern || null,
    summary:
      item.item_enrichments?.[0]?.summary || null,
    action_type:
      item.item_enrichments?.[0]?.regulatory_action_type || null,
    deadline: item.item_enrichments?.[0]?.deadline || null,
    categories,
  });
}

// Convert to array, serialize sets
const leads = Array.from(companyMap.values())
  .map((lead) => ({
    ...lead,
    product_categories: Array.from(lead.product_categories),
    action_count: lead.actions.length,
  }))
  .sort((a, b) => b.action_count - a.action_count);

console.log(
  JSON.stringify(
    {
      count: leads.length,
      period_days: days,
      types: enforcementTypes,
      total_enforcement_items: items.length,
      subscribers_excluded: !args["include-subscribers"],
      leads,
    },
    null,
    2
  )
);
