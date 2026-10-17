#!/usr/bin/env node
// Draws the README graphics (logo, team, flow) in light and dark versions into assets/.
// Usage: node scripts/build-assets.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { AGENTS, THEMES, glyph } from "./palette.mjs";

const out = new URL("../assets/", import.meta.url);
mkdirSync(out, { recursive: true });
const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const core = Object.keys(AGENTS).filter((k) => !AGENTS[k].optional);
const optional = Object.keys(AGENTS).filter((k) => AGENTS[k].optional);
const svg = (w, h, label, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}" font-family="${FONT}">\n${body}\n</svg>\n`;

// The Knit mark: two half-loops of thread around a knot.
const mark = (x, y, s, t) => `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke-width="3" stroke-linecap="round">
<path d="M5 16c0-6 5-10 11-10s11 4 11 10" stroke="${t.accent}"/><path d="M27 16c0 6-5 10-11 10S5 22 5 16" stroke="${t.ink}" stroke-dasharray="4 5"/><circle cx="16" cy="16" r="3.5" fill="${t.accent}" stroke="none"/></g>`;

const logo = (mode) => {
  const t = THEMES[mode];
  const dots = core.map((k, i) => `<circle cx="${236 + i * 22}" cy="128" r="6" fill="${AGENTS[k][mode]}"/>`).join("");
  return svg(720, 160, "Knit: a multi-agent software team", `${mark(20, 22, 3.6, t)}
<text x="150" y="88" font-size="72" font-weight="800" letter-spacing="-2" fill="${t.ink}">Knit</text>
<text x="324" y="86" font-size="22" fill="${t.muted}">a multi-agent software team</text>
<text x="150" y="133" font-size="15" fill="${t.muted}">the team</text>${dots}`);
};

const team = (mode) => {
  const t = THEMES[mode];
  const cells = core.map((k, i) => {
    const cx = 72 + (i % 7) * 136 + (i >= 7 ? 68 : 0), cy = 130 + Math.floor(i / 7) * 150, a = AGENTS[k];
    return `<circle cx="${cx}" cy="${cy}" r="36" fill="${t.panel}" stroke="${t.line}" stroke-width="2"/>
<circle cx="${cx}" cy="${cy}" r="36" fill="none" stroke="${a[mode]}" stroke-width="3" stroke-dasharray="40 186" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="${6 + (i % 4)}s" repeatCount="indefinite"/></circle>
${glyph(k, cx - 17, cy - 17, 34, mode)}
<text x="${cx}" y="${cy + 62}" font-size="14" font-weight="600" text-anchor="middle" fill="${t.ink}">${a.name}</text>`;
  }).join("\n");
  const opts = optional.map((k, i) => {
    const cx = 70 + i * 117, cy = 452;
    return `<circle cx="${cx}" cy="${cy}" r="22" fill="none" stroke="${t.faint}" stroke-width="1.5" stroke-dasharray="3 4"/>
${glyph(k, cx - 11, cy - 11, 22, mode)}
<text x="${cx}" y="${cy + 40}" font-size="12" text-anchor="middle" fill="${t.muted}">${AGENTS[k].name}</text>`;
  }).join("\n");
  return svg(960, 520, "The Knit team: the Manager, 12 core agents and 8 optional specialists", `<rect width="960" height="520" rx="18" fill="${t.bg}" stroke="${t.line}"/>
<text x="32" y="46" font-size="22" font-weight="700" fill="${t.ink}">The team</text>
<text x="140" y="46" font-size="15" fill="${t.muted}">every agent has its own shape, so you can tell them apart without color</text>
${cells}
<line x1="32" y1="392" x2="928" y2="392" stroke="${t.line}"/>
<text x="32" y="418" font-size="13" font-weight="600" fill="${t.muted}">ON CALL · only when a project needs them</text>
${opts}`);
};

const flow = (mode) => {
  const t = THEMES[mode], y = 120, dur = 10;
  const nodes = [
    ["Intake", "manager", 70], ["Requirements", "product-manager", 190], ["Plan", "architect", 310],
    ["Design", "ux-designer", 460], ["Build", "frontend-dev", 580], ["Verify", "tester", 700], ["Your OK", "manager", 820], ["Ship", "tech-writer", 940],
  ];
  const start = 70, end = 940;
  const body = nodes.map(([label, k, x]) => {
    const f = ((x - start) / (end - start)).toFixed(3), f2 = Math.min(0.999, +f + 0.08).toFixed(3);
    return `<circle cx="${x}" cy="${y}" r="30" fill="none" stroke="${AGENTS[k][mode]}" stroke-width="2"><animate attributeName="r" dur="${dur}s" repeatCount="indefinite" keyTimes="0;${f};${f2};1" values="30;30;46;46"/><animate attributeName="opacity" dur="${dur}s" repeatCount="indefinite" keyTimes="0;${f};${f2};1" values="0;0.8;0;0"/></circle>
<circle cx="${x}" cy="${y}" r="30" fill="${t.panel}" stroke="${AGENTS[k][mode]}" stroke-width="2.5"/>
${glyph(k, x - 15, y - 15, 30, mode)}
<text x="${x}" y="${y + 56}" font-size="14" font-weight="600" text-anchor="middle" fill="${t.ink}">${label}</text>`;
  }).join("\n");
  return svg(1010, 300, "How Knit works: intake, requirements, plan, then design, build, verify and your OK for each chunk, then ship", `<rect width="1010" height="300" rx="18" fill="${t.bg}" stroke="${t.line}"/>
<rect x="410" y="52" width="460" height="188" rx="16" fill="none" stroke="${t.line}" stroke-width="1.5" stroke-dasharray="6 6"/>
<text x="426" y="76" font-size="13" font-weight="600" fill="${t.muted}">EACH CHUNK · repeat until done</text>
<line x1="${start}" y1="${y}" x2="${end}" y2="${y}" stroke="${t.line}" stroke-width="2"/>
<path id="loop" d="M820 152 C820 250 460 250 460 152" fill="none" stroke="${t.line}" stroke-width="2" stroke-dasharray="5 6"/>
<circle r="5" fill="${t.accent}"><animateMotion dur="3s" repeatCount="indefinite" path="M820 152 C820 250 460 250 460 152"/></circle>
${body}
<circle r="7" fill="${t.accent}"><animateMotion dur="${dur}s" repeatCount="indefinite" path="M${start} ${y} H${end}"/></circle>
<text x="505" y="284" font-size="13" text-anchor="middle" fill="${t.muted}">You approve the plan, every chunk and the release. Everything else, the team handles.</text>`);
};

for (const mode of ["light", "dark"]) {
  writeFileSync(new URL(`logo-${mode}.svg`, out), logo(mode));
  writeFileSync(new URL(`team-${mode}.svg`, out), team(mode));
  writeFileSync(new URL(`flow-${mode}.svg`, out), flow(mode));
}
console.log("Wrote logo, team and flow (light and dark) to assets/.");
