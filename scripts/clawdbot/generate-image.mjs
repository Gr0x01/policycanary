#!/usr/bin/env node
/**
 * generate-image.mjs — Generate images via Google Gemini (Nano Banana Pro)
 *
 * Usage:
 *   node generate-image.mjs --prompt "A canary in a coal mine watching over FDA documents, digital art style"
 *   node generate-image.mjs --prompt "Warning letter concept art" --output /tmp/hero.png
 *   node generate-image.mjs --prompt "Pharmaceutical laboratory" --aspect landscape
 *
 * Flags:
 *   --prompt TEXT       Image description (required)
 *   --output PATH       Save path (default: /tmp/generated-image.png)
 *   --aspect TEXT       Aspect ratio: square, landscape, portrait (default: landscape)
 *   --style TEXT        Additional style guidance prepended to prompt
 *
 * Env vars (required):
 *   GOOGLE_GENERATIVE_AI_API_KEY
 *
 * Outputs JSON with file path to stdout.
 */

import { parseArgs } from "node:util";
import { writeFileSync } from "node:fs";

const { values: args } = parseArgs({
  options: {
    prompt: { type: "string" },
    output: { type: "string", default: "/tmp/generated-image.png" },
    aspect: { type: "string", default: "landscape" },
    style: { type: "string" },
  },
});

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!API_KEY) {
  console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
  process.exit(1);
}

if (!args.prompt) {
  console.error("--prompt is required");
  process.exit(1);
}

// Build the full prompt with style guidance
let fullPrompt = args.prompt;
if (args.style) {
  fullPrompt = `${args.style}. ${fullPrompt}`;
}

// Add Policy Canary brand-appropriate defaults
fullPrompt += ". Professional, clean, modern design. No text overlays.";

// Use Gemini's image generation via the generateContent API with image output
const model = "gemini-3-pro-image-preview"; // Supports image generation

try {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `Generate an image: ${fullPrompt}` }],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(`Gemini API error (${res.status}): ${text.slice(0, 500)}`);
    process.exit(1);
  }

  const data = await res.json();

  // Find the image part in the response
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith("image/"));

  if (!imagePart) {
    // Check if there's a text response explaining why
    const textPart = parts.find((p) => p.text);
    console.error("No image generated.", textPart ? `Response: ${textPart.text}` : "");
    process.exit(1);
  }

  // Save the image
  const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
  writeFileSync(args.output, imageBuffer);

  console.log(
    JSON.stringify({
      saved_to: args.output,
      mime_type: imagePart.inlineData.mimeType,
      size_bytes: imageBuffer.length,
      prompt: fullPrompt,
    }, null, 2)
  );
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
