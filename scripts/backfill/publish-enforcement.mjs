import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const dir = join(import.meta.dirname, "output/pages");
const jsonFiles = readdirSync(dir).filter(
  (f) => f.startsWith("enforcement-") && f.endsWith(".json")
);

console.log(`Found ${jsonFiles.length} enforcement pages to publish\n`);

for (const jsonFile of jsonFiles) {
  const slug = jsonFile.replace("enforcement-", "").replace(".json", "");
  const mdFile = `enforcement-${slug}.md`;

  const meta = JSON.parse(readFileSync(join(dir, jsonFile), "utf8"));
  const content = readFileSync(join(dir, mdFile), "utf8");
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  const row = {
    page_type: "enforcement",
    slug: meta.slug,
    title: meta.title,
    excerpt: meta.excerpt,
    content,
    structured_data: meta.structured_data,
    status: "published",
    seo_title: meta.seo_title,
    seo_description: meta.seo_description,
    word_count: wordCount,
    published_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("intelligence_pages")
    .upsert(row, { onConflict: "page_type,slug" })
    .select("id, slug, status, word_count");

  if (error) {
    console.error(`FAIL ${slug}:`, error.message);
  } else {
    console.log(`OK   ${slug} (${wordCount} words) → ${data[0]?.id}`);
  }
}

console.log("\nDone.");
