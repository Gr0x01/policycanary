#!/usr/bin/env node
/**
 * publish-regulations.mjs — Batch publish regulation intelligence pages
 *
 * Reads regulation-*.json + regulation-*.md pairs from output/pages/
 * and publishes each via POST /api/intelligence.
 *
 * Usage:
 *   BLOG_API_KEY=xxx node scripts/backfill/publish-regulations.mjs
 *   BLOG_API_KEY=xxx node scripts/backfill/publish-regulations.mjs --status published
 *   BLOG_API_KEY=xxx node scripts/backfill/publish-regulations.mjs --base-url http://localhost:3000
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    status: { type: "string", default: "draft" },
    "base-url": { type: "string", default: "https://policycanary.io" },
    slug: { type: "string" }, // optional: publish only one
  },
});

const BLOG_API_KEY = process.env.BLOG_API_KEY;
if (!BLOG_API_KEY) {
  console.error("Missing BLOG_API_KEY env var");
  process.exit(1);
}

const pagesDir = new URL("./output/pages/", import.meta.url).pathname;
const jsonFiles = readdirSync(pagesDir)
  .filter((f) => f.startsWith("regulation-") && f.endsWith(".json"))
  .filter((f) => !args.slug || f === `regulation-${args.slug}.json`)
  .sort();

console.log(`Found ${jsonFiles.length} regulation page(s) to publish\n`);

let success = 0;
let failed = 0;

for (const jsonFile of jsonFiles) {
  const slug = jsonFile.replace("regulation-", "").replace(".json", "");
  const mdFile = `regulation-${slug}.md`;

  try {
    const meta = JSON.parse(readFileSync(join(pagesDir, jsonFile), "utf-8"));
    let content = readFileSync(join(pagesDir, mdFile), "utf-8");

    // Strip metadata blocks (same as publish-intelligence.mjs)
    content = content.replace(/^---\n\*\*[\s\S]*?\n---\n+/, "");
    content = content.replace(/^(\*\*[A-Za-z ]+:\*\*.*\n)+\n*/m, "");

    const body = {
      page_type: "regulation",
      slug: meta.slug || slug,
      title: meta.title,
      excerpt: meta.excerpt,
      content,
      structured_data: meta.structured_data,
      status: args.status,
      ...(meta.seo_title && { seo_title: meta.seo_title }),
      ...(meta.seo_description && { seo_description: meta.seo_description }),
      ...(meta.linked_pages?.length && { linked_pages: meta.linked_pages }),
      ...(meta.linked_item_ids?.length && { linked_item_ids: meta.linked_item_ids }),
    };

    const url = `${args["base-url"]}/api/intelligence`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": BLOG_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok) {
      console.error(`FAIL ${slug} (${res.status}):`, JSON.stringify(json.error, null, 2));
      failed++;
    } else {
      console.log(`OK   ${slug} → ${json.data?.status || args.status} (id: ${json.data?.id})`);
      success++;
    }
  } catch (err) {
    console.error(`FAIL ${slug}: ${err.message}`);
    failed++;
  }

  // Small delay to respect rate limits
  await new Promise((r) => setTimeout(r, 500));
}

console.log(`\nDone: ${success} published, ${failed} failed`);
if (failed > 0) process.exit(1);
