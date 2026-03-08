#!/usr/bin/env npx tsx
/**
 * Generate demo Product Intelligence Briefing + Alert emails
 * using REAL data from the gr0x01@pm.me dev user.
 *
 * Outputs HTML files to scripts/demo-output/ that can be opened in a browser.
 *
 * Usage: npx tsx scripts/generate-demo-emails.ts
 *
 * Requires .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ANTHROPIC_API_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { render } from "@react-email/components";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join, resolve } from "path";

// Load .env.local (no dotenv dependency)
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed
      .slice(eqIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

// Inline clients (bypasses server-only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

const anthropic = createAnthropic();
const claudeSonnet = anthropic("claude-sonnet-4-6");

const DEV_EMAIL = "gr0x01@pm.me";
const OUTPUT_DIR = join(__dirname, "demo-output");

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("[demo] Generating demo emails from real data...\n");

  // Ensure output dir
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. Get the dev user
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id, email, first_name, company_name")
    .eq("email", DEV_EMAIL)
    .single();

  if (userErr || !user) {
    console.error("[demo] Could not find user:", userErr?.message);
    process.exit(1);
  }
  console.log(`[demo] User: ${user.email} (${user.first_name ?? "no name"})`);

  // 2. Get active products
  const { data: products } = await supabase
    .from("subscriber_products")
    .select("id, name, brand, product_type, product_category_id")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (!products || products.length === 0) {
    console.error("[demo] No active products for user");
    process.exit(1);
  }
  console.log(`[demo] Products: ${products.map((p) => p.name).join(", ")}\n`);

  // 3. Get all relevant verdicts with regulatory item data
  const { data: verdicts } = await supabase
    .from("product_match_verdicts")
    .select(`
      product_id,
      reasoning,
      relevant,
      regulatory_items:item_id (
        id, title, item_type, published_date, source_url,
        item_enrichments (summary, regulatory_action_type, deadline, raw_response)
      )
    `)
    .eq("user_id", user.id)
    .eq("relevant", true)
    .order("evaluated_at", { ascending: false });

  if (!verdicts || verdicts.length === 0) {
    console.error("[demo] No relevant verdicts found");
    process.exit(1);
  }
  console.log(`[demo] Found ${verdicts.length} relevant verdicts`);

  // 4. Build BriefingData from real verdicts
  const briefingData = buildBriefingData(user, products, verdicts);
  console.log(`[demo] Briefing zones: ${briefingData.product_items.length} product items, ${briefingData.industry_items.length} industry, ${briefingData.other_items.length} other\n`);

  // 5. Generate editorial opening with Claude Sonnet
  console.log("[demo] Generating editorial opening with Claude Sonnet...");
  const editorial = await generateEditorialOpening(briefingData);
  if (editorial) {
    console.log(`[demo] Editorial: "${editorial}"\n`);
  }

  // 6. Render Briefing Email
  console.log("[demo] Rendering Product Intelligence Briefing...");
  const BriefingEmail = (await import("../src/lib/email/templates/BriefingEmail")).default;
  const briefingHtml = await render(
    BriefingEmail({ data: briefingData, editorial_opening: editorial })
  );
  const briefingPath = join(OUTPUT_DIR, "briefing.html");
  writeFileSync(briefingPath, briefingHtml);
  console.log(`[demo] Wrote: ${briefingPath}`);

  // 7. Render Alert Email for the Miss Vickie's recall (the killer demo item)
  const recallVerdict = verdicts.find((v) => {
    const ri = v.regulatory_items as any;
    return ri?.item_type === "recall";
  });

  if (recallVerdict) {
    console.log("\n[demo] Rendering Alert Email (Miss Vickie's recall)...");
    const ri = recallVerdict.regulatory_items as any;
    const enrichment = Array.isArray(ri.item_enrichments)
      ? ri.item_enrichments[0]
      : ri.item_enrichments;
    const product = products.find((p) => p.id === recallVerdict.product_id);

    const AlertEmail = (await import("../src/lib/email/templates/AlertEmail")).default;
    const alertHtml = await render(
      AlertEmail({
        product_name: product?.name ?? "Miss Vickie's Spicy Dill Pickle Kettle Cooked Potato Chips",
        title: ri.title,
        summary: enrichment?.summary ?? ri.title,
        action_type: "recall",
        source_url: ri.source_url,
        deadline: enrichment?.deadline ?? null,
        matched_substances: [],
        app_url: `https://policycanary.io/app/items/${ri.id}`,
      })
    );
    const alertPath = join(OUTPUT_DIR, "alert.html");
    writeFileSync(alertPath, alertHtml);
    console.log(`[demo] Wrote: ${alertPath}`);
  }

  // 8. Generate subject lines
  const subject = generateBriefingSubject(briefingData);
  console.log(`\n[demo] Briefing subject: "${subject}"`);

  console.log("\n[demo] Done! Open the HTML files in a browser:");
  console.log(`  open ${briefingPath}`);
  if (recallVerdict) {
    console.log(`  open ${join(OUTPUT_DIR, "alert.html")}`);
  }
}

// ---------------------------------------------------------------------------
// Build BriefingData from verdicts
// ---------------------------------------------------------------------------

interface BriefingItem {
  item_id: string;
  title: string;
  item_type: string;
  published_date: string;
  source_url: string | null;
  summary: string | null;
  regulatory_action_type: string | null;
  deadline: string | null;
  action_items: string[] | null;
  regulations_cited: string[] | null;
  relevance: number;
  lifecycle_state: string;
  matched_products: Array<{
    product_id: string;
    product_name: string;
    matched_substances: string[];
    matched_categories: string[];
  }>;
}

function buildBriefingData(user: any, products: any[], verdicts: any[]) {
  // Group verdicts by item
  const itemMap = new Map<string, { item: any; enrichment: any; products: any[] }>();

  for (const v of verdicts) {
    const ri = v.regulatory_items as any;
    if (!ri) continue;

    const enrichment = Array.isArray(ri.item_enrichments)
      ? ri.item_enrichments[0]
      : ri.item_enrichments;

    const product = products.find((p: any) => p.id === v.product_id);
    if (!product) continue;

    const existing = itemMap.get(ri.id);
    if (existing) {
      existing.products.push(product);
    } else {
      itemMap.set(ri.id, { item: ri, enrichment, products: [product] });
    }
  }

  // Convert to BriefingItems sorted by urgency (recalls first, then by date)
  const productItems: BriefingItem[] = [...itemMap.values()]
    .sort((a, b) => {
      const aUrgent = isUrgentType(a.enrichment?.regulatory_action_type);
      const bUrgent = isUrgentType(b.enrichment?.regulatory_action_type);
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      return new Date(b.item.published_date).getTime() - new Date(a.item.published_date).getTime();
    })
    .map(({ item, enrichment, products: matchedProducts }) => {
      const raw = enrichment?.raw_response as Record<string, unknown> | null;
      return {
        item_id: item.id,
        title: item.title,
        item_type: item.item_type,
        published_date: item.published_date,
        source_url: item.source_url,
        summary: enrichment?.summary ?? null,
        regulatory_action_type: enrichment?.regulatory_action_type ?? null,
        deadline: enrichment?.deadline ?? null,
        action_items: Array.isArray(raw?.action_items) ? (raw!.action_items as string[]) : null,
        regulations_cited: Array.isArray(raw?.regulations_cited)
          ? (raw!.regulations_cited as string[])
          : null,
        relevance: 0.85,
        lifecycle_state: "active",
        matched_products: matchedProducts.map((p: any) => ({
          product_id: p.id,
          product_name: p.name,
          matched_substances: [],
          matched_categories: [p.product_type],
        })),
      };
    });

  return {
    subscriber: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      company_name: user.company_name,
    },
    products: products.map((p: any) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      product_type: p.product_type,
      ingredient_count: 0,
    })),
    product_items: productItems,
    industry_items: [],
    other_items: [
      { title: "FDA Approves New Drug Application for Type 2 Diabetes Treatment", item_type: "press_release", source_url: null },
      { title: "Import Alert 99-33 Updated: Detention of Unapproved New Drugs", item_type: "import_alert", source_url: null },
      { title: "FDA Issues Warning Letters to 3 Tobacco Retailers", item_type: "warning_letter", source_url: null },
      { title: "CFSAN Constituent Update: GRAS Notification Program Changes", item_type: "notice", source_url: null },
    ],
    period: { start: "2024-03-01", end: "2026-03-07" },
    total_items_reviewed: 7573,
  };
}

function isUrgentType(actionType: string | null): boolean {
  return ["recall", "safety_alert", "ban_restriction"].includes(actionType ?? "");
}

// ---------------------------------------------------------------------------
// Editorial opening generation (Claude Sonnet)
// ---------------------------------------------------------------------------

async function generateEditorialOpening(data: any): Promise<string | undefined> {
  const topItems = data.product_items.slice(0, 3);
  if (topItems.length === 0) return undefined;

  const itemSummaries = topItems
    .map(
      (i: any) =>
        `- "${i.title}" (${i.regulatory_action_type ?? "general"}) affecting: ${i.matched_products.map((p: any) => p.product_name).join(", ")}`
    )
    .join("\n");

  try {
    const { text } = await generateText({
      model: claudeSonnet,
      maxOutputTokens: 150,
      temperature: 0.3,
      system: `You write editorial openings for Policy Canary's Product Intelligence Briefing — a regulatory email for FDA-regulated brands.

Voice: Senior regulatory analyst briefing their team. Calm, specific, calibrated. No hype.
Rules:
- 1-2 sentences maximum
- Lead with the most important regulatory development
- Reference specific products or categories if relevant
- Never say "breaking", "urgent", "comprehensive overview", or "stay compliant"
- Never give legal advice or say "action required"
- Match confidence to regulatory status: say "finalized" for final rules, "proposed" for proposed rules, "draft guidance" for guidance documents
- Never describe a proposed rule as if it's already in effect
- Reference the specific regulatory action type provided in the data`,
      prompt: `Write a 1-2 sentence editorial opening for this briefing. The subscriber monitors ${data.products.length} products across food, cosmetics, and supplements. Here are the top matched items:

${itemSummaries}

Total items reviewed: ${data.total_items_reviewed}`,
    });

    return text.trim() || undefined;
  } catch (err) {
    console.error("[demo] Editorial generation failed:", err);
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Subject line
// ---------------------------------------------------------------------------

function generateBriefingSubject(data: any): string {
  const hasItems = data.product_items.length > 0;

  if (!hasItems) {
    return `All clear | ${data.total_items_reviewed} FDA actions reviewed, none affect your products`;
  }

  const affectedNames = [
    ...new Set(
      data.product_items.flatMap((i: any) =>
        i.matched_products.map((p: any) => p.product_name)
      )
    ),
  ] as string[];

  if (affectedNames.length === 1) {
    return `${affectedNames[0]}: FDA action this week`;
  }

  const first = affectedNames[0];
  const rest = affectedNames.length - 1;
  return `${first} + ${rest} more: FDA actions this week`;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

main().catch((err) => {
  console.error("[demo] Fatal:", err);
  process.exit(1);
});
