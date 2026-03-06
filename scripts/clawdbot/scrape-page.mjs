#!/usr/bin/env node
/**
 * scrape-page.mjs — Scrape a web page via ScrapingDog API
 *
 * Usage:
 *   node scrape-page.mjs --url "https://www.fda.gov/some-guidance-doc"
 *   node scrape-page.mjs --url "https://example.com/article" --render
 *
 * Flags:
 *   --url TEXT      URL to scrape (required)
 *   --render        Use JS rendering (slower, needed for dynamic pages). Default: false
 *
 * Env vars (required):
 *   SCRAPINGDOG_API_KEY
 *
 * Outputs JSON with extracted text to stdout.
 */

import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    url: { type: "string" },
    render: { type: "boolean", default: false },
  },
});

const API_KEY = process.env.SCRAPINGDOG_API_KEY;

if (!API_KEY) {
  console.error("Missing SCRAPINGDOG_API_KEY");
  process.exit(1);
}

if (!args.url) {
  console.error("--url is required");
  process.exit(1);
}

try {
  const params = new URLSearchParams({
    api_key: API_KEY,
    url: args.url,
    dynamic: args.render ? "true" : "false",
  });

  const res = await fetch(`https://api.scrapingdog.com/scrape?${params}`);

  if (!res.ok) {
    const text = await res.text();
    console.error(`ScrapingDog error (${res.status}): ${text.slice(0, 500)}`);
    process.exit(1);
  }

  const html = await res.text();

  // Extract readable text from HTML (simple approach - strip tags, normalize whitespace)
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  // Truncate to ~8000 chars to keep context manageable for LLM
  const truncated = text.length > 8000 ? text.slice(0, 8000) + "... [truncated]" : text;

  console.log(
    JSON.stringify({
      url: args.url,
      char_count: text.length,
      truncated: text.length > 8000,
      content: truncated,
    }, null, 2)
  );
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
