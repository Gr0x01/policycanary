#!/usr/bin/env node
/**
 * upload-image.mjs — Upload a local image to Supabase Storage (blog-images bucket)
 *
 * Usage:
 *   node upload-image.mjs --file /tmp/hero.png --slug "my-blog-post"
 *
 * Flags:
 *   --file   Path to local image file (required)
 *   --slug   Blog post slug, used as storage folder (required)
 *
 * Env vars (required):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Returns the public URL on success.
 */

import { parseArgs } from "node:util";
import { readFileSync, statSync } from "node:fs";
import { extname, basename } from "node:path";
import { createClient } from "@supabase/supabase-js";

const { values: args } = parseArgs({
  options: {
    file: { type: "string" },
    slug: { type: "string" },
  },
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

if (!args.file || !args.slug) {
  console.error("Required: --file, --slug");
  process.exit(1);
}

const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const ext = extname(args.file).toLowerCase();
const mimeType = MIME_TYPES[ext];
if (!mimeType) {
  console.error(`Unsupported file type: ${ext}. Must be .jpg, .jpeg, .png, or .webp`);
  process.exit(1);
}

const stat = statSync(args.file);
if (stat.size > 5 * 1024 * 1024) {
  console.error(`File too large: ${(stat.size / 1024 / 1024).toFixed(1)}MB (max 5MB)`);
  process.exit(1);
}

const fileBuffer = readFileSync(args.file);
const timestamp = Date.now();
const storagePath = `${args.slug}/${timestamp}${ext}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const { error } = await supabase.storage
  .from("blog-images")
  .upload(storagePath, fileBuffer, {
    contentType: mimeType,
    upsert: false,
  });

if (error) {
  console.error("Upload failed:", error.message);
  process.exit(1);
}

const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/blog-images/${storagePath}`;
console.log(publicUrl);
