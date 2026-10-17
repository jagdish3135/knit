#!/usr/bin/env node
// Knit Board: a live view of a Knit run. Streams <project>/.knit/events.jsonl to the browser.
// Usage: node board/server.mjs <project-dir> [--port 4321] [--open] [--replay] [--speed 1] [--offline]
// --open opens the board in the default browser. --replay plays a finished log from the start, one step at a
// time, then keeps following the file. --offline skips the check for a newer Knit version.
import { createReadStream, existsSync, readFileSync, statSync, unwatchFile, watchFile } from "node:fs";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args.splice(i, 2)[1]; };
let port = Number(opt("--port", 4321));
const flag = (name) => args.includes(name) && args.splice(args.indexOf(name), 1).length > 0;
const open = flag("--open"), offline = flag("--offline");
const speed = Number(opt("--speed", 1)) || 1;
const replay = flag("--replay");
const project = resolve(args[0] ?? ".");
const log = join(project, ".knit", "events.jsonl");
if (!existsSync(join(project, ".knit"))) { console.error(`No .knit/ folder in ${project}`); process.exit(1); }

const here = dirname(fileURLToPath(import.meta.url));
const FILES = { // the only files the server will send
  "/": [join(here, "index.html"), "text/html"],
  "/board.css": [join(here, "board.css"), "text/css"],
  "/board.js": [join(here, "board.js"), "text/javascript"],
  "/palette.mjs": [join(here, "..", "scripts", "palette.mjs"), "text/javascript"],
};
const isLocalHost = (h = "") => [`127.0.0.1:${port}`, `localhost:${port}`, `[::1]:${port}`].includes(h);

// Knit's version, and the newest one on GitHub (one small request; skipped with --offline).
const version = readFileSync(join(here, "..", "VERSION"), "utf8").trim();
const newer = (a, b) => { const x = a.split(".").map(Number), y = b.split(".").map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };
let latest = null;
if (!offline) fetch("https://raw.githubusercontent.com/jagdish3135/knit/main/VERSION", { signal: AbortSignal.timeout(4000) })
  .then((r) => (r.ok ? r.text() : null)).then((v) => {
    if (v && /^\d+\.\d+\.\d+$/.test(v.trim()) && newer(v.trim(), version)) {
      latest = v.trim();
      console.log(`Knit ${latest} is available (you have ${version}). Update: git pull in the knit folder, then node scripts/install.mjs claude --global`);
      broadcast("meta", meta());
    }
  }).catch(() => {});
const meta = () => ({ project: basename(project), replay, version, latest });
const HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'" };

// Read complete lines from the log, remembering where we stopped; a shorter file means it was reset.
let offset = 0, rest = "", events = [];
const clients = new Set();
const send = (res, type, data) => res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
const broadcast = (type, data) => { for (const c of clients) if (!c.replaying) send(c.res, type, data); };
function readNew() {
  if (!existsSync(log)) return;
  const size = statSync(log).size;
  if (size < offset) { offset = 0; rest = ""; events = []; broadcast("reset", {}); }
  if (size === offset) return;
  const chunk = readFileSync(log).subarray(offset, size).toString("utf8");
  offset = size;
  const lines = (rest + chunk).split(/\r?\n/);
  rest = lines.pop();
  for (const line of lines.filter((l) => l.trim())) {
    try { const e = JSON.parse(line); events.push(e); broadcast("event", e); } catch { console.warn("Skipped a line that isn't JSON"); }
  }
}
readNew();
watchFile(log, { interval: 400 }, readNew);

const server = createServer((req, res) => {
  if (!isLocalHost(req.headers.host)) { res.writeHead(403).end("Forbidden"); return; } // blocks DNS rebinding
  const path = new URL(req.url, "http://x").pathname;
  if (path === "/stream") {
    res.writeHead(200, { ...HEADERS, "Content-Type": "text/event-stream", Connection: "keep-alive" });
    send(res, "meta", meta());
    const client = { res, replaying: replay };
    clients.add(client);
    if (!replay) events.forEach((e) => send(res, "event", e));
    else {
      let i = 0;
      const step = () => {
        if (!clients.has(client)) return;
        if (i < events.length) { send(res, "event", events[i++]); setTimeout(step, 900 / speed); }
        else client.replaying = false;
      };
      step();
    }
    const ping = setInterval(() => res.write(": ping\n\n"), 15000);
    req.on("close", () => { clearInterval(ping); clients.delete(client); });
    return;
  }
  const file = FILES[path];
  if (!file || req.method !== "GET") { res.writeHead(404, HEADERS).end("Not found"); return; }
  res.writeHead(200, { ...HEADERS, "Content-Type": `${file[1]}; charset=utf-8` });
  createReadStream(file[0]).pipe(res);
});
// If the port is taken (say, a board for another project), use the next free one.
server.on("error", (err) => {
  if (err.code === "EADDRINUSE" && port < 4340) { port += 1; server.listen(port, "127.0.0.1"); }
  else { console.error(err.message); process.exit(1); }
});
server.on("listening", () => {
  const url = `http://127.0.0.1:${port}`;
  console.log(`Knit v${version} · board for ${basename(project)}: ${url}${replay ? "  (replay)" : ""}`);
  if (!open) return;
  const [cmd, cmdArgs] = process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : [process.platform === "darwin" ? "open" : "xdg-open", [url]];
  spawn(cmd, cmdArgs, { detached: true, stdio: "ignore" }).on("error", () => console.log(`Open ${url} in your browser.`)).unref();
});
server.listen(port, "127.0.0.1");
process.on("SIGINT", () => { unwatchFile(log); server.close(); process.exit(0); });
