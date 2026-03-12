#!/usr/bin/env node
/**
 * notion.mjs — Read and write Notion pages/databases
 *
 * Usage:
 *   node notion.mjs search "outreach pipeline"
 *   node notion.mjs read <page-id-or-url>
 *   node notion.mjs append <page-id-or-url> "New content paragraph"
 *   node notion.mjs create-page <database-id> --title "Meeting Notes" --content "..."
 *   node notion.mjs query-db <database-id> [--filter-prop "Status" --filter-value "Active"]
 *   node notion.mjs update-prop <page-id> --prop "Status" --value "Done"
 *
 * Env vars (required):
 *   NOTION_API_KEY — Internal integration token (ntn_...)
 *
 * Outputs JSON to stdout.
 */

import { parseArgs } from "node:util";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_VERSION = "2022-06-28";
const BASE_URL = "https://api.notion.com/v1";

if (!NOTION_API_KEY) {
  console.error("NOTION_API_KEY env var is required");
  process.exit(1);
}

// --- Helpers ---

function extractPageId(input) {
  // Accept full URLs, dashed UUIDs, or raw 32-char hex
  const urlMatch = input.match(
    /([a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12})/i
  );
  if (urlMatch) return urlMatch[1].replace(/-/g, "");
  // Try last 32 chars of a Notion URL slug
  const slugMatch = input.match(/([a-f0-9]{32})(?:\?|$)/i);
  if (slugMatch) return slugMatch[1];
  return input;
}

async function notionFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Notion API ${res.status}: ${err.message || res.statusText}`);
  }
  return res.json();
}

// --- Block content extraction ---

function blockToText(block) {
  const type = block.type;
  const data = block[type];
  if (!data) return "";

  const richText = data.rich_text || data.text;
  const text = richText
    ? richText.map((t) => t.plain_text).join("")
    : "";

  switch (type) {
    case "heading_1":
      return `# ${text}`;
    case "heading_2":
      return `## ${text}`;
    case "heading_3":
      return `### ${text}`;
    case "bulleted_list_item":
      return `- ${text}`;
    case "numbered_list_item":
      return `1. ${text}`;
    case "to_do":
      return `${data.checked ? "[x]" : "[ ]"} ${text}`;
    case "toggle":
      return `> ${text}`;
    case "code":
      return `\`\`\`${data.language || ""}\n${text}\n\`\`\``;
    case "divider":
      return "---";
    case "callout":
      return `> ${data.icon?.emoji || ""} ${text}`;
    case "quote":
      return `> ${text}`;
    case "table_row":
      return (data.cells || []).map((c) => c.map((t) => t.plain_text).join("")).join(" | ");
    default:
      return text;
  }
}

function pageTitle(page) {
  const titleProp = Object.values(page.properties || {}).find(
    (p) => p.type === "title"
  );
  if (titleProp?.title) return titleProp.title.map((t) => t.plain_text).join("");
  return page.id;
}

// --- Commands ---

async function cmdSearch(query) {
  const results = await notionFetch("/search", {
    method: "POST",
    body: JSON.stringify({
      query,
      page_size: 10,
    }),
  });

  const items = results.results.map((r) => ({
    id: r.id,
    type: r.object,
    title: r.object === "page" ? pageTitle(r) : r.title?.[0]?.plain_text || r.id,
    url: r.url,
    last_edited: r.last_edited_time,
  }));

  console.log(JSON.stringify({ count: items.length, results: items }, null, 2));
}

async function cmdRead(pageInput) {
  const pageId = extractPageId(pageInput);

  // Get page metadata
  const page = await notionFetch(`/pages/${pageId}`);
  const title = pageTitle(page);

  // Get all blocks (paginated)
  let blocks = [];
  let cursor;
  do {
    const res = await notionFetch(
      `/blocks/${pageId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`
    );
    blocks = blocks.concat(res.results);
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);

  const content = blocks.map(blockToText).filter(Boolean).join("\n");

  // Extract properties
  const props = {};
  for (const [key, val] of Object.entries(page.properties || {})) {
    switch (val.type) {
      case "title":
        props[key] = val.title?.map((t) => t.plain_text).join("") || "";
        break;
      case "rich_text":
        props[key] = val.rich_text?.map((t) => t.plain_text).join("") || "";
        break;
      case "select":
        props[key] = val.select?.name || null;
        break;
      case "multi_select":
        props[key] = val.multi_select?.map((s) => s.name) || [];
        break;
      case "status":
        props[key] = val.status?.name || null;
        break;
      case "date":
        props[key] = val.date?.start || null;
        break;
      case "checkbox":
        props[key] = val.checkbox;
        break;
      case "number":
        props[key] = val.number;
        break;
      case "url":
        props[key] = val.url;
        break;
      case "email":
        props[key] = val.email;
        break;
      case "relation":
        props[key] = val.relation?.map((r) => r.id) || [];
        break;
      default:
        props[key] = `[${val.type}]`;
    }
  }

  console.log(
    JSON.stringify({ id: page.id, title, url: page.url, properties: props, content }, null, 2)
  );
}

async function cmdAppend(pageInput, text) {
  const pageId = extractPageId(pageInput);

  const blocks = text.split("\n").map((line) => ({
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [{ type: "text", text: { content: line } }],
    },
  }));

  await notionFetch(`/blocks/${pageId}/children`, {
    method: "PATCH",
    body: JSON.stringify({ children: blocks }),
  });

  console.log(JSON.stringify({ ok: true, appended: blocks.length, page_id: pageId }));
}

async function cmdCreatePage(databaseId, title, content) {
  const dbId = extractPageId(databaseId);

  const children = content
    ? content.split("\n").map((line) => ({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: line } }],
        },
      }))
    : [];

  const page = await notionFetch("/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: { database_id: dbId },
      properties: {
        Name: { title: [{ text: { content: title } }] },
      },
      children,
    }),
  });

  console.log(JSON.stringify({ ok: true, id: page.id, url: page.url }));
}

async function cmdQueryDb(databaseId, filterProp, filterValue) {
  const dbId = extractPageId(databaseId);

  const body = { page_size: 50 };
  if (filterProp && filterValue) {
    // Auto-detect filter type — try select first, then status, then rich_text
    body.filter = {
      or: [
        { property: filterProp, select: { equals: filterValue } },
        { property: filterProp, status: { equals: filterValue } },
        { property: filterProp, rich_text: { equals: filterValue } },
      ],
    };
  }

  const results = await notionFetch(`/databases/${dbId}/query`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const rows = results.results.map((page) => {
    const props = {};
    for (const [key, val] of Object.entries(page.properties || {})) {
      switch (val.type) {
        case "title":
          props[key] = val.title?.map((t) => t.plain_text).join("") || "";
          break;
        case "rich_text":
          props[key] = val.rich_text?.map((t) => t.plain_text).join("") || "";
          break;
        case "select":
          props[key] = val.select?.name || null;
          break;
        case "multi_select":
          props[key] = val.multi_select?.map((s) => s.name) || [];
          break;
        case "status":
          props[key] = val.status?.name || null;
          break;
        case "date":
          props[key] = val.date?.start || null;
          break;
        case "checkbox":
          props[key] = val.checkbox;
          break;
        case "number":
          props[key] = val.number;
          break;
        case "url":
          props[key] = val.url;
          break;
        default:
          props[key] = `[${val.type}]`;
      }
    }
    return { id: page.id, url: page.url, ...props };
  });

  console.log(JSON.stringify({ count: rows.length, rows }, null, 2));
}

async function cmdUpdateProp(pageInput, prop, value) {
  const pageId = extractPageId(pageInput);

  // Try to detect property type by reading page first
  const page = await notionFetch(`/pages/${pageId}`);
  const existing = page.properties?.[prop];

  let propValue;
  if (!existing) {
    // Default to rich_text
    propValue = { rich_text: [{ text: { content: value } }] };
  } else {
    switch (existing.type) {
      case "select":
        propValue = { select: { name: value } };
        break;
      case "status":
        propValue = { status: { name: value } };
        break;
      case "checkbox":
        propValue = { checkbox: value === "true" };
        break;
      case "number":
        propValue = { number: parseFloat(value) };
        break;
      case "url":
        propValue = { url: value };
        break;
      case "date":
        propValue = { date: { start: value } };
        break;
      case "rich_text":
        propValue = { rich_text: [{ text: { content: value } }] };
        break;
      default:
        propValue = { rich_text: [{ text: { content: value } }] };
    }
  }

  await notionFetch(`/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({ properties: { [prop]: propValue } }),
  });

  console.log(JSON.stringify({ ok: true, page_id: pageId, property: prop, value }));
}

// --- Main ---

const [command, ...rest] = process.argv.slice(2);

const { values: flags } = parseArgs({
  args: rest,
  options: {
    title: { type: "string" },
    content: { type: "string" },
    "filter-prop": { type: "string" },
    "filter-value": { type: "string" },
    prop: { type: "string" },
    value: { type: "string" },
  },
  strict: false,
  allowPositionals: true,
});

const positionals = rest.filter((a) => !a.startsWith("--"));

try {
  switch (command) {
    case "search":
      await cmdSearch(positionals[0] || "");
      break;
    case "read":
      if (!positionals[0]) throw new Error("Usage: notion.mjs read <page-id-or-url>");
      await cmdRead(positionals[0]);
      break;
    case "append":
      if (!positionals[0] || !positionals[1])
        throw new Error("Usage: notion.mjs append <page-id> 'text'");
      await cmdAppend(positionals[0], positionals[1]);
      break;
    case "create-page":
      if (!positionals[0] || !flags.title)
        throw new Error("Usage: notion.mjs create-page <db-id> --title 'Title' [--content '...']");
      await cmdCreatePage(positionals[0], flags.title, flags.content);
      break;
    case "query-db":
      if (!positionals[0]) throw new Error("Usage: notion.mjs query-db <database-id>");
      await cmdQueryDb(positionals[0], flags["filter-prop"], flags["filter-value"]);
      break;
    case "update-prop":
      if (!positionals[0] || !flags.prop || !flags.value)
        throw new Error("Usage: notion.mjs update-prop <page-id> --prop 'Status' --value 'Done'");
      await cmdUpdateProp(positionals[0], flags.prop, flags.value);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error(
        "Commands: search, read, append, create-page, query-db, update-prop"
      );
      process.exit(1);
  }
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
