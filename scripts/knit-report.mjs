#!/usr/bin/env node
// Builds run-report.md, token-report.md and tokens.svg from <project>/.knit/events.jsonl.
// Usage: node scripts/knit-report.mjs <project-dir>   (format: docs/EVENTS.md)
import { readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { AGENTS } from "./palette.mjs";

const project = resolve(process.argv[2] ?? ".");
const dir = join(project, ".knit");
const events = readFileSync(join(dir, "events.jsonl"), "utf8")
  .split(/\r?\n/)
  .filter((l) => l.trim())
  .map((l, i) => {
    try { return JSON.parse(l); } catch { throw new Error(`events.jsonl line ${i + 1} is not valid JSON`); }
  });

const color = (a) => (AGENTS[a] ? [AGENTS[a].light, AGENTS[a].dark] : ["#525965", "#A3AEBD"]);
const num = (n) => n.toLocaleString("en-US");
const short = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : `${Math.round(n / 1e3)}k`);
const mins = (ms) => (!ms ? "-" : ms >= 3.6e6 ? `${Math.floor(ms / 3.6e6)}h ${Math.round((ms % 3.6e6) / 6e4)}m` : `${Math.max(1, Math.round(ms / 6e4))}m`);
const time = (ts) => (ts ? ts.slice(11, 16) : "");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const cell = (s) => String(s ?? "").replace(/\|/g, "\\|");
const of = (type) => events.filter((e) => e.type === type);

// Per-agent usage from agent_end events.
const runs = of("agent_end");
const usage = new Map();
for (const r of runs) {
  const u = usage.get(r.agent) ?? { runs: 0, tokens: 0, tools: 0, ms: 0, model: r.model ?? "" };
  u.runs += 1; u.tokens += r.tokens ?? 0; u.tools += r.tool_uses ?? 0; u.ms += r.duration_ms ?? 0;
  if (r.model) u.model = r.model;
  usage.set(r.agent, u);
}
const ranked = [...usage].sort((a, b) => b[1].tokens - a[1].tokens);
const total = ranked.reduce((s, [, u]) => s + u.tokens, 0);
const totalMs = ranked.reduce((s, [, u]) => s + u.ms, 0);
const first = events[0]?.ts, last = events.at(-1)?.ts;
const name = basename(project);

// tokens.svg: horizontal bars that follow the reader's light/dark setting.
const rowH = 28, top = 56, w = 760, labelW = 170, valueW = 70, barW = w - labelW - valueW - 40;
const h = top + ranked.length * rowH + 24;
const max = ranked[0]?.[1].tokens || 1;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Tokens by agent, ${short(total)} in total">
<style>
.bg{fill:#FFFFFF}.t{fill:#16181D;font:600 16px system-ui,sans-serif}.l{fill:#16181D;font:13px system-ui,sans-serif}.v{fill:#525965;font:12px ui-monospace,monospace}.track{fill:#EFEBE2}
${ranked.map(([a], i) => `.b${i}{fill:${color(a)[0]}}`).join("")}
@media (prefers-color-scheme: dark){.bg{fill:#151A22}.t,.l{fill:#E9EDF3}.v{fill:#A3AEBD}.track{fill:#232B37}${ranked.map(([a], i) => `.b${i}{fill:${color(a)[1]}}`).join("")}}
</style>
<rect class="bg" width="${w}" height="${h}" rx="14"/>
<text class="t" x="20" y="32">Tokens by agent · ${esc(name)} · ${short(total)} total</text>
${ranked.map(([a, u], i) => {
  const y = top + i * rowH, bw = Math.max(3, Math.round((u.tokens / max) * barW));
  return `<text class="l" x="20" y="${y + 15}">${esc(a)}</text><rect class="track" x="${labelW}" y="${y + 4}" width="${barW}" height="14" rx="7"/><rect class="b${i}" x="${labelW}" y="${y + 4}" width="${bw}" height="14" rx="7"/><text class="v" x="${w - 20}" y="${y + 15}" text-anchor="end">${short(u.tokens)}</text>`;
}).join("\n")}
</svg>
`;

const tokenReport = `# Token usage: ${name}

Run: ${first ?? "?"} to ${last ?? "?"} · ${runs.length} agent runs · **${num(total)} tokens** · ${mins(totalMs)} of agent time

![Tokens by agent](tokens.svg)

| Agent | Model | Runs | Tokens | Share | Tool uses | Agent time |
|---|---|---:|---:|---:|---:|---:|
${ranked.map(([a, u]) => `| ${a} | ${u.model} | ${u.runs} | ${num(u.tokens)} | ${((u.tokens / (total || 1)) * 100).toFixed(1)}% | ${u.tools} | ${mins(u.ms)} |`).join("\n")}
| **Total** | | **${runs.length}** | **${num(total)}** | 100% | ${ranked.reduce((s, [, u]) => s + u.tools, 0)} | ${mins(totalMs)} |

Biggest consumers: ${ranked.slice(0, 3).map(([a, u]) => `${a} (${short(u.tokens)})`).join(", ") || "none"}.

> Tokens are the usage each agent reported when it handed back to the Manager. The Manager's own
> (main session) tokens are not included unless the Manager logged them as \`manager\` runs.
`;

// Handoff graph as Mermaid.
const id = (a) => a.replace(/[^a-z0-9]/gi, "_");
const edges = [...new Set(of("handoff").map((e) => `  ${id(e.agent)}[${e.agent}] -->|${e.file ?? ""}| ${id(e.to)}[${e.to}]`))];
const timeline = events.filter((e) => ["phase", "gate", "decision", "test", "review", "commit"].includes(e.type));
const tests = of("test");
const lastTest = tests.at(-1);
const loops = runs.filter((r) => r.agent === "debugger").length;
const reviewRounds = of("review").filter((e) => e.agent === "code-reviewer").length;
const gates = of("gate");
const notes = of("note");

const runReport = `# How the team worked: ${name}

## Summary

- **When:** ${first ?? "?"} to ${last ?? "?"}
- **Team:** ${usage.size} agents, ${runs.length} agent runs, ${mins(totalMs)} of agent time, ${num(total)} tokens ([token report](token-report.md))
- **Handoffs:** ${of("handoff").length} · **Debug loops:** ${loops} · **Code review rounds:** ${reviewRounds} · **Gates:** ${gates.length}
- **Last test run:** ${lastTest ? `${lastTest.msg}${lastTest.counts ? ` (${Object.entries(lastTest.counts).map(([k, v]) => `${v} ${k}`).join(", ")})` : ""}` : "none logged"}

## Timeline

| Time | Type | Who | What |
|---|---|---|---|
${timeline.map((e) => `| ${time(e.ts)} | ${e.type} | ${e.agent ?? ""} | ${cell(e.msg)} |`).join("\n")}

## Who handed what to whom

${edges.length ? `\`\`\`mermaid\nflowchart LR\n${edges.join("\n")}\n\`\`\`` : "No handoffs logged."}

## Agent runs

| # | Agent | Task | Result | Tokens | Time | Note |
|---:|---|---|---|---:|---:|---|
${runs.map((r, i) => `| ${i + 1} | ${r.agent} | ${cell(r.task ?? "")} | ${r.result ?? ""} | ${num(r.tokens ?? 0)} | ${mins(r.duration_ms ?? 0)} | ${cell(r.msg)} |`).join("\n")}
${notes.length ? `\n## Notes and lessons\n\n${notes.map((n) => `- ${n.msg}`).join("\n")}\n` : ""}`;

writeFileSync(join(dir, "tokens.svg"), svg);
writeFileSync(join(dir, "token-report.md"), tokenReport);
writeFileSync(join(dir, "run-report.md"), runReport);
console.log(`Wrote run-report.md, token-report.md and tokens.svg to ${dir} (${events.length} events, ${runs.length} agent runs).`);
