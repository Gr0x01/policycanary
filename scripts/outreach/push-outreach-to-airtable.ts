#!/usr/bin/env npx tsx
/**
 * Push outreach targets + generated DMs to Airtable.
 * Merges outreach-targets.json with outreach-dms.json, creates the
 * "LinkedIn Outreach" table if needed, and pushes records.
 *
 * Usage: npx tsx scripts/push-outreach-to-airtable.ts
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Load env
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = val;
  }
}

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const BASE_ID = "appe4Qk0pMAANrdpj";
const TABLE_NAME = "LinkedIn Outreach";

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------

const targetsPath = resolve(__dirname, "demo-output/outreach-targets.json");
const dmsPath = resolve(__dirname, "demo-output/outreach-dms.json");

const targets: any[] = JSON.parse(readFileSync(targetsPath, "utf-8"));
const dms: any[] = JSON.parse(readFileSync(dmsPath, "utf-8"));

// Build DM lookup: key = "company|ingredient"
const dmLookup = new Map<string, string>();
for (const d of dms) {
  const key = `${d.company}|${d.ingredient}`;
  dmLookup.set(key, d.dm);
}

// Merge DMs into targets
let matched = 0;
for (const t of targets) {
  const key = `${t.Company}|${t["Ingredient Hook"]}`;
  const dm = dmLookup.get(key);
  if (dm) {
    t["DM 1 Draft"] = dm;
    matched++;
  }
}
console.log(`[merge] Matched ${matched}/${targets.length} DMs to targets`);

// ---------------------------------------------------------------------------
// Airtable
// ---------------------------------------------------------------------------

async function airtableFetch(path: string, options: RequestInit = {}): Promise<any> {
  const resp = await fetch(`https://api.airtable.com/v0${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Airtable ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function ensureTable(): Promise<string> {
  const meta = await airtableFetch(`/meta/bases/${BASE_ID}/tables`);
  const existing = meta.tables.find((t: any) => t.name === TABLE_NAME);
  if (existing) {
    console.log(`[airtable] Table exists: ${TABLE_NAME} (${existing.id})`);
    return existing.id;
  }

  console.log(`[airtable] Creating table: ${TABLE_NAME}`);
  const result = await airtableFetch(`/meta/bases/${BASE_ID}/tables`, {
    method: "POST",
    body: JSON.stringify({
      name: TABLE_NAME,
      fields: [
        { name: "Company", type: "singleLineText" },
        { name: "Total Products", type: "number", options: { precision: 0 } },
        { name: "Ingredient Hook", type: "singleLineText" },
        { name: "Products Affected", type: "number", options: { precision: 0 } },
        { name: "Sample Products", type: "multilineText" },
        { name: "FDA Action", type: "singleLineText" },
        { name: "FDA Action Type", type: "singleLineText" },
        { name: "FDA Action Date", type: "date", options: { dateFormat: { name: "us" } } },
        { name: "DM 1 Draft", type: "multilineText" },
        { name: "LinkedIn Person", type: "singleLineText" },
        { name: "LinkedIn URL", type: "url" },
        { name: "Person Title", type: "singleLineText" },
        {
          name: "Status",
          type: "singleSelect",
          options: {
            choices: [
              { name: "Not Started", color: "grayLight2" },
              { name: "DM Sent", color: "blueLight2" },
              { name: "Replied", color: "greenLight2" },
              { name: "Meeting Set", color: "purpleLight2" },
              { name: "Not Interested", color: "redLight2" },
              { name: "Signed Up", color: "yellowLight2" },
            ],
          },
        },
        {
          name: "Priority",
          type: "singleSelect",
          options: {
            choices: [
              { name: "High", color: "redLight2" },
              { name: "Medium", color: "yellowLight2" },
              { name: "Low", color: "grayLight2" },
            ],
          },
        },
        { name: "Notes", type: "multilineText" },
      ],
    }),
  });
  console.log(`[airtable] Created: ${result.id}`);
  return result.id;
}

async function pushRecords(records: any[]): Promise<void> {
  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10).map((fields) => ({ fields }));
    await airtableFetch(`/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`, {
      method: "POST",
      body: JSON.stringify({ records: batch }),
    });
    console.log(`[airtable] Pushed ${Math.min(i + 10, records.length)}/${records.length}`);
    // Small delay to avoid rate limits
    if (i + 10 < records.length) await new Promise((r) => setTimeout(r, 250));
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n=== Pushing ${targets.length} records to Airtable ===\n`);

  await ensureTable();

  // Clean up fields for Airtable (remove template DMs for unmatched, strip Status for select)
  const cleanRecords = targets.map((t) => ({
    Company: t.Company,
    "Total Products": t["Total Products"],
    "Ingredient Hook": t["Ingredient Hook"],
    "Products Affected": t["Products Affected"],
    "Sample Products": t["Sample Products"],
    "FDA Action": t["FDA Action"],
    "FDA Action Type": t["FDA Action Type"],
    "FDA Action Date": t["FDA Action Date"],
    "DM 1 Draft": t["DM 1 Draft"],
    Priority: t.Priority,
    Status: "Not Started",
  }));

  await pushRecords(cleanRecords);
  console.log(`\n[done] ${cleanRecords.length} records in Airtable "${TABLE_NAME}"`);
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
