#!/usr/bin/env node
// Knit Board: a live view of a Knit run. Streams <project>/.knit/events.jsonl to the browser.
// Usage: node board/server.mjs <project-dir> [--port 4321] [--replay] [--speed 1]
// --replay plays a finished log from the start, one step at a time, then keeps following the file.
import { createReadStream, existsSync, readFileSync, statSync, unwatchFile, watchFile } from "node:fs";
import { createServer } from "node:http";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args.splice(i, 2)[1]; };
const port = Number(opt("--port", 4321));
const speed = Number(opt("--speed", 1)) || 1;
const replay = args.includes("--replay") && args.splice(args.indexOf("--replay"), 1).length > 0;
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
const HOSTS = new Set([`127.0.0.1:${port}`, `localhost:${port}`, `[::1]:${port}`]);
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
  if (!HOSTS.has(req.headers.host ?? "")) { res.writeHead(403).end("Forbidden"); return; } // blocks DNS rebinding
  const path = new URL(req.url, "http://x").pathname;
  if (path === "/stream") {
    res.writeHead(200, { ...HEADERS, "Content-Type": "text/event-stream", Connection: "keep-alive" });
    send(res, "meta", { project: basename(project), replay });
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
server.listen(port, "127.0.0.1", () => console.log(`Knit Board for ${basename(project)}: http://127.0.0.1:${port}${replay ? "  (replay)" : ""}`));
process.on("SIGINT", () => { unwatchFile(log); server.close(); process.exit(0); });
