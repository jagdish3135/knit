// Knit Board client: turns the .knit/events.jsonl stream into the flow view. All event text is set
// with textContent, never as HTML, because the log is written by agents.
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
const SVG = "http://www.w3.org/2000/svg";
const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const svg = (tag, attrs, kids = []) => { const e = document.createElementNS(SVG, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); e.append(...kids); return e; };
const short = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));
const nameOf = (a) => AGENTS[a]?.name ?? (a === "user" ? "You" : a ?? "");

let dark;
try { dark = localStorage.getItem("knit-theme") === "dark" || (!localStorage.getItem("knit-theme") && matchMedia("(prefers-color-scheme: dark)").matches); }
catch { dark = matchMedia("(prefers-color-scheme: dark)").matches; }
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const color = (a) => (AGENTS[a] ? AGENTS[a][dark ? "dark" : "light"] : css("--muted"));

let S;
const reset = () => { S = { runs: {}, phase: -1, chunk: 0, gateOpen: false, gateDone: false, tests: null, first: null, last: null, focus: -1, msg: {}, mgr: "", quality: null, alerts: [], checks: [], lastSeen: performance.now() }; };
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
      if (S.phase >= 3) { S.gateOpen = !e.result; S.gateDone = e.result === "approved"; note(GATE, e.msg); }
      break;
    case "test":
      if (e.counts) S.tests = e.counts;
      S.checks.push({ name: e.msg ?? "Tests", status: e.counts?.failed ? "fail" : "pass" });
      break;
    case "quality": S.quality = Array.isArray(e.items) ? e.items : null; break;
    case "watch": if (e.status === "ok") S.alerts = []; else if (e.status) S.alerts.push(e.msg ?? "Something needs a look"); break;
  }
  if (e.agent === "manager" || e.type === "decision") S.mgr = e.msg;
}

// ---- drawing -------------------------------------------------------------------------------
const ringStyle = (state, c) => ({
  working: { stroke: c, dash: "34 82", cls: "spin" },
  done: { stroke: c, dash: "none", cls: "" },
  issues: { stroke: css("--warn"), dash: "6 4", cls: "" },
  waiting: { stroke: css("--accent"), dash: "none", cls: "blink" },
  stopped: { stroke: css("--faint"), dash: "6 4", cls: "" },
}[state] ?? { stroke: css("--faint"), dash: "2 5", cls: "" });

function face(agent, state, big) {
  const c = color(agent), r = ringStyle(state, c), size = big ? 48 : 36, g = big ? 24 : 18;
  const a = AGENTS[agent] ?? { d1: "M12 3a9 9 0 1 0 0.01 0z", d2: "" };
  const wrap = el("div", `face${big ? " big" : ""}`);
  wrap.append(
    svg("svg", { class: `ring ${r.cls}`, width: size, height: size, viewBox: "0 0 42 42", "aria-hidden": "true" },
      [svg("circle", { cx: 21, cy: 21, r: 18.5, fill: "none", stroke: r.stroke, "stroke-width": 2.3, "stroke-dasharray": r.dash })]),
    svg("svg", { class: state === "waiting" ? "blink" : "", width: g, height: g, viewBox: "0 0 24 24", "aria-hidden": "true", style: `left:${(size - g) / 2}px;top:${(size - g) / 2}px` },
      [a.d1, a.d2].filter(Boolean).map((d) => svg("path", { d, fill: "none", stroke: c, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }))),
  );
  return wrap;
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

const LABEL = { working: "Working", done: "Done", issues: "Found issues", waiting: "Waiting for you", next: "Next" };
function drawStations() {
  const box = $("stations");
  box.replaceChildren(...STATIONS.map((st, i) => {
    const { ran, state } = stationState(i);
    const shown = ran.length ? ran : st.agents.slice(0, i === 4 || i === 5 ? 3 : 1);
    const lead = shown[0], c = color(lead);
    const col = el("div", "station");
    const node = el("span", "node"), stem = el("span", "stem");
    const mark = state === "done" ? css("--ink") : state === "next" ? css("--faint") : state === "issues" || state === "waiting" ? css("--warn") : c;
    node.style.borderColor = mark; if (state !== "next") node.style.background = mark; stem.style.background = mark;
    const card = el("div", `card ${state === "working" || state === "waiting" ? "live" : state}`);
    if (state === "working") { card.style.borderColor = c; card.style.setProperty("--glow", `${c}40`); }
    if (state === "waiting") { card.style.borderColor = css("--accent"); card.style.setProperty("--glow", `${css("--accent")}40`); }
    const faces = el("div", "faces");
    faces.append(...shown.slice(0, 5).map((a) => face(a, state === "next" ? "idle" : i === GATE ? (state === "waiting" ? "waiting" : "done") : S.runs[a]?.state ?? "idle")));
    const top = el("div", "card-top"); top.append(faces);
    if (state === "done") { const ck = el("span", "check"); ck.append(svg("svg", { width: 10, height: 10, viewBox: "0 0 10 10", "aria-hidden": "true" }, [svg("path", { d: "M2 5.2l2 2 4-4.4" })])); top.append(ck); }
    const label = el("div", "state", LABEL[state]);
    if (state !== "done" && state !== "next") label.style.color = state === "working" ? c : css("--warn");
    const bar = el("div", "bar"), fill = el("span", state === "working" ? "work" : "");
    fill.style.width = { done: "100%", waiting: "100%", working: "60%", issues: "100%", next: "0%" }[state];
    fill.style.background = state === "issues" ? css("--warn") : c; bar.append(fill);
    const tokens = ran.reduce((n, a) => n + S.runs[a].tokens, 0);
    const foot = el("div", "foot"); foot.append(el("span", "", ran.length ? `${ran.length} agent${ran.length > 1 ? "s" : ""}` : ""), el("span", "", tokens ? short(tokens) : ""));
    card.append(top, (() => { const d = el("div"); d.append(el("div", "name", st.name), label); return d; })(),
      el("div", "activity", S.msg[i] ?? (state === "next" ? "Up next" : "")), bar, foot);
    col.append(node, stem, card);
    return col;
  }));
  $("chunk-label").textContent = S.chunk ? `CHUNK ${S.chunk} · REPEAT UNTIL DONE` : "EACH CHUNK · DESIGN, BUILD, VERIFY, YOUR OK";
  document.querySelector(".loop").classList.toggle("open", S.gateOpen);
}

function drawNow() {
  const i = S.focus >= 0 ? S.focus : Math.max(S.phase, 0);
  const ran = STATIONS[i].agents.filter((a) => S.runs[a]?.station === i);
  $("now-title").textContent = `Now · ${STATIONS[i].name}`;
  $("now-msg").textContent = S.mgr;
  $("now-agents").replaceChildren(...(ran.length ? ran.map((a) => {
    const r = S.runs[a], card = el("div", "agent"), head = el("div", "agent-head"), info = el("div");
    const st = el("div", "state", LABEL[r.state === "idle" ? "next" : r.state] ?? r.state);
    if (r.state === "working") { st.style.color = color(a); card.style.borderColor = color(a); }
    if (r.state === "issues") st.style.color = css("--warn");
    info.append(el("div", "who", nameOf(a)), st);
    head.append(face(a, r.state, true), info);
    card.append(head, el("div", "what", [r.task, r.msg].filter(Boolean).join(" · ")), el("div", "foot mono", r.tokens ? `${short(r.tokens)} tokens` : ""));
    return card;
  }) : [el("p", "empty", i !== GATE ? "No agent has worked here yet." : S.gateOpen ? "The team is waiting for your decision." : S.gateDone ? "Approved. The team moved on." : "No decision needed yet.")]));
  const totals = Object.entries(S.runs).filter(([, r]) => r.tokens).sort((a, b) => b[1].tokens - a[1].tokens);
  const max = totals[0]?.[1].tokens || 1;
  $("token-bars").replaceChildren(el("span", "muted", "Tokens by agent"), ...totals.map(([a, r]) => {
    const s = el("span"), b = el("span", "bar-i"); b.style.width = `${Math.max(6, Math.round((r.tokens / max) * 60))}px`; b.style.background = color(a);
    s.append(b, `${nameOf(a)} `, el("span", "mono muted", short(r.tokens))); return s;
  }));
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
  $("status").textContent = S.gateOpen ? "Waiting for you" : busy ? `${STATIONS[Math.max(S.phase, 0)].name} · ${busy} working` : S.gateDone && S.phase === 7 ? "Done" : S.phase >= 0 ? STATIONS[S.phase].name : "Waiting for events";
  $("status-dot").className = `dot ${S.gateOpen ? "waiting pulse" : busy ? "pulse" : ""}`;
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
const render = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; drawHeader(); drawStations(); drawNow(); drawGuard(); }); };

function slide(e) {
  const cards = $("stations").children, rail = $("rail").getBoundingClientRect();
  const from = S.runs[e.agent]?.station ?? stationFor(e.agent), to = S.runs[e.to]?.station ?? stationFor(e.to);
  if (!cards[from] || !cards[to]) return;
  const x = (i) => { const r = cards[i].getBoundingClientRect(); return `${r.left + r.width / 2 - rail.left}px`; };
  const chip = el("div", "packet"), c = color(e.agent);
  chip.style.borderColor = c;
  chip.append(svg("svg", { width: 12, height: 12, viewBox: "0 0 24 24", "aria-hidden": "true" }, [svg("path", { d: "M6 3h9l4 4v14H6z", fill: "none", stroke: c, "stroke-width": 2.2, "stroke-linejoin": "round" })]), e.file ?? "handoff");
  $("rail").append(chip);
  const anim = chip.animate([{ left: x(from) }, { left: x(to) }], { duration: 1500, easing: "cubic-bezier(.55,0,.2,1)", fill: "forwards" });
  anim.finished.then(() => setTimeout(() => chip.remove(), 900), () => chip.remove());
}

function feed(e, fresh) {
  const li = el("li", fresh ? "new" : ""), who = e.agent ?? (e.type === "commit" ? "manager" : "");
  const text = el("div", "msg"); text.append(el("b", "", nameOf(who) || e.type), ` ${e.msg ?? ""}`, el("time", "", e.ts ? e.ts.slice(11, 19) : ""));
  li.append(face(who, "done"), text);
  li.firstChild.style.transform = "scale(.6)"; li.firstChild.style.margin = "-6px";
  if (fresh) setTimeout(() => li.classList.remove("new"), 2500);
  const list = $("feed"); list.prepend(li);
  while (list.children.length > 60) list.lastChild.remove();
}

// ---- wiring --------------------------------------------------------------------------------
const applyTheme = () => { document.documentElement.dataset.theme = dark ? "dark" : "light"; $("theme").textContent = dark ? "Light mode" : "Dark mode"; render(); };
$("theme").addEventListener("click", () => { dark = !dark; try { localStorage.setItem("knit-theme", dark ? "dark" : "light"); } catch {} applyTheme(); });
applyTheme();

let lastArrival = 0;
const source = new EventSource("/stream");
source.addEventListener("meta", (m) => {
  const d = JSON.parse(m.data);
  $("project").textContent = `${d.project}${d.replay ? " · replay" : ""}`;
  $("version").textContent = `Knit v${d.version}`;
  document.title = `Knit v${d.version} · ${d.project}`;
  if (d.latest) { $("update").hidden = false; $("update").textContent = `Update: v${d.latest}`; $("update").title = `Knit ${d.latest} is available. In the knit folder: git pull, then node scripts/install.mjs claude --global`; }
});
source.addEventListener("reset", () => { reset(); $("feed").replaceChildren(); render(); });
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
