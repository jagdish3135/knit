#!/usr/bin/env node
// Serves the landing page locally the way GitHub Pages assembles it (see .github/workflows/pages.yml):
// site/ at the root, plus /VERSION and /assets/. Loopback only. Usage: node scripts/serve-site.mjs [port]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = +(process.argv[2] ?? 4380);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2", ".glb": "model/gltf-binary", ".jsonl": "application/x-ndjson", ".txt": "text/plain" };
const resolve = (url) => {
  if (url === "/VERSION") return join(repo, "VERSION");
  const [base, rel] = url.startsWith("/assets/") ? [join(repo, "assets"), url.slice(8)] : [join(repo, "site"), url.slice(1) || "index.html"];
  const file = normalize(join(base, rel));
  return file.startsWith(base + sep) || file === base ? file : null;
};
createServer(async (req, res) => {
  const file = resolve(decodeURIComponent(new URL(req.url, "http://x").pathname));
  try {
    if (!file) throw new Error("outside");
    const body = await readFile(file.endsWith(sep) ? join(file, "index.html") : file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
    res.end(body);
  } catch { res.writeHead(404, { "content-type": "text/plain" }); res.end("Not found"); }
}).listen(port, "127.0.0.1", () => console.log(`Knit site on http://127.0.0.1:${port}/`));
