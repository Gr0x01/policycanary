#!/usr/bin/env node
/**
 * publish-intelligence.mjs — Publish an intelligence page to Policy Canary via the API
 *
 * Usage:
 *   node publish-intelligence.mjs --page-type ingredient --slug "red-no-3" --title "Red No. 3" --excerpt "..." --content "# Markdown..." --status draft
 *   node publish-intelligence.mjs --page-type enforcement --slug "byheart" --title "ByHeart" --content-file /tmp/page.md --excerpt "..." --status published
 *
 * Flags:
 *   --page-type      ingredient | enforcement | regulation (required)
 *   --slug           URL slug (required, lowercase-hyphen)
 *   --title          Page title (required)
 *   --excerpt        Short summary (required)
 *   --content        Markdown content (required unless --content-file)
 *   --content-file   Read content from file instead of arg
 *   --structured-data  JSON string of structured data
 *   --structured-data-file  Read structured data from JSON file
 *   --status         "draft" (default), "published", or "needs_refresh"
 *   --seo-title      SEO title override
 *   --seo-description SEO description override
 *   --cover-image-url Cover image URL
 *   --base-url       API base URL (default: https://policycanary.io)
 *
 * Env vars (required):
 *   BLOG_API_KEY
 */

import { parseArgs } from "node:util";
import { readFileSync } from "node:fs";

const { values: args } = parseArgs({
  options: {
    "page-type": { type: "string" },
    slug: { type: "string" },
    title: { type: "string" },
    excerpt: { type: "string" },
    content: { type: "string" },
    "content-file": { type: "string" },
    "structured-data": { type: "string" },
    "structured-data-file": { type: "string" },
    status: { type: "string", default: "draft" },
    "seo-title": { type: "string" },
    "seo-description": { type: "string" },
    "cover-image-url": { type: "string" },
    "base-url": { type: "string", default: "https://policycanary.io" },
  },
});

const BLOG_API_KEY = process.env.BLOG_API_KEY;
if (!BLOG_API_KEY) {
  console.error("Missing BLOG_API_KEY env var");
  process.exit(1);
}

const VALID_PAGE_TYPES = ["ingredient", "enforcement", "regulation"];
if (!args["page-type"] || !VALID_PAGE_TYPES.includes(args["page-type"])) {
  console.error(`Required: --page-type (one of: ${VALID_PAGE_TYPES.join(", ")})`);
  process.exit(1);
}

if (!args.title || !args.slug || !args.excerpt) {
  console.error("Required: --title, --slug, --excerpt");
  process.exit(1);
}

let content = args.content;
if (args["content-file"]) {
  content = readFileSync(args["content-file"], "utf-8");
}
if (!content) {
  console.error("Required: --content or --content-file");
  process.exit(1);
}

// Strip metadata block from top of content
content = content.replace(/^---\n\*\*[\s\S]*?\n---\n+/, "");
content = content.replace(/^(\*\*[A-Za-z ]+:\*\*.*\n)+\n*/m, "");

let structured_data = {};
try {
  if (args["structured-data-file"]) {
    structured_data = JSON.parse(readFileSync(args["structured-data-file"], "utf-8"));
  } else if (args["structured-data"]) {
    structured_data = JSON.parse(args["structured-data"]);
  }
} catch (e) {
  console.error("Invalid structured data JSON:", e.message);
  process.exit(1);
}

const body = {
  page_type: args["page-type"],
  slug: args.slug,
  title: args.title,
  excerpt: args.excerpt,
  content,
  structured_data,
  status: args.status,
  ...(args["seo-title"] && { seo_title: args["seo-title"] }),
  ...(args["seo-description"] && { seo_description: args["seo-description"] }),
  ...(args["cover-image-url"] && { cover_image_url: args["cover-image-url"] }),
};

const url = `${args["base-url"]}/api/intelligence`;

try {
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
    console.error(`API error (${res.status}):`, JSON.stringify(json, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(json, null, 2));
} catch (err) {
  console.error("Request failed:", err.message);
  process.exit(1);
}
