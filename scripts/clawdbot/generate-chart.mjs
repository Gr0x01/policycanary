#!/usr/bin/env node
/**
 * generate-chart.mjs — Generate chart images via QuickChart.io
 *
 * Usage:
 *   node generate-chart.mjs --type bar --title "Recalls by Quarter" \
 *     --labels "Q1 2024,Q2 2024,Q3 2024,Q4 2024" \
 *     --data "165,267,407,316" --data-label "Recalls"
 *
 *   node generate-chart.mjs --type line --title "Warning Letters Trend" \
 *     --labels "Q1,Q2,Q3,Q4" --data "44,145,161,131" --data-label "Warning Letters" \
 *     --data2 "165,267,407,316" --data2-label "Recalls"
 *
 *   node generate-chart.mjs --type pie --title "Recall Classifications" \
 *     --labels "Class I,Class II,Class III" --data "1115,1475,193"
 *
 *   node generate-chart.mjs --type horizontalBar --title "Top Allergens in Recalls" \
 *     --labels "Milk,Wheat,Soy,Egg,Sesame" --data "230,163,115,106,65"
 *
 *   node generate-chart.mjs --config '{"type":"bar","data":{...}}' # Raw Chart.js config
 *
 * Flags:
 *   --type TYPE           Chart type: bar, line, pie, doughnut, horizontalBar, radar
 *   --title TEXT           Chart title
 *   --labels CSV           Comma-separated labels
 *   --data CSV             Comma-separated data values (first dataset)
 *   --data-label TEXT      Label for first dataset
 *   --data2 CSV            Second dataset (optional)
 *   --data2-label TEXT     Label for second dataset
 *   --color TEXT           Color for first dataset (default: #2563eb)
 *   --color2 TEXT          Color for second dataset (default: #f59e0b)
 *   --config JSON          Raw Chart.js config (overrides all other flags)
 *   --width N              Image width (default: 600)
 *   --height N             Image height (default: 400)
 *   --output PATH          Save to file instead of printing URL
 *
 * Outputs JSON with chart URL (or saves PNG to --output path).
 */

import { parseArgs } from "node:util";
import { writeFileSync } from "node:fs";

const { values: args } = parseArgs({
  options: {
    type: { type: "string", default: "bar" },
    title: { type: "string", default: "" },
    labels: { type: "string" },
    data: { type: "string" },
    "data-label": { type: "string", default: "Value" },
    data2: { type: "string" },
    "data2-label": { type: "string", default: "Value 2" },
    color: { type: "string", default: "#2563eb" },
    color2: { type: "string", default: "#f59e0b" },
    config: { type: "string" },
    width: { type: "string", default: "480" },
    height: { type: "string", default: "280" },
    output: { type: "string" },
  },
});

let chartConfig;

if (args.config) {
  chartConfig = JSON.parse(args.config);
} else {
  if (!args.labels || !args.data) {
    console.error("--labels and --data are required (or use --config)");
    process.exit(1);
  }

  const labels = args.labels.split(",").map((l) => l.trim());
  const data = args.data.split(",").map((v) => parseFloat(v.trim()));

  const datasets = [
    {
      label: args["data-label"],
      data,
      backgroundColor: args.type === "line" ? "transparent" : args.color + "cc",
      borderColor: args.color,
      borderWidth: 2,
    },
  ];

  if (args.data2) {
    const data2 = args.data2.split(",").map((v) => parseFloat(v.trim()));
    datasets.push({
      label: args["data2-label"],
      data: data2,
      backgroundColor: args.type === "line" ? "transparent" : args.color2 + "cc",
      borderColor: args.color2,
      borderWidth: 2,
    });
  }

  // For pie/doughnut, use a color palette instead of single color
  if (args.type === "pie" || args.type === "doughnut") {
    const palette = [
      "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6",
      "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
    ];
    datasets[0].backgroundColor = data.map((_, i) => palette[i % palette.length]);
    delete datasets[0].borderColor;
    datasets[0].borderWidth = 1;
  }

  chartConfig = {
    type: args.type,
    data: { labels, datasets },
    options: {
      plugins: {
        title: args.title ? { display: true, text: args.title, font: { size: 16 } } : undefined,
        legend: { display: datasets.length > 1 || args.type === "pie" || args.type === "doughnut" },
      },
      scales: ["pie", "doughnut", "radar"].includes(args.type)
        ? undefined
        : {
            y: { beginAtZero: true },
          },
    },
  };
}

const width = parseInt(args.width, 10);
const height = parseInt(args.height, 10);

const quickchartUrl = `https://quickchart.io/chart?w=${width}&h=${height}&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;

if (args.output) {
  try {
    const res = await fetch(quickchartUrl);
    if (!res.ok) throw new Error(`QuickChart error: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(args.output, buffer);
    console.log(JSON.stringify({ saved_to: args.output, url: quickchartUrl }, null, 2));
  } catch (err) {
    console.error("Error saving chart:", err.message);
    process.exit(1);
  }
} else {
  // For very long URLs, use POST instead
  if (quickchartUrl.length > 2000) {
    try {
      const res = await fetch("https://quickchart.io/chart/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          width,
          height,
          chart: chartConfig,
        }),
      });
      if (!res.ok) throw new Error(`QuickChart error: ${res.status}`);
      const result = await res.json();
      console.log(JSON.stringify({ url: result.url, short: true }, null, 2));
    } catch (err) {
      console.error("Error:", err.message);
      process.exit(1);
    }
  } else {
    console.log(JSON.stringify({ url: quickchartUrl }, null, 2));
  }
}
