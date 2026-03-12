/**
 * One-off script: submit all published blog + intelligence pages to IndexNow.
 * Usage: npx tsx scripts/one-off/ping-indexnow-backfill.ts
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SITE_URL = "https://policycanary.io";
const INDEXNOW_KEY = "793bba199c7879f0863533c058626e69";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

const PAGE_TYPE_ROUTES: Record<string, string> = {
  ingredient: "ingredients",
  enforcement: "enforcement",
  regulation: "regulations",
};

async function main() {
  const urls: string[] = [];

  // Blog posts
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("status", "published");

  for (const p of posts ?? []) {
    urls.push(`${SITE_URL}/blog/${p.slug}`);
  }

  // Intelligence pages
  const { data: pages } = await supabase
    .from("intelligence_pages")
    .select("page_type, slug")
    .eq("status", "published");

  for (const p of pages ?? []) {
    const route = PAGE_TYPE_ROUTES[p.page_type];
    if (route) urls.push(`${SITE_URL}/${route}/${p.slug}`);
  }

  console.log(`Submitting ${urls.length} URLs to IndexNow...`);
  urls.forEach((u) => console.log(`  ${u}`));

  const payload = {
    host: "policycanary.io",
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  console.log(`IndexNow response: ${res.status} ${res.statusText}`);
}

main().catch(console.error);
