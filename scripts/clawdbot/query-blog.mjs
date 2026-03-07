#!/usr/bin/env node
/**
 * query-blog.mjs — Query published blog posts from Supabase
 *
 * Usage:
 *   node query-blog.mjs                          # Last 5 published posts
 *   node query-blog.mjs --days 7                 # Posts from last 7 days
 *   node query-blog.mjs --limit 10               # Last 10 posts
 *   node query-blog.mjs --slug "fda-recall-list" # Get a specific post by slug
 *   node query-blog.mjs --not-promoted            # Posts not yet used for LinkedIn
 *
 * Env vars (required):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    days: { type: "string" },
    limit: { type: "string", default: "5" },
    slug: { type: "string" },
    "not-promoted": { type: "boolean", default: false },
  },
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const limit = parseInt(args.limit, 10);

let query = supabase
  .from("blog_posts")
  .select("id, title, slug, category, excerpt, content, word_count, cover_image_url, published_at, linkedin_promoted_at")
  .eq("status", "published")
  .order("published_at", { ascending: false })
  .limit(limit);

if (args.slug) {
  query = query.eq("slug", args.slug);
}

if (args.days) {
  const since = new Date(Date.now() - parseInt(args.days, 10) * 86400000).toISOString();
  query = query.gte("published_at", since);
}

if (args["not-promoted"]) {
  query = query.is("linkedin_promoted_at", null);
}

const { data, error } = await query;

if (error) {
  console.error("Supabase query error:", error.message);
  process.exit(1);
}

// For listing, truncate content to first 500 chars to keep output manageable
const results = data.map((post) => ({
  ...post,
  content: args.slug ? post.content : post.content?.slice(0, 500) + "...",
}));

console.log(JSON.stringify({ count: results.length, posts: results }, null, 2));
