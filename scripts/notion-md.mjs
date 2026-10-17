#!/usr/bin/env node
// Converts a .knit/ Markdown file to Notion-flavored Markdown for the Notion connector:
// pipe tables become <table> blocks, and < > { } $ ^ are escaped outside code.
// Usage: node scripts/notion-md.mjs <file.md> [more.md ...] > out.txt
import { readFileSync } from "node:fs";

const isRow = (l) => /^\s*\|.*\|\s*$/.test(l ?? "");
const isRule = (l) => /^\s*\|[\s:|-]+\|\s*$/.test(l ?? "");
const cells = (r) => r.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "\\|"));
const inline = (s) => s.split(/(`[^`]*`)/).map((p, i) => (i % 2 ? p : p.replace(/[<>{}$^]/g, "\\$&"))).join("");
const line = (l) => { const m = l.match(/^(\s*>\s?)(.*)$/); return m ? m[1] + inline(m[2]) : inline(l); };

export function toNotion(md) {
  const lines = md.split(/\r?\n/), out = [];
  let code = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*```/.test(l)) { code = !code; out.push(l.trim()); continue; }
    if (code) { out.push(l); continue; }
    if (isRow(l) && isRule(lines[i + 1])) {
      const rows = [l];
      for (i += 2; isRow(lines[i]); i++) rows.push(lines[i]);
      i--;
      out.push('<table header-row="true">', ...rows.map((r) => `\t<tr>\n${cells(r).map((c) => `\t\t<td>${inline(c)}</td>`).join("\n")}\n\t</tr>`), "</table>");
      continue;
    }
    out.push(line(l));
  }
  return out.join("\n");
}

if (process.argv[1]?.endsWith("notion-md.mjs")) {
  for (const f of process.argv.slice(2)) process.stdout.write(toNotion(readFileSync(f, "utf8")) + "\n");
}
