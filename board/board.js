// Knit Board client: turns the .knit/events.jsonl stream into the loom view. Every agent is a thread
// across the stations; knots are its steps. All event text is set with textContent, never as HTML,
// because the log is written by agents.
import { AGENTS } from "/palette.mjs";

const STATIONS = [
  { name: "Intake", agents: ["manager"] },
  { name: "Requirements", agents: ["product-manager", "ux-researcher"] },
  { name: "Plan", agents: ["architect", "lean-coder", "security-reviewer"] },
  { name: "Design", agents: ["ux-designer", "database-architect"] },
  { name: "Build", agents: ["frontend-dev", "backend-dev", "devops", "mobile-developer", "ai-engineer", "payment-integration", "seo-content-writer"] },
  { name: "Verify", agents: ["tester", "debugger", "code-reviewer", "lean-coder", "security-reviewer", "accessibility-tester", "performance-engineer"] },
  { name: "Your OK", agents: ["manager"] },
  { name: "Ship", agents: ["tech-writer", "devops"] },
];
const GATE = 6;
const PHASE = { intake: 0, requirements: 1, plan: 2, design: 3, build: 4, verify: 5, ship: 7 };
const DONE = { done: "done", approved: "done", passed: "done", stopped: "stopped" };
const NS = "http://www.w3.org/2000/svg";
const LEFT = 150, LANE = 46;
const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const svg = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
const short = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));
const nameOf = (a) => AGENTS[a]?.name ?? (a === "user" ? "You" : a ?? "");
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const thread = (a) => (AGENTS[a] && !AGENTS[a].optional ? a : "oncall");
const dye = (a) => (a === "user" ? css("--ink") : css(`--dye-${thread(a)}`) || css("--stitch"));
const ink = (a) => (a === "user" ? css("--ink") : css(`--t-${thread(a)}`) || css("--ink"));
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

let dark;
try { dark = localStorage.getItem("knit-theme") === "dark" || (!localStorage.getItem("knit-theme") && matchMedia("(prefers-color-scheme: dark)").matches); }
catch { dark = matchMedia("(prefers-color-scheme: dark)").matches; }

let S;
const reset = () => { S = { runs: {}, phase: -1, chunk: 0, gateOpen: false, gateDone: false, tests: null, testFailed: false, first: null, last: null, focus: -1, msg: {}, mgr: "", quality: null, alerts: [], checks: [], lastSeen: performance.now(), knots: {}, order: [] }; };
reset();

function stationFor(agent, phase) {
  const p = PHASE[phase];
  if (p != null && STATIONS[p].agents.includes(agent)) return p;
  // Otherwise the nearest station at or before where the run is (a fix during Verify goes back to Build),
  // then the next one ahead (work that hasn't been reached yet).
  const has = (i) => i !== GATE && STATIONS[i].agents.includes(agent);
  const cur = Math.max(p ?? S.phase, 0);
  for (let i = cur; i >= 0; i--) if (has(i)) return i;
  for (let i = cur + 1; i < STATIONS.length; i++) if (has(i)) return i;
  return cur;
}

function apply(e) {
  S.first ??= e.ts; if (e.ts) S.last = e.ts;
  if (e.chunk != null) S.chunk = Math.max(S.chunk, e.chunk);
  const run = (a) => (S.runs[a] ??= { state: "idle", task: "", msg: "", tokens: 0, station: stationFor(a, e.phase) });
  const note = (i, text) => { S.msg[i] = text; S.focus = i; };
  switch (e.type) {
    case "phase":
      if (PHASE[e.phase] != null) { S.phase = PHASE[e.phase]; note(S.phase, e.msg); }
      if (e.phase === "design") { S.gateOpen = false; S.gateDone = false; }
      break;
    case "agent_start": {
      const r = run(e.agent);
      r.station = stationFor(e.agent, e.phase);
      Object.assign(r, { state: "working", task: e.task ? `Task ${e.task}` : "", msg: e.msg });
      if (r.station !== GATE) S.phase = Math.max(S.phase, r.station);
      note(r.station, `${nameOf(e.agent)}: ${e.msg}`);
      break;
    }
    case "agent_end": {
      const r = run(e.agent);
      r.state = DONE[e.result] ?? (e.result ? "issues" : "done");
      r.tokens += e.tokens ?? 0;
      if (e.msg) r.msg = e.msg;
      note(r.station, `${nameOf(e.agent)}: ${e.msg ?? r.state}`);
      break;
    }
    case "gate":
      // A gate the user logs is their answer (docs/EVENTS.md), even when it carries no result.
      if (S.phase >= 3) {
        const answered = e.agent === "user" || !!e.result;
        S.gateOpen = !answered;
        S.gateDone = e.result ? e.result === "approved" : e.agent === "user";
        note(GATE, e.msg);
      }
      break;
    case "test":
      if (e.counts) S.tests = e.counts;
      S.testFailed = (e.counts?.failed ?? 0) > 0;
      S.checks.push({ name: e.msg ?? "Tests", status: e.counts?.failed ? "fail" : "pass" });
      break;
    case "quality": S.quality = Array.isArray(e.items) ? e.items : null; break;
    case "watch": if (e.status === "ok") S.alerts = []; else if (e.status) S.alerts.push(e.msg ?? "Something needs a look"); break;
  }
  if (e.agent === "manager" || e.type === "decision") S.mgr = e.msg;
  // Work logged in a later phase means the run is there now (a run can reach Ship without a phase event).
  if (e.type !== "phase" && PHASE[e.phase] > S.phase) S.phase = PHASE[e.phase];
  // Once the app has shipped, agents that never logged an end are finished too.
  if (S.gateDone && S.phase === 7) for (const r of Object.values(S.runs)) if (r.state === "working") r.state = "done";

  // A knot on the agent's thread for every step it logs. Approvals sit on your thread at "Your OK".
  const who = e.agent ?? (e.type === "commit" ? "manager" : null);
  if (who) {
    const s = who === "user" || e.type === "gate" ? GATE : S.runs[who]?.station ?? stationFor(who, e.phase);
    if (!S.order.includes(who)) S.order.push(who);
    (S.knots[who] ??= []).push({ s, bad: e.type === "test" && (e.counts?.failed ?? 0) > 0 });
  }
  if (e.type === "gate" && !S.order.includes("user")) S.order.push("user");
}

// Where a thread's lane ends and how it looks there: idle, running, waiting, failed or done.
function laneState(a) {
  if (a === "user") return S.gateOpen ? "waiting" : S.knots.user?.length ? "done" : "idle";
  const r = S.runs[a];
  if (r?.state === "working") return "running";
  if (r?.state === "issues" || (a === "tester" && S.testFailed)) return "failed";
  if (r?.state === "stopped") return "idle";
  if (a === "manager") return S.gateDone && S.phase === 7 ? "done" : "active";
  return S.knots[a]?.length ? "done" : "idle";
}

function stationState(i) {
  const ran = STATIONS[i].agents.filter((a) => S.runs[a]?.station === i);
  if (i === GATE) return { ran, state: S.gateOpen ? "waiting" : S.gateDone || S.phase === 7 ? "done" : "next" };
  const states = ran.map((a) => S.runs[a].state);
  if (states.includes("working")) return { ran, state: "working" };
  if (states.includes("issues") && i === S.phase) return { ran, state: "issues" };
  if (i < S.phase || (i === S.phase && ran.length)) return { ran, state: "done" };
  return { ran, state: "next" };
}
const LABEL = { working: "Working", done: "Done", issues: "Found issues", waiting: "Waiting for you", next: "" };

// ---- the loom -----------------------------------------------------------------------------
let W = 1000, colW = (W - LEFT) / 8;
const cx = (s) => LEFT + colW * (s + 0.5);
const knotX = (s, n) => cx(s) + Math.max(-1, Math.min(1, (n - 1) * 0.45 - 0.45)) * colW * 0.3;
const wave = (x, y) => { let d = `M${LEFT - 12} ${y}`; for (let i = LEFT - 12; i < x - 9; i += 18) d += ` q4.5 -3.6 9 0 t9 0`; return d; };
const lanes = {};
let box = null, bands = null;

function build() {
  W = Math.max(880, $("weave").clientWidth);
  colW = (W - LEFT) / 8;
  const cols = $("cols");
  cols.replaceChildren(el("span"), ...STATIONS.map((st, i) => { const h = el("div", "col-h"); h.dataset.i = i; h.append(st.name, el("b")); return h; }));
  const chunk = el("div", "chunk"); chunk.style.left = `${LEFT + colW * 3}px`; chunk.style.width = `${colW * 4}px`; chunk.append(el("span", "", "EACH CHUNK"));
  cols.append(chunk);
  box = svg("svg", { role: "img", "aria-label": "Agent threads across the stations" });
  bands = svg("g");
  box.append(bands);
  for (const k of Object.keys(lanes)) delete lanes[k];
  $("lanes").replaceChildren($("lanes-empty") ?? el("p", "empty"), box);
}

function lane(a) {
  if (lanes[a]) return lanes[a];
  const r = Object.keys(lanes).length, y = 22 + r * LANE;
  const g = svg("g");
  const name = svg("text", { x: 0, y: y + 5, class: "lane-name" }); name.textContent = nameOf(a);
  const idle = svg("path", { d: `M${LEFT - 12} ${y}H${W}`, class: "lane-idle" });
  const line = svg("path", { class: "lane-thread", d: "" });
  const knots = svg("g"), end = svg("g");
  g.append(name, idle, line, knots, end);
  box.append(g);
  return (lanes[a] = { a, y, name, line, knots, end, x: LEFT - 12, shown: LEFT - 12, drawn: 0, state: "" });
}

function grow(L) {
  const from = L.shown, to = L.x;
  if (reduced || from === to) { L.shown = to; L.line.setAttribute("d", wave(to, L.y)); return; }
  const t0 = performance.now(), dur = 700, ease = (t) => 1 - Math.pow(1 - t, 4);
  cancelAnimationFrame(L.raf);
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    L.shown = from + (to - from) * ease(k);
    L.line.setAttribute("d", wave(L.shown, L.y));
    if (k < 1) L.raf = requestAnimationFrame(step);
  };
  L.raf = requestAnimationFrame(step);
}

function drawEnd(L, state) {
  L.end.replaceChildren();
  const { a, x, y } = L, c = dye(a);
  if (state === "idle" || !S.knots[a]?.length) return;
  if (state === "running") {
    L.end.append(svg("circle", { cx: x, cy: y, r: 13, fill: "none", stroke: c, "stroke-width": 2, class: "pulse-ring" }),
      svg("path", { d: `M${x - 10} ${y} Q${x + 4} ${y - 7} ${x + 18} ${y} Q${x + 4} ${y + 7} ${x - 10} ${y}Z`, fill: c, stroke: css("--ink"), "stroke-width": 1.3, class: "shuttle" }));
  } else if (state === "waiting") {
    L.end.append(svg("circle", { cx: x, cy: y, r: 12, fill: "none", stroke: css("--turmeric-text"), "stroke-width": 2.4, class: "pulse-ring" }), svg("circle", { cx: x, cy: y, r: 5, fill: css("--turmeric") }));
  } else if (state === "failed") {
    L.end.append(svg("path", { d: `M${x - 9} ${y}l-7 -6M${x - 9} ${y}l-8 1M${x - 9} ${y}l-6 6`, stroke: css("--bad"), "stroke-width": 2, "stroke-linecap": "round" }),
      svg("circle", { cx: x, cy: y, r: 8.5, fill: css("--bad") }), svg("path", { d: `M${x - 3} ${y - 3}l6 6M${x + 3} ${y - 3}l-6 6`, stroke: css("--panel"), "stroke-width": 1.8, "stroke-linecap": "round" }));
  } else if (state === "active") {
    L.end.append(svg("circle", { cx: x, cy: y, r: 8, fill: css("--panel"), stroke: c, "stroke-width": 2.5 }), svg("circle", { cx: x, cy: y, r: 3.2, fill: c }));
  } else {
    L.end.append(svg("circle", { cx: x, cy: y, r: 8.5, fill: c }), svg("path", { d: `M${x - 3.6} ${y}l2.5 2.5 4.7-4.8`, stroke: css("--panel"), "stroke-width": 1.9, fill: "none", "stroke-linecap": "round" }));
  }
}

function drawLoom() {
  if (!box) build();
  $("lanes-empty").hidden = S.order.length > 0;
  const order = S.order.includes("user") ? ["user", ...S.order.filter((a) => a !== "user")] : S.order;
  // Lanes keep their row once created; "You" is added first when an approval arrives first.
  for (const a of order) {
    const L = lane(a), ks = S.knots[a] ?? [];
    L.counts ??= {};
    for (let i = L.drawn; i < ks.length; i++) {          // only knots that are new since the last draw
      const k = ks[i], n = (L.counts[k.s] = (L.counts[k.s] ?? 0) + 1);
      const x = knotX(k.s, n);
      L.knots.append(svg("circle", { cx: x, cy: L.y, r: 4.6, fill: k.bad ? css("--bad") : dye(a), class: reduced ? "" : "knot" }));
      L.x = Math.max(L.x, x);
    }
    L.drawn = ks.length;
    L.name.setAttribute("fill", ink(a));
    L.line.setAttribute("stroke", dye(a));
    grow(L);
    const st = laneState(a);
    drawEnd(L, st);
    L.state = st;
  }
  const H = Math.max(1, Object.keys(lanes).length) * LANE + 8;
  box.setAttribute("viewBox", `0 0 ${W} ${H}`);
  box.setAttribute("height", H);
  // Station headers and a faint band behind the working (or waiting) station.
  bands.replaceChildren();
  for (const h of document.querySelectorAll(".col-h")) {
    const i = +h.dataset.i, { state } = stationState(i);
    h.className = `col-h ${state}`;
    h.querySelector("b").textContent = LABEL[state];
    if (state === "working" || state === "waiting") bands.append(svg("rect", { x: LEFT + colW * i + 4, y: 0, width: colW - 8, height: H, rx: 10, class: `col-band ${state}` }));
  }
  document.querySelector(".chunk span").textContent = S.chunk ? `CHUNK ${S.chunk} · REPEAT UNTIL DONE` : "EACH CHUNK";
}

// A handoff: the file tag travels from one thread to the other.
function slide(e) {
  const A = lanes[e.agent], B = lanes[e.to];
  if (!A || !B || reduced) return;
  const chip = el("div", "packet"), c = dye(e.agent);
  chip.style.borderColor = c;
  chip.append(e.file ?? "handoff");
  $("lanes").append(chip);
  chip.animate([{ left: `${A.x}px`, top: `${A.y}px` }, { left: `${Math.max(B.x, A.x - 40)}px`, top: `${B.y}px` }], { duration: 1400, easing: "cubic-bezier(.65,0,.35,1)", fill: "forwards" })
    .finished.then(() => setTimeout(() => chip.remove(), 900), () => chip.remove());
}

// ---- side panels ------------------------------------------------------------------------------
function drawNow() {
  const i = S.focus >= 0 ? S.focus : Math.max(S.phase, 0);
  const working = Object.entries(S.runs).filter(([, r]) => r.state === "working").map(([a]) => a);
  const here = STATIONS[i].agents.filter((a) => S.runs[a]?.station === i);
  const show = working.length ? working : here;
  $("now-title").textContent = S.gateOpen ? "Waiting for your OK" : S.phase < 0 ? "Waiting for events" : `${STATIONS[working.length ? S.runs[working[0]].station : i].name}`;
  $("now-msg").textContent = S.mgr;
  $("now-agents").replaceChildren(...show.map((a) => {
    const r = S.runs[a], li = el("li"), sw = el("i"), info = el("div"), st = el("span", "st", r.state === "working" ? "Running" : r.state === "issues" ? "Found issues" : r.state === "idle" ? "" : "Done");
    sw.style.background = dye(a);
    st.style.color = r.state === "issues" ? css("--bad") : r.state === "working" ? ink(a) : css("--muted");
    const who = el("b", "", nameOf(a)); who.style.color = ink(a);
    info.append(who, el("div", "what", [r.task, r.msg].filter(Boolean).join(" · ")));
    li.append(sw, info, st);
    return li;
  }));
  const totals = Object.entries(S.runs).filter(([, r]) => r.tokens).sort((x, y) => y[1].tokens - x[1].tokens);
  const max = totals[0]?.[1].tokens || 1;
  $("token-bars").replaceChildren(...(totals.length ? [el("span", "label", "Tokens by agent"), ...totals.map(([a, r]) => {
    const s = el("span"), b = el("span", "bar-i"); b.style.width = `${Math.max(6, Math.round((r.tokens / max) * 60))}px`; b.style.background = dye(a);
    s.append(b, `${nameOf(a)} `, el("span", "mono muted", short(r.tokens))); return s;
  })] : []));
}

function drawHeader() {
  const runs = Object.values(S.runs), busy = runs.filter((r) => r.state === "working").length;
  const total = runs.reduce((n, r) => n + r.tokens, 0);
  const ms = S.first && S.last ? Date.parse(S.last) - Date.parse(S.first) : 0, m = Math.max(0, Math.round(ms / 6e4));
  $("elapsed").textContent = m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m` : `${m}m`;
  $("tokens").textContent = short(total);
  $("busy").textContent = String(busy);
  $("tests").textContent = S.tests ? `${S.tests.passed ?? 0}/${(S.tests.passed ?? 0) + (S.tests.failed ?? 0)}` : "-";
  $("mode").textContent = S.chunk ? `In chunks · chunk ${S.chunk}` : "";
  const shipped = S.gateDone && S.phase === 7;
  $("status").textContent = S.gateOpen ? "Waiting for your OK" : busy ? `${STATIONS[Math.max(S.phase, 0)].name} · ${busy} running` : shipped ? "Done" : S.phase >= 0 ? STATIONS[S.phase].name : "Waiting for events";
  $("status-dot").className = `dot ${S.gateOpen ? "waiting" : busy ? "run" : S.testFailed ? "fail" : shipped ? "done" : ""}`;
}

// Watchguard: watches for silence and shows what has been verified.
const SILENT_MS = 5 * 60 * 1000;
function drawGuard() {
  const now = performance.now(), quiet = now - S.lastSeen;
  const running = Object.entries(S.runs).filter(([, r]) => r.state === "working").map(([a]) => nameOf(a));
  const silent = running.length > 0 && quiet > SILENT_MS;
  const done = S.quality && S.quality.every((q) => q.status !== "fail");
  const failed = S.quality?.some((q) => q.status === "fail");
  const state = silent || failed || S.alerts.length ? "alert" : done ? "done" : "watch";
  $("guard-panel").className = `panel guard-panel ${state}`;
  $("guard-state").textContent = { alert: silent ? `Silent for ${Math.round(quiet / 60000)} min` : failed ? "A check failed" : "Needs a look", done: "Verified", watch: running.length ? "Watching the work" : "Watching" }[state];
  $("guard-last").textContent = S.first ? (quiet < 60000 ? `${Math.max(1, Math.round(quiet / 1000))}s ago` : `${Math.round(quiet / 60000)} min ago`) : "-";
  $("guard-running").textContent = running.length ? running.join(", ") : "nothing";
  const items = S.quality ?? S.checks.slice(-6);
  $("guard-checks").replaceChildren(...(items.length ? items.map((q) => {
    const li = el("li", q.status), mark = el("span", "mark", q.status === "pass" ? "✓" : q.status === "fail" ? "✗" : "–");
    li.append(mark, el("span", "", q.name), q.detail ? el("span", "detail", q.detail) : "");
    return li;
  }) : [el("li", "muted", "Appear as the team verifies its work.")]));
  const alerts = [...S.alerts.slice(-3)];
  if (silent) alerts.push(`No activity for ${Math.round(quiet / 60000)} min while ${running.join(", ")} ${running.length > 1 ? "are" : "is"} working.`);
  $("guard-alerts").replaceChildren(...(alerts.length ? alerts.map((a) => el("li", "", a)) : [el("li", "muted", "None. Everything is moving.")]));
}
setInterval(() => drawGuard(), 5000);

let queued = false;
const render = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; drawHeader(); drawLoom(); drawNow(); drawGuard(); }); };

function feed(e, fresh) {
  const who = e.agent ?? (e.type === "commit" ? "manager" : "");
  const li = el("li", fresh ? "new" : ""), dot = el("i"), text = el("div");
  dot.style.background = who ? dye(who) : css("--stitch");
  const b = el("b", "", nameOf(who) || e.type); b.style.color = who ? ink(who) : "";
  text.append(b, ` ${e.msg ?? ""}`, el("time", "", e.ts ? e.ts.slice(11, 19) : ""));
  li.append(dot, text);
  if (fresh) setTimeout(() => li.classList.remove("new"), 2500);
  const list = $("feed"); list.prepend(li);
  while (list.children.length > 60) list.lastChild.remove();
}

// ---- wiring --------------------------------------------------------------------------------
// A theme or size change redraws the loom from the state, without animation.
const redraw = () => { box = null; for (const k of Object.keys(lanes)) delete lanes[k]; render(); };
const applyTheme = () => { document.documentElement.dataset.theme = dark ? "dark" : "light"; $("theme").setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode"); redraw(); };
$("theme").addEventListener("click", () => { dark = !dark; try { localStorage.setItem("knit-theme", dark ? "dark" : "light"); } catch {} applyTheme(); });
applyTheme();
let rz = 0;
addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { if (Math.abs(Math.max(880, $("weave").clientWidth) - W) > 4) redraw(); }, 150); });

let lastArrival = 0;
const source = new EventSource("/stream");
source.addEventListener("meta", (m) => {
  const d = JSON.parse(m.data);
  $("project").textContent = `${d.project}${d.replay ? " · replay" : ""}`;
  $("version").textContent = `Knit v${d.version}`;
  document.title = `Knit v${d.version} · ${d.project}`;
  if (d.latest) { $("update").hidden = false; $("update").textContent = `Update: v${d.latest}`; $("update").title = `Knit ${d.latest} is available. In the knit folder: git pull, then node scripts/install.mjs claude --global`; }
});
source.addEventListener("reset", () => { reset(); $("feed").replaceChildren(); redraw(); });
source.addEventListener("event", (m) => {
  const e = JSON.parse(m.data), now = performance.now(), fresh = now - lastArrival > 120;
  lastArrival = now;
  S.lastSeen = now;
  apply(e);
  feed(e, fresh);
  render();
  if (fresh && e.type === "handoff") requestAnimationFrame(() => requestAnimationFrame(() => slide(e)));
});
source.onerror = () => { $("status").textContent = "Disconnected · retrying"; $("status-dot").className = "dot off"; };
