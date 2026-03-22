#!/usr/bin/env node
/**
 * MCP Server: Son of Anton — Content Tools
 *
 * Tools for Claude Desktop content automation:
 *   - generate_image: Gemini image gen → saves locally
 *   - generate_and_upload_image: Gemini image gen → Supabase Storage → public URL
 *   - publish_blog: Publish/update blog post via API
 *   - publish_intelligence: Publish/update intelligence page via API
 *
 * Run:
 *   node scripts/mcp/image-gen-server.mjs
 *
 * Claude Desktop config (claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "son-of-anton": {
 *         "command": "node",
 *         "args": ["/Users/rb/Documents/coding_projects/policy_canary/scripts/mcp/image-gen-server.mjs"],
 *         "env": {
 *           "GOOGLE_GENERATIVE_AI_API_KEY": "...",
 *           "SUPABASE_URL": "...",
 *           "SUPABASE_SECRET_KEY": "...",
 *           "BLOG_API_KEY": "...",
 *           "SITE_URL": "https://policycanary.io"
 *         }
 *       }
 *     }
 *   }
 *
 * Env vars:
 *   GOOGLE_GENERATIVE_AI_API_KEY  — required for image tools
 *   SUPABASE_URL                  — required for upload + publish tools
 *   SUPABASE_SECRET_KEY     — required for upload tool
 *   BLOG_API_KEY                  — required for publish tools
 *   SITE_URL                      — optional, defaults to https://policycanary.io
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const GEMINI_MODEL = "gemini-3-pro-image-preview";

async function generateImageFromGemini(prompt, style) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");

  let fullPrompt = prompt;
  if (style) fullPrompt = `${style}. ${fullPrompt}`;
  fullPrompt += ". Professional, clean, modern design. No text overlays.";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Generate an image: ${fullPrompt}` }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${text.slice(0, 500)}`);
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith("image/"));

  if (!imagePart) {
    const textPart = parts.find((p) => p.text);
    throw new Error(`No image generated. ${textPart ? textPart.text : ""}`);
  }

  return {
    buffer: Buffer.from(imagePart.inlineData.data, "base64"),
    mimeType: imagePart.inlineData.mimeType,
  };
}

async function uploadToSupabase(imageBuffer, mimeType, slug) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");

  const ext = mimeType === "image/png" ? ".png" : mimeType === "image/webp" ? ".webp" : ".jpg";
  const storagePath = `${slug}/${Date.now()}${ext}`;
  const supabase = createClient(url, key);

  const { error } = await supabase.storage
    .from("blog-images")
    .upload(storagePath, imageBuffer, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  return `${url}/storage/v1/object/public/blog-images/${storagePath}`;
}

// --- Publishing helpers ---

const VALID_BLOG_CATEGORIES = [
  "weekly_roundup",
  "warning_letter_analysis",
  "regulatory_trends",
  "breaking_analysis",
];

const VALID_PAGE_TYPES = ["ingredient", "enforcement", "regulation"];

function stripMetadataBlock(content) {
  content = content.replace(/^---\n\*\*[\s\S]*?\n---\n+/, "");
  content = content.replace(/^(\*\*[A-Za-z ]+:\*\*.*\n)+\n*/m, "");
  return content;
}

async function publishToApi(endpoint, body) {
  const apiKey = process.env.BLOG_API_KEY;
  if (!apiKey) throw new Error("Missing BLOG_API_KEY");

  const baseUrl = process.env.SITE_URL || "https://policycanary.io";
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(`API error (${res.status}): ${JSON.stringify(json)}`);
  return json;
}

// --- MCP Server ---

const server = new McpServer({
  name: "son-of-anton",
  version: "1.0.0",
});

server.tool(
  "generate_image",
  "Generate an image using Google Gemini and save it locally",
  z.object({
    prompt: z.string().describe("Image description"),
    output: z.string().default("/tmp/generated-image.png").describe("Local file path to save the image"),
    style: z.string().optional().describe("Style guidance prepended to prompt"),
  }),
  async ({ prompt, output, style }) => {
    const { buffer, mimeType } = await generateImageFromGemini(prompt, style);
    writeFileSync(output, buffer);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ saved_to: output, mime_type: mimeType, size_bytes: buffer.length }),
        },
      ],
    };
  }
);

server.tool(
  "generate_and_upload_image",
  "Generate an image using Google Gemini and upload it to Supabase Storage. Returns a public URL for use as a blog cover image.",
  z.object({
    prompt: z.string().describe("Image description"),
    slug: z.string().describe("Blog post or page slug (used as storage folder)"),
    style: z.string().optional().describe("Style guidance prepended to prompt"),
  }),
  async ({ prompt, slug, style }) => {
    const { buffer, mimeType } = await generateImageFromGemini(prompt, style);
    const publicUrl = await uploadToSupabase(buffer, mimeType, slug);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ public_url: publicUrl, mime_type: mimeType, size_bytes: buffer.length }),
        },
      ],
    };
  }
);

server.tool(
  "publish_blog",
  "Publish or update a blog post on policycanary.io. Upserts on slug — safe to call again to update an existing post. Returns the created/updated post data.",
  z.object({
    title: z.string().describe("Blog post title"),
    slug: z.string().describe("URL slug (lowercase-hyphen, e.g. 'fda-weekly-roundup-march-14')"),
    content: z.string().describe("Full markdown content of the blog post"),
    category: z.enum(VALID_BLOG_CATEGORIES).describe("Post category"),
    excerpt: z.string().describe("Short summary (1-2 sentences) for index pages and SEO"),
    status: z.enum(["draft", "published"]).default("draft").describe("Publish status — use 'draft' until review is complete"),
    cover_image_url: z.string().optional().describe("Public URL for cover image (from generate_and_upload_image)"),
  }),
  async ({ title, slug, content, category, excerpt, status, cover_image_url }) => {
    const cleanContent = stripMetadataBlock(content);
    const body = {
      title,
      slug,
      content: cleanContent,
      category,
      excerpt,
      status,
      ...(cover_image_url && { cover_image_url }),
    };
    const result = await publishToApi("/api/blog", body);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "publish_intelligence",
  "Publish or update an intelligence page on policycanary.io (ingredients, enforcement, or regulations). Upserts on (page_type, slug).",
  z.object({
    page_type: z.enum(VALID_PAGE_TYPES).describe("Page surface: ingredient, enforcement, or regulation"),
    title: z.string().describe("Page title"),
    slug: z.string().describe("URL slug (lowercase-hyphen, e.g. 'red-no-3' or 'mocra')"),
    content: z.string().describe("Full markdown content"),
    excerpt: z.string().describe("Short summary for index pages and SEO"),
    structured_data: z.record(z.unknown()).optional().describe("Typed structured data (IngredientData, EnforcementData, or RegulationData)"),
    status: z.enum(["draft", "published", "needs_refresh"]).default("draft").describe("Publish status"),
    seo_title: z.string().optional().describe("SEO title override"),
    seo_description: z.string().optional().describe("SEO description override"),
    cover_image_url: z.string().optional().describe("Cover image URL"),
  }),
  async ({ page_type, title, slug, content, excerpt, structured_data, status, seo_title, seo_description, cover_image_url }) => {
    const cleanContent = stripMetadataBlock(content);
    const body = {
      page_type,
      slug,
      title,
      excerpt,
      content: cleanContent,
      structured_data: structured_data || {},
      status,
      ...(seo_title && { seo_title }),
      ...(seo_description && { seo_description }),
      ...(cover_image_url && { cover_image_url }),
    };
    const result = await publishToApi("/api/intelligence", body);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
