#!/usr/bin/env node
/**
 * verify-content.mjs — Second-pass fact-checking via Gemini + Google Search grounding
 *
 * Usage:
 *   node verify-content.mjs --content-file /tmp/draft.md --content-type blog
 *   node verify-content.mjs --content-file /tmp/draft.md --content-type intelligence
 *   node verify-content.mjs --content-file /tmp/draft.md --content-type linkedin
 *   node verify-content.mjs --content-file /tmp/draft.md --content-type blog --verbose
 *
 * Flags:
 *   --content-file PATH    Path to the markdown content file (required)
 *   --content-type TYPE    blog | intelligence | linkedin (default: blog)
 *   --verbose              Print progress to stderr
 *
 * Env vars (required):
 *   GOOGLE_GENERATIVE_AI_API_KEY
 *
 * Optional env vars:
 *   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (for DB cross-reference layer)
 *
 * Outputs JSON to stdout.
 *
 * Design: This script is a completely independent process from content generation.
 * Anton (Claude Sonnet) writes the draft, then calls this script as a subprocess.
 * Different model (Gemini), different provider (Google), no shared context.
 */

import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    "content-file": { type: "string" },
    "content-type": { type: "string", default: "blog" },
    verbose: { type: "boolean", default: false },
  },
});

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!API_KEY) {
  console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
  process.exit(1);
}

if (!args["content-file"]) {
  console.error("--content-file is required");
  process.exit(1);
}

const contentType = args["content-type"];
const VALID_TYPES = ["blog", "intelligence", "linkedin"];
if (!VALID_TYPES.includes(contentType)) {
  console.error(
    `Invalid --content-type: ${contentType}. Must be one of: ${VALID_TYPES.join(", ")}`
  );
  process.exit(1);
}
const verbose = args.verbose;

function log(...msg) {
  if (verbose) console.error("[verify]", ...msg);
}

// Read content
let content;
try {
  content = await readFile(args["content-file"], "utf-8");
} catch (err) {
  console.error(`Cannot read file: ${err.message}`);
  process.exit(1);
}

if (!content.trim()) {
  console.error("Content file is empty");
  process.exit(1);
}

// ─── Gemini API helpers ───────────────────────────────────────────────

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

async function geminiCall(model, contents, options = {}) {
  const { tools, responseSchema, temperature } = options;

  const body = {
    contents,
    generationConfig: {
      temperature: temperature ?? 0.1,
    },
  };

  if (tools) body.tools = tools;
  if (responseSchema) {
    body.generationConfig.responseMimeType = "application/json";
    body.generationConfig.responseSchema = responseSchema;
  }

  const res = await fetch(
    `${GEMINI_BASE}/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${text}`);
  }

  const data = await res.json();

  if (!data.candidates?.[0]?.content?.parts?.[0]) {
    throw new Error(`Gemini returned no content: ${JSON.stringify(data)}`);
  }

  return data.candidates[0].content.parts[0].text;
}

// ─── Layer 1: Claim Extraction + Web Verification ─────────────────────

async function extractClaims(content) {
  log("Extracting verifiable claims...");

  const schema = {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        claim_text: {
          type: "STRING",
          description: "The exact claim as stated in the content",
        },
        claim_type: {
          type: "STRING",
          enum: [
            "statistic",
            "date",
            "entity_fact",
            "regulatory_citation",
            "quote_attribution",
          ],
        },
        specificity: {
          type: "STRING",
          enum: ["high", "medium", "low"],
        },
        context_line: {
          type: "STRING",
          description:
            "The sentence or paragraph containing the claim for locating it",
        },
        db_verifiable: {
          type: "BOOLEAN",
          description:
            'True if claim references "our data", "our analysis", "we tracked", "Policy Canary\'s database" or similar internal data claims',
        },
      },
      required: [
        "claim_text",
        "claim_type",
        "specificity",
        "context_line",
        "db_verifiable",
      ],
    },
  };

  const prompt = `You are a fact-checker. Extract all verifiable factual claims from this content.

Focus on:
- Statistics (numbers, percentages, counts)
- Dates (deadlines, event dates, when things happened)
- Entity facts (who did what, where, what company, what agency action)
- Regulatory citations (CFR parts, law names, section numbers)
- Quote attributions (who said what)

For each claim, assess specificity:
- "high": exact number, exact date, specific named entity + action
- "medium": approximate number ("nearly X"), general timeframe ("in early 2025"), named entity without specific detail
- "low": vague or general statements ("many companies", "recently")

Mark db_verifiable=true only if the claim explicitly references Policy Canary's own data or analysis.

Content to analyze:

${content}`;

  const text = await geminiCall("gemini-3-flash-preview", [
    { role: "user", parts: [{ text: prompt }] },
  ], { responseSchema: schema });

  let claims;
  try {
    claims = JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse claim extraction response:", err.message);
    process.exit(1);
  }
  log(`Extracted ${claims.length} claims`);
  return claims;
}

async function verifyClaims(claims) {
  // Only verify high and medium specificity claims
  const toVerify = claims.filter(
    (c) => c.specificity === "high" || c.specificity === "medium"
  );

  if (toVerify.length === 0) {
    log("No high/medium specificity claims to verify");
    return [];
  }

  log(`Verifying ${toVerify.length} claims via Google Search grounding...`);

  // Batch claims in groups of 3-5
  const batchSize = 4;
  const batches = [];
  for (let i = 0; i < toVerify.length; i += batchSize) {
    batches.push(toVerify.slice(i, i + batchSize));
  }

  const results = [];

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    if (batchIdx > 0) await new Promise((r) => setTimeout(r, 1000));
    const batch = batches[batchIdx];
    const claimList = batch
      .map((c, i) => `${i + 1}. [${c.claim_type}] "${c.claim_text}"`)
      .join("\n");

    const prompt = `You are a fact-checker. Verify each claim below using web search results. For each claim, determine if it is correct, incorrect, or unverifiable.

Be strict: if a claim states a specific number and the actual number is different, mark it incorrect and provide the correct value. If you cannot find reliable sources to confirm or deny a claim, mark it unverifiable.

Claims to verify:
${claimList}

For each claim, respond with a JSON array where each element has:
- claim_index (1-based, matching the list above)
- verdict: "correct" | "incorrect" | "unverifiable"
- correct_value: the accurate information if verdict is "incorrect", null otherwise
- confidence: 0.0-1.0 how confident you are
- explanation: brief explanation of your finding
- sources: array of source URLs that support your verdict (empty array if unverifiable)`;

    try {
      const res = await fetch(
        `${GEMINI_BASE}/models/gemini-3.1-pro-preview:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY,
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            tools: [{ google_search: {} }],
            generationConfig: {
              temperature: 0.1,
            },
          }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        log(`Verification batch error: ${errText}`);
        continue;
      }

      const data = await res.json();
      const text =
        data.candidates?.[0]?.content?.parts
          ?.map((p) => p.text)
          .filter(Boolean)
          .join("") || "";

      // Extract JSON from response (may be wrapped in markdown code block)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const batchResults = JSON.parse(jsonMatch[0]);
        for (const r of batchResults) {
          const idx = (r.claim_index || 1) - 1;
          if (batch[idx]) {
            results.push({
              claim: batch[idx],
              verdict: r.verdict,
              correct_value: r.correct_value,
              confidence: r.confidence,
              explanation: r.explanation,
              sources: r.sources || [],
            });
          }
        }
      } else {
        log("Could not parse verification response as JSON");
      }
    } catch (err) {
      log(`Verification batch failed: ${err.message}`);
    }
  }

  log(`Verified ${results.length}/${toVerify.length} claims`);
  return results;
}

// ─── Layer 2: URL Validation ──────────────────────────────────────────

async function validateUrls(content) {
  if (contentType === "linkedin") {
    log("Skipping URL validation for LinkedIn content");
    return [];
  }

  // Extract URLs from markdown
  const urlRegex = /https?:\/\/[^\s\)>\]"'.,;]+/g;
  const urls = [...new Set(content.match(urlRegex) || [])];

  if (urls.length === 0) {
    log("No URLs found");
    return [];
  }

  log(`Validating ${urls.length} URLs...`);

  const results = [];
  const concurrency = 2;

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const res = await fetch(url, {
            method: "HEAD",
            signal: controller.signal,
            redirect: "manual",
            headers: {
              "User-Agent":
                "Mozilla/5.0 (compatible; PolicyCanary-Verifier/1.0)",
            },
          });
          clearTimeout(timeout);

          const status = res.status;
          if (status >= 200 && status < 300) {
            return { url, status: "valid", code: status };
          } else if (status === 301 || status === 302 || status === 308) {
            return {
              url,
              status: "redirect",
              code: status,
              location: res.headers.get("location"),
            };
          } else if (status === 404 || status === 410) {
            return { url, status: "broken", code: status };
          } else if (status === 403 || status === 405) {
            // Some servers block HEAD requests; try GET
            try {
              const controller2 = new AbortController();
              const timeout2 = setTimeout(() => controller2.abort(), 10000);
              const res2 = await fetch(url, {
                method: "GET",
                signal: controller2.signal,
                redirect: "manual",
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (compatible; PolicyCanary-Verifier/1.0)",
                },
              });
              clearTimeout(timeout2);
              await res2.body?.cancel();
              if (res2.status >= 200 && res2.status < 400) {
                return { url, status: "valid", code: res2.status };
              }
            } catch {
              // Fall through
            }
            return { url, status: "blocked", code: status };
          } else {
            return { url, status: "error", code: status };
          }
        } catch (err) {
          return {
            url,
            status: "unreachable",
            error: err.name === "AbortError" ? "timeout" : err.message,
          };
        }
      })
    );
    results.push(...batchResults);
  }

  const broken = results.filter(
    (r) => r.status === "broken" || r.status === "unreachable"
  );
  log(`URLs: ${results.length} checked, ${broken.length} broken/unreachable`);
  return results;
}

// ─── Layer 3: Supabase Cross-Reference (optional) ────────────────────

async function crossReferenceDb(claims) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  const dbClaims = claims.filter((c) => c.db_verifiable);

  if (dbClaims.length === 0 || !SUPABASE_URL || !SUPABASE_KEY) {
    if (dbClaims.length > 0 && !SUPABASE_URL) {
      log("DB claims found but no SUPABASE_URL — skipping cross-reference");
    }
    return [];
  }

  log(`Cross-referencing ${dbClaims.length} claims against Supabase...`);

  // Dynamic import for Supabase
  let createClient;
  try {
    const mod = await import("@supabase/supabase-js");
    createClient = mod.createClient;
  } catch {
    log("@supabase/supabase-js not available — skipping DB cross-reference");
    return [];
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const results = [];
  for (const claim of dbClaims) {
    try {
      // Try to extract what kind of DB query would verify this claim
      // Common patterns: item counts, substance counts, recall counts
      const claimLower = claim.claim_text.toLowerCase();

      // Count-based claims (e.g., "2,810 recalls", "7,500+ items")
      const countMatch = claimLower.match(
        /(\d[\d,]*)\s*(recalls?|warning letters?|items?|actions?|guidance|imports?)/
      );
      if (countMatch) {
        const claimedCount = parseInt(countMatch[1].replace(/,/g, ""), 10);
        const itemType = countMatch[2]
          .replace(/s$/, "")
          .replace("warning letter", "warning_letter")
          .replace("import", "import_alert");

        let query;
        if (itemType === "item" || itemType === "action") {
          query = supabase
            .from("regulatory_items")
            .select("id", { count: "exact", head: true });
        } else {
          query = supabase
            .from("regulatory_items")
            .select("id", { count: "exact", head: true })
            .eq("item_type", itemType);
        }

        const { count, error } = await query;
        if (!error && count !== null) {
          const tolerance = 0.05; // 5% tolerance
          const diff = Math.abs(count - claimedCount) / claimedCount;
          results.push({
            claim: claim.claim_text,
            claimed_value: claimedCount,
            actual_value: count,
            within_tolerance: diff <= tolerance,
            difference_pct: Math.round(diff * 100),
          });
        }
      }
    } catch (err) {
      log(`DB cross-ref error for "${claim.claim_text}": ${err.message}`);
    }
  }

  log(`Cross-referenced ${results.length} claims against DB`);
  return results;
}

// ─── Run all layers ───────────────────────────────────────────────────

log(`Verifying ${contentType} content (${content.length} chars)...`);
const startTime = Date.now();

// Step 1: Extract claims (needed before verification)
const claims = await extractClaims(content);

// Run layers in parallel
const [verificationResults, urlResults, dbResults] = await Promise.all([
  verifyClaims(claims),
  validateUrls(content),
  crossReferenceDb(claims),
]);

// ─── Build report ─────────────────────────────────────────────────────

const issues = [];

// Process verification results
for (const r of verificationResults) {
  if (r.verdict === "incorrect") {
    issues.push({
      severity: "error",
      type: r.claim.claim_type,
      claim: r.claim.claim_text,
      correct: r.correct_value,
      explanation: r.explanation,
      sources: r.sources,
      line: r.claim.context_line,
    });
  } else if (r.verdict === "unverifiable" && r.claim.specificity === "high") {
    issues.push({
      severity: "warning",
      type: r.claim.claim_type,
      claim: r.claim.claim_text,
      explanation: r.explanation,
      line: r.claim.context_line,
    });
  }
}

// Process broken links
const brokenLinks = urlResults.filter(
  (r) => r.status === "broken" || r.status === "unreachable"
);
for (const link of brokenLinks) {
  issues.push({
    severity: "error",
    type: "broken_link",
    claim: link.url,
    explanation: link.error || `HTTP ${link.code}`,
  });
}

// Process DB cross-reference results
for (const r of dbResults) {
  if (!r.within_tolerance) {
    issues.push({
      severity: "warning",
      type: "db_mismatch",
      claim: `Claimed ${r.claimed_value}, actual DB count is ${r.actual_value}`,
      explanation: `${r.difference_pct}% difference (5% tolerance)`,
    });
  }
}

// Calculate confidence score
const totalVerified = verificationResults.length;
const factualErrors = issues.filter(
  (i) => i.severity === "error" && i.type !== "broken_link"
).length;
const errors = issues.filter((i) => i.severity === "error").length;
const warnings = issues.filter((i) => i.severity === "warning").length;

let confidenceScore = 100;
confidenceScore -= factualErrors * 10;
confidenceScore -= brokenLinks.length * 5;
confidenceScore -= warnings * 3;
confidenceScore = Math.max(0, Math.min(100, confidenceScore));

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

const report = {
  content_type: contentType,
  verified_at: new Date().toISOString(),
  elapsed_seconds: parseFloat(elapsed),
  total_claims: claims.length,
  verified: totalVerified,
  errors,
  warnings,
  issues,
  broken_links: brokenLinks.map((l) => l.url),
  db_cross_references: dbResults,
  confidence_score: confidenceScore,
  summary: `${errors} error${errors !== 1 ? "s" : ""}, ${warnings} warning${warnings !== 1 ? "s" : ""}, ${brokenLinks.length} broken link${brokenLinks.length !== 1 ? "s" : ""}. Score: ${confidenceScore}/100`,
};

log(`Done in ${elapsed}s — ${report.summary}`);
console.log(JSON.stringify(report, null, 2));
