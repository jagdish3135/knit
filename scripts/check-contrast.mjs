#!/usr/bin/env node
// Checks every text/background pair in site/tokens.css against WCAG AA, in light and dark.
// Text needs 4.5:1; threads, stitches and focus rings are graphics and need 3:1.
// Usage: node scripts/check-contrast.mjs [--json]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../site/tokens.css"), "utf8");
const block = (sel) => {
  const i = css.indexOf(sel);
  const body = css.slice(css.indexOf("{", i) + 1, css.indexOf("}", css.indexOf("{", i)));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]));
};
const light = block(":root{");
const modes = { light, dark: { ...light, ...block(':root[data-theme="dark"]{') } };

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const grounds = ["cotton", "cotton-2", "panel"];
const threads = Object.keys(light).filter((k) => k.startsWith("t-"));
const pairs = [
  ...["ink", "muted", "madder-text", "turmeric-text", "ok", "warn", "bad", ...threads].flatMap((fg) => grounds.map((bg) => [fg, bg, 4.5])),
  ["on-ink", "ink", 4.5], ["on-turmeric", "turmeric", 4.5],
  ...["stitch", "focus", "madder"].flatMap((fg) => grounds.map((bg) => [fg, bg, 3])),
];

let fails = 0;
const rows = [];
for (const [mode, t] of Object.entries(modes)) {
  for (const [fg, bg, need] of pairs) {
    const r = ratio(t[fg], t[bg]);
    const ok = r >= need;
    if (!ok) fails++;
    rows.push({ mode, fg, bg, fgHex: t[fg], bgHex: t[bg], ratio: +r.toFixed(2), need, ok });
  }
}
if (process.argv.includes("--json")) console.log(JSON.stringify({ modes, rows }, null, 1));
else {
  for (const r of rows.filter((r) => !r.ok)) console.log(`FAIL ${r.mode.padEnd(5)} ${r.fg} ${r.fgHex} on ${r.bg} ${r.bgHex}: ${r.ratio} < ${r.need}`);
  console.log(`${rows.length - fails}/${rows.length} pairs pass WCAG AA`);
}
process.exit(fails ? 1 : 0);
