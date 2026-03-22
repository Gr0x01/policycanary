#!/usr/bin/env node
/**
 * read-email.mjs — Read emails via Gmail API using service account
 *
 * Usage:
 *   node read-email.mjs                          # Last 10 inbox messages
 *   node read-email.mjs --query "is:unread"      # Unread messages
 *   node read-email.mjs --query "from:user@example.com" --limit 5
 *   node read-email.mjs --id <messageId>         # Read a specific message
 *   node read-email.mjs --query "subject:policy canary" --full
 *
 * Flags:
 *   --query       Gmail search query (default: "in:inbox")
 *   --limit       Max results (default: 10, max: 50)
 *   --id          Fetch a specific message by ID (returns full message)
 *   --full        Include full body text in list results (default: headers only)
 *   --unread      Shortcut for --query "is:unread"
 *
 * Note: Body content may be text/plain or text/html depending on the message.
 *       The bodyType field indicates which format was extracted.
 *
 * Env vars:
 *   GMAIL_SERVICE_ACCOUNT_KEY  Path to service account JSON key (default: ~/.credentials/gmail-service-account.json)
 *   GMAIL_SENDER_EMAIL         Email account to read (default: anton@heyfin.ch)
 *
 * Outputs JSON to stdout.
 */

import { google } from "googleapis";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { homedir } from "node:os";

const { values: args } = parseArgs({
  options: {
    query: { type: "string" },
    limit: { type: "string", default: "10" },
    id: { type: "string" },
    full: { type: "boolean", default: false },
    unread: { type: "boolean", default: false },
  },
});

const keyPath = process.env.GMAIL_SERVICE_ACCOUNT_KEY
  || resolve(homedir(), ".credentials/gmail-service-account.json");
const accountEmail = process.env.GMAIL_SENDER_EMAIL || "anton@heyfin.ch";

try {
  const keyFile = JSON.parse(readFileSync(keyPath, "utf-8"));

  const auth = new google.auth.JWT({
    email: keyFile.client_email,
    key: keyFile.private_key,
    scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
    subject: accountEmail,
  });

  const gmail = google.gmail({ version: "v1", auth });

  // Single message by ID
  if (args.id) {
    const msg = await gmail.users.messages.get({
      userId: "me",
      id: args.id,
      format: "full",
    });
    const headers = extractHeaders(msg.data.payload.headers);
    const { body, bodyType } = extractBody(msg.data.payload);
    console.log(JSON.stringify({
      success: true,
      message: { id: msg.data.id, threadId: msg.data.threadId, ...headers, body, bodyType },
    }));
    process.exit(0);
  }

  // List messages
  const query = args.unread ? "is:unread" : (args.query || "in:inbox");
  const limit = Math.min(parseInt(args.limit) || 10, 50);

  const list = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: limit,
  });

  if (!list.data.messages || list.data.messages.length === 0) {
    console.log(JSON.stringify({ success: true, messages: [], total: 0, query }));
    process.exit(0);
  }

  const format = args.full ? "full" : "metadata";
  const metadataHeaders = ["From", "To", "Subject", "Date", "Message-ID"];

  // Fetch in batches of 10 to avoid Gmail API rate limits
  const messages = [];
  const batchSize = 10;
  for (let i = 0; i < list.data.messages.length; i += batchSize) {
    const batch = list.data.messages.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (m) => {
        const msg = await gmail.users.messages.get({
          userId: "me",
          id: m.id,
          format,
          ...(format === "metadata" ? { metadataHeaders } : {}),
        });
        const headers = extractHeaders(msg.data.payload.headers);
        const result = {
          id: msg.data.id,
          threadId: msg.data.threadId,
          snippet: msg.data.snippet,
          labelIds: msg.data.labelIds,
          ...headers,
        };
        if (args.full) {
          const { body, bodyType } = extractBody(msg.data.payload);
          result.body = body;
          result.bodyType = bodyType;
        }
        return result;
      })
    );
    messages.push(...results);
  }

  console.log(JSON.stringify({
    success: true,
    messages,
    total: list.data.resultSizeEstimate,
    query,
  }));
} catch (err) {
  const safeError = err.code
    ? `Gmail API error ${err.code}: ${err.errors?.[0]?.message || "unknown"}`
    : (err.message || "unknown error").replace(/[\r\n]+/g, " ").slice(0, 200);
  console.log(JSON.stringify({
    success: false,
    error: safeError,
  }));
  process.exit(1);
}

function extractHeaders(headers) {
  if (!headers) return {};
  const pick = {};
  for (const h of headers) {
    const key = h.name.toLowerCase().replace(/-/g, "_");
    if (["from", "to", "subject", "date", "message_id"].includes(key)) {
      pick[key] = h.value;
    }
  }
  return pick;
}

function extractBody(payload) {
  if (!payload) return { body: "", bodyType: "text/plain" };

  // Simple body
  if (payload.body?.data) {
    return {
      body: Buffer.from(payload.body.data, "base64url").toString("utf-8"),
      bodyType: payload.mimeType || "text/plain",
    };
  }

  // Multipart — prefer text/plain, fall back to text/html
  if (payload.parts) {
    const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
    const part = textPart || htmlPart;
    if (part?.body?.data) {
      return {
        body: Buffer.from(part.body.data, "base64url").toString("utf-8"),
        bodyType: part.mimeType,
      };
    }
    // Nested multipart
    for (const p of payload.parts) {
      if (p.parts) {
        const nested = extractBody(p);
        if (nested.body) return nested;
      }
    }
  }
  return { body: "", bodyType: "text/plain" };
}
