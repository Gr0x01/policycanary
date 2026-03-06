#!/usr/bin/env node
/**
 * web-research.mjs — Search the web via Tavily API
 *
 * Usage:
 *   node web-research.mjs --query "FDA semaglutide compounding enforcement 2026"
 *   node web-research.mjs --query "MoCRA registration deadline" --depth advanced
 *   node web-research.mjs --query "FDA red 40 ban" --max-results 10
 *   node web-research.mjs --query "supplement CGMP violations" --include-domains "fda.gov,nutraingredients.com"
 *
 * Flags:
 *   --query TEXT           Search query (required)
 *   --depth basic|advanced Basic (fast, cheaper) or advanced (deeper, more results). Default: basic
 *   --max-results N        Max results (default: 5)
 *   --include-domains CSV  Comma-separated domains to prefer
 *   --exclude-domains CSV  Comma-separated domains to exclude
 *   --topic general|news   Search topic. Default: news
 *
 * Env vars (required):
 *   TAVILY_API_KEY
 *
 * Outputs JSON to stdout.
 */

import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    query: { type: "string" },
    depth: { type: "string", default: "basic" },
    "max-results": { type: "string", default: "5" },
    "include-domains": { type: "string" },
    "exclude-domains": { type: "string" },
    topic: { type: "string", default: "news" },
  },
});

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

if (!TAVILY_API_KEY) {
  console.error("Missing TAVILY_API_KEY");
  process.exit(1);
}

if (!args.query) {
  console.error("--query is required");
  process.exit(1);
}

const body = {
  api_key: TAVILY_API_KEY,
  query: args.query,
  search_depth: args.depth,
  max_results: parseInt(args["max-results"], 10),
  topic: args.topic,
  include_answer: true,
  include_raw_content: false,
};

if (args["include-domains"]) {
  body.include_domains = args["include-domains"].split(",").map((d) => d.trim());
}
if (args["exclude-domains"]) {
  body.exclude_domains = args["exclude-domains"].split(",").map((d) => d.trim());
}

try {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Tavily API error (${res.status}): ${text}`);
    process.exit(1);
  }

  const data = await res.json();

  // Simplify output for Clawdbot consumption
  const output = {
    query: args.query,
    answer: data.answer || null,
    results: (data.results || []).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
      published_date: r.published_date || null,
      score: r.score,
    })),
  };

  console.log(JSON.stringify(output, null, 2));
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
