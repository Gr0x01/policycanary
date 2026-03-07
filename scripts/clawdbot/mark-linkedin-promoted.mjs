#!/usr/bin/env node
/**
 * mark-linkedin-promoted.mjs — Mark a blog post as promoted on LinkedIn
 *
 * Usage:
 *   node mark-linkedin-promoted.mjs --slug "fda-recall-trends-2026"
 *
 * Env vars (required):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    slug: { type: "string" },
  },
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!args.slug) {
  console.error("Required: --slug");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const { data, error } = await supabase
  .from("blog_posts")
  .update({ linkedin_promoted_at: new Date().toISOString() })
  .eq("slug", args.slug)
  .select("slug, title, linkedin_promoted_at")
  .single();

if (error) {
  console.error("Update error:", error.message);
  process.exit(1);
}

console.log(`Marked as promoted: "${data.title}" (${data.slug}) at ${data.linkedin_promoted_at}`);
