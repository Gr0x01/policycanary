#!/usr/bin/env node
/**
 * posthog.mjs — Query PostHog analytics for Policy Canary and Finch
 *
 * Usage:
 *   node posthog.mjs events --project pc --days 7
 *   node posthog.mjs events --project finch --event '$pageview' --days 3 --limit 10
 *   node posthog.mjs persons --project pc --search "john@example.com"
 *   node posthog.mjs insights --project pc
 *   node posthog.mjs insight --project pc --id 12345
 *   node posthog.mjs dashboards --project pc
 *   node posthog.mjs dashboard --project pc --id 123
 *   node posthog.mjs query --project pc --sql "SELECT event, count() FROM events WHERE timestamp > now() - interval 7 day GROUP BY event ORDER BY count() DESC LIMIT 20"
 *
 * Projects:
 *   pc    — Policy Canary (project 334096)
 *   finch — Finch (project 319191)
 *
 * Env vars (required):
 *   POSTHOG_API_KEY — Personal API key (phx_...)
 *
 * Outputs JSON to stdout.
 */

import { parseArgs } from "node:util";

const PROJECTS = {
  pc: 334096,
  finch: 319191,
};

const API_HOST = "https://us.posthog.com";
const API_KEY = process.env.POSTHOG_API_KEY;

if (!API_KEY) {
  console.error("Error: POSTHOG_API_KEY env var is required");
  process.exit(1);
}

const command = process.argv[2];
const rawArgs = process.argv.slice(3);

const { values: args } = parseArgs({
  args: rawArgs,
  options: {
    project: { type: "string", default: "pc" },
    days: { type: "string", default: "7" },
    limit: { type: "string", default: "20" },
    event: { type: "string" },
    search: { type: "string" },
    id: { type: "string" },
    sql: { type: "string" },
  },
});

const projectId = PROJECTS[args.project];
if (!projectId) {
  console.error(`Error: Unknown project "${args.project}". Use: pc, finch`);
  process.exit(1);
}

async function api(path, options = {}) {
  const url = `${API_HOST}/api/projects/${projectId}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PostHog API ${res.status}: ${text}`);
  }
  return res.json();
}

async function cmdEvents() {
  const days = parseInt(args.days);
  const limit = parseInt(args.limit);
  const after = new Date(Date.now() - days * 86400000).toISOString();

  const params = new URLSearchParams({
    after,
    limit: String(limit),
    orderBy: '["-timestamp"]',
  });
  if (args.event) params.set("event", args.event);

  const data = await api(`/events/?${params}`);

  const events = (data.results || []).map((e) => ({
    event: e.event,
    distinct_id: e.distinct_id,
    timestamp: e.timestamp,
    properties: summarizeProperties(e.properties),
  }));

  console.log(JSON.stringify({ project: args.project, days, count: events.length, events }, null, 2));
}

async function cmdPersons() {
  const params = new URLSearchParams({ limit: args.limit });
  if (args.search) params.set("search", args.search);

  const data = await api(`/persons/?${params}`);

  const persons = (data.results || []).map((p) => ({
    id: p.id,
    distinct_ids: p.distinct_ids?.slice(0, 3),
    properties: {
      email: p.properties?.email,
      name: p.properties?.name || p.properties?.$name,
      company_name: p.properties?.company_name,
      access_level: p.properties?.access_level,
      product_count: p.properties?.product_count,
      last_seen: p.properties?.$last_seen || p.properties?.last_seen,
    },
    created_at: p.created_at,
  }));

  console.log(JSON.stringify({ project: args.project, count: persons.length, persons }, null, 2));
}

async function cmdInsights() {
  const params = new URLSearchParams({ limit: args.limit });
  const data = await api(`/insights/?${params}`);

  const insights = (data.results || []).map((i) => ({
    id: i.id,
    name: i.name,
    description: i.description,
    last_modified_at: i.last_modified_at,
    filters: i.filters ? { insight: i.filters.insight, events: i.filters.events?.map((e) => e.id) } : null,
  }));

  console.log(JSON.stringify({ project: args.project, count: insights.length, insights }, null, 2));
}

async function cmdInsight() {
  if (!args.id) { console.error("Error: --id required"); process.exit(1); }
  const data = await api(`/insights/${args.id}/`);
  console.log(JSON.stringify({
    id: data.id,
    name: data.name,
    description: data.description,
    filters: data.filters,
    result: data.result,
    last_refresh: data.last_refresh,
  }, null, 2));
}

async function cmdDashboards() {
  const data = await api(`/dashboards/?limit=${args.limit}`);

  const dashboards = (data.results || []).map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    pinned: d.pinned,
    created_at: d.created_at,
    tiles_count: d.tiles?.length || 0,
  }));

  console.log(JSON.stringify({ project: args.project, count: dashboards.length, dashboards }, null, 2));
}

async function cmdDashboard() {
  if (!args.id) { console.error("Error: --id required"); process.exit(1); }
  const data = await api(`/dashboards/${args.id}/`);
  console.log(JSON.stringify({
    id: data.id,
    name: data.name,
    description: data.description,
    tiles: (data.tiles || []).map((t) => ({
      id: t.id,
      insight_id: t.insight?.id,
      insight_name: t.insight?.name,
    })),
  }, null, 2));
}

async function cmdQuery() {
  if (!args.sql) { console.error("Error: --sql required"); process.exit(1); }
  const data = await api(`/query/`, {
    method: "POST",
    body: JSON.stringify({ query: { kind: "HogQLQuery", query: args.sql } }),
  });
  console.log(JSON.stringify({
    project: args.project,
    columns: data.columns,
    results: data.results?.slice(0, parseInt(args.limit)),
  }, null, 2));
}

function summarizeProperties(props) {
  if (!props) return {};
  const keep = [
    "$current_url", "$pathname", "$referrer", "$browser", "$os",
    "$screen_width", "email", "utm_source", "utm_medium", "utm_campaign",
  ];
  const out = {};
  for (const k of keep) {
    if (props[k] !== undefined) out[k] = props[k];
  }
  return out;
}

const commands = {
  events: cmdEvents,
  persons: cmdPersons,
  insights: cmdInsights,
  insight: cmdInsight,
  dashboards: cmdDashboards,
  dashboard: cmdDashboard,
  query: cmdQuery,
};

if (!commands[command]) {
  console.error(`Usage: node posthog.mjs <command> --project <pc|finch> [options]`);
  console.error(`Commands: ${Object.keys(commands).join(", ")}`);
  process.exit(1);
}

commands[command]().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
