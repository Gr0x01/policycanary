#!/usr/bin/env node
/**
 * send-email.mjs — Send email via Gmail API using service account
 *
 * Usage:
 *   node send-email.mjs --to "user@example.com" --subject "Hello" --body "Message body"
 *   node send-email.mjs --to "user@example.com" --subject "Hello" --body-file ./email.html --html
 *   node send-email.mjs --to "user@example.com" --subject "Re: Hello" --body "Reply" --reply-to "<msgid@mail.gmail.com>"
 *
 * Flags:
 *   --to          Recipient email address (required, single address)
 *   --subject     Email subject (required)
 *   --body        Email body text (required unless --body-file)
 *   --body-file   Read body from file (must be within workspace directory)
 *   --html        Treat body as HTML
 *   --cc          CC address (single)
 *   --bcc         BCC address (single)
 *   --reply-to    Message-ID to reply to (threads the email)
 *
 * Env vars:
 *   GMAIL_SERVICE_ACCOUNT_KEY  Path to service account JSON key (default: ~/.credentials/gmail-service-account.json)
 *   GMAIL_SENDER_EMAIL         Email to send as (default: anton@heyfin.ch)
 *
 * Outputs JSON: { success: true, messageId, threadId } or { success: false, error }
 */

import { google } from "googleapis";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { homedir } from "node:os";

// -- Helpers --

function sanitizeHeader(value) {
  return value.replace(/[\r\n]/g, "");
}

function validateEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`Invalid email address: ${email}`);
    process.exit(1);
  }
}

// -- Args --

const { values: args } = parseArgs({
  options: {
    to: { type: "string" },
    subject: { type: "string" },
    body: { type: "string" },
    "body-file": { type: "string" },
    html: { type: "boolean", default: false },
    cc: { type: "string" },
    bcc: { type: "string" },
    "reply-to": { type: "string" },
  },
});

if (!args.to || !args.subject) {
  console.error("Usage: send-email.mjs --to <email> --subject <subject> --body <text>");
  process.exit(1);
}

validateEmail(args.to);
if (args.cc) validateEmail(args.cc);
if (args.bcc) validateEmail(args.bcc);

// Read body from file (restricted to workspace) or inline arg
let body;
if (args["body-file"]) {
  const resolved = resolve(args["body-file"]);
  const workspace = resolve(homedir(), ".openclaw/workspace");
  if (!resolved.startsWith(workspace)) {
    console.error("Error: --body-file must be within the workspace directory");
    process.exit(1);
  }
  body = readFileSync(resolved, "utf-8");
} else {
  body = args.body;
}

if (!body) {
  console.error("Error: --body or --body-file required");
  process.exit(1);
}

const keyPath = process.env.GMAIL_SERVICE_ACCOUNT_KEY
  || resolve(homedir(), ".credentials/gmail-service-account.json");
const senderEmail = process.env.GMAIL_SENDER_EMAIL || "anton@heyfin.ch";

try {
  const keyFile = JSON.parse(readFileSync(keyPath, "utf-8"));

  const auth = new google.auth.JWT({
    email: keyFile.client_email,
    key: keyFile.private_key,
    scopes: ["https://www.googleapis.com/auth/gmail.send"],
    subject: senderEmail,
  });

  const gmail = google.gmail({ version: "v1", auth });

  // Build RFC 2822 message (all header values sanitized against injection)
  const contentType = args.html ? "text/html" : "text/plain";
  const headers = [
    `From: ${senderEmail}`,
    `To: ${sanitizeHeader(args.to)}`,
    `Subject: ${sanitizeHeader(args.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `MIME-Version: 1.0`,
    `Content-Type: ${contentType}; charset=utf-8`,
  ];
  if (args.cc) headers.push(`Cc: ${sanitizeHeader(args.cc)}`);
  if (args.bcc) headers.push(`Bcc: ${sanitizeHeader(args.bcc)}`);
  if (args["reply-to"]) {
    const replyTo = sanitizeHeader(args["reply-to"]);
    headers.push(`In-Reply-To: ${replyTo}`);
    headers.push(`References: ${replyTo}`);
  }

  const rawMessage = [...headers, "", body].join("\r\n");
  const encoded = Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encoded },
  });

  console.log(JSON.stringify({
    success: true,
    messageId: res.data.id,
    threadId: res.data.threadId,
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
