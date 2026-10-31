// "What a run looks like": replays a real .knit/events.jsonl as agent threads across the board's stations.
// Event text comes from a log that agents wrote, so it is only ever set with textContent.
import { NAMES, STATIONS, PHASE, threadOf } from "./data.js";

const NS = "http://www.w3.org/2000/svg";
const VW = 1000, LEFT = 150, LANE = 44, COL = (VW - LEFT) / STATIONS.length, GATE = 6;
const svg = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const dye = (a) => (a === "user" ? css("--ink") : css(`--dye-${threadOf(a)}`));
const text = (a) => (a === "user" ? css("--ink") : css(`--t-${threadOf(a)}`));
const cx = (s) => LEFT + COL * (s + 0.5);

function stationFor(e) {
  if (e.agent === "user" || e.type === "gate") return GATE;
  const p = PHASE[e.phase];
  if (p != null && STATIONS[p].agents.includes(e.agent)) return p;
  const has = (i) => i !== GATE && STATIONS[i].agents.includes(e.agent);
  for (let i = Math.min(p ?? 7, 7); i >= 0; i--) if (has(i)) return i;
  for (let i = 0; i < STATIONS.length; i++) if (has(i)) return i;
  return p ?? 4;
}

// A woven line from the label column to x: a soft over-and-under wave.
const wave = (x, y) => { let d = `M${LEFT - 12} ${y}`; for (let i = LEFT - 12; i < x - 9; i += 18) d += ` q4.5 -3.6 9 0 t9 0`; return d; };

export async function mountRun(root, { url, gsap, reduced }) {
  const $ = (s) => root.querySelector(s);
  const lanesBox = $(".lanes"), feed = $(".feed"), status = $("[data-run-status]"), count = $("[data-run-count]");
  const nowTitle = $(".now h3"), nowText = $(".now p"), play = $("[data-run-play]"), restart = $("[data-run-restart]");

  // Loading state: idle stitched lanes shaped like the real thing.
  const skeleton = svg("svg", { viewBox: `0 0 ${VW} ${8 * LANE + 10}`, "aria-hidden": "true" });
  for (let r = 0; r < 8; r++) skeleton.append(svg("path", { d: `M${LEFT - 12} ${22 + r * LANE}H${VW}`, stroke: css("--line"), "stroke-width": 2, "stroke-dasharray": "5 6" }));
  lanesBox.replaceChildren(skeleton);
  status.textContent = "Loading the run…";

  let events;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    events = (await res.text()).split("\n").filter(Boolean).map((l) => JSON.parse(l));
  } catch {
    const msg = el("div", "run-msg");
    msg.append(el("p", null, "Couldn't load the sample run. Check your connection and try again."));
    const again = el("button", "btn ghost sm", "Try again");
    again.type = "button";
    again.onclick = () => mountRun(root, { url, gsap, reduced });
    msg.append(again);
    lanesBox.replaceChildren(msg);
    status.textContent = "Not loaded";
    play.disabled = restart.disabled = true;
    return null;
  }
  play.disabled = restart.disabled = false;

  const order = ["user", "manager"];
  for (const e of events) if (e.agent && !order.includes(e.agent)) order.push(e.agent);
  const H = order.length * LANE + 10;
  const box = svg("svg", { viewBox: `0 0 ${VW} ${H}`, role: "img", "aria-label": `Agent threads across the ${STATIONS.length} board stations` });
  for (let s = 0; s < STATIONS.length; s++) {
    const t = svg("text", { x: cx(s), y: 10, "text-anchor": "middle", "font-family": "Geist Mono", "font-size": 10.5, "letter-spacing": ".06em", fill: css("--muted") });
    t.textContent = STATIONS[s].name.toUpperCase();
    box.append(t);
  }
  box.setAttribute("viewBox", `0 -10 ${VW} ${H + 14}`);
  const lanes = {};
  order.forEach((a, r) => {
    const y = 26 + r * LANE;
    const g = svg("g");
    const name = svg("text", { x: 0, y: y + 5, "font-family": "Geist", "font-weight": 600, "font-size": 14, fill: text(a) });
    name.textContent = NAMES[a] ?? a;
    g.append(name, svg("path", { d: `M${LEFT - 12} ${y}H${VW}`, stroke: css("--stitch"), "stroke-width": 1.5, "stroke-dasharray": "5 6", opacity: 0.6 }));
    const thread = svg("path", { fill: "none", stroke: dye(a), "stroke-width": 4, "stroke-linecap": "round", d: "" });
    const knots = svg("g"), end = svg("g");
    g.append(thread, knots, end);
    box.append(g);
    lanes[a] = { y, thread, knots, end, x: LEFT - 12, shown: LEFT - 12, state: "idle", perStation: {} };
  });
  lanesBox.replaceChildren(box);

  function drawEnd(L, a) {
    L.end.replaceChildren();
    if (L.state === "idle") return;
    const x = L.x, y = L.y, c = dye(a);
    if (L.state === "running") {
      L.end.append(svg("circle", { cx: x, cy: y, r: 13, fill: "none", stroke: c, "stroke-width": 2, class: "pulse" }));
      L.end.append(svg("path", { d: `M${x - 10} ${y} Q${x + 4} ${y - 7} ${x + 18} ${y} Q${x + 4} ${y + 7} ${x - 10} ${y}Z`, fill: c, stroke: css("--ink"), "stroke-width": 1.3 }));
    } else if (L.state === "waiting") {
      L.end.append(svg("circle", { cx: x, cy: y, r: 11, fill: "none", stroke: css("--turmeric-text"), "stroke-width": 2.2, class: "pulse" }));
      L.end.append(svg("circle", { cx: x, cy: y, r: 4.5, fill: css("--turmeric") }));
    } else if (L.state === "failed") {
      L.end.append(svg("circle", { cx: x, cy: y, r: 8, fill: css("--bad") }));
      L.end.append(svg("path", { d: `M${x - 3} ${y - 3}l6 6M${x + 3} ${y - 3}l-6 6`, stroke: css("--panel"), "stroke-width": 1.8, "stroke-linecap": "round" }));
    } else {
      L.end.append(svg("circle", { cx: x, cy: y, r: 8, fill: c }));
      L.end.append(svg("path", { d: `M${x - 3.5} ${y}l2.4 2.4 4.6-4.6`, stroke: css("--panel"), "stroke-width": 1.8, fill: "none", "stroke-linecap": "round" }));
    }
  }

  let i = 0, timer = null, playing = false;
  const running = () => Object.values(lanes).filter((L) => L.state === "running").length;

  function apply(e, animate) {
    const a = e.agent in lanes ? e.agent : "manager";
    const L = lanes[a];
    const s = stationFor(e);
    const n = (L.perStation[s] = (L.perStation[s] ?? 0) + 1);
    const kx = cx(s) + Math.max(-1, Math.min(1, (n - 1) * 0.45 - 0.45)) * COL * 0.3;
    L.knots.append(svg("circle", { cx: kx, cy: L.y, r: 4.5, fill: dye(a) }));
    L.x = Math.max(L.x, kx);
    if (e.type === "agent_start") L.state = "running";
    else if (e.type === "test") L.state = (e.counts?.failed ?? 0) > 0 ? "failed" : "done";
    else if (L.state !== "running") L.state = "done";
    if (e.type === "agent_end") L.state = "done";
    if (e.type === "gate" && a !== "user") { lanes.user.state = "waiting"; lanes.user.x = Math.max(lanes.user.x, cx(GATE)); drawLane("user", animate); }
    if (a === "user") L.state = "done";
    drawLane(a, animate);

    const li = el("li");
    const dot = el("i"); dot.style.background = dye(a);
    li.append(dot, el("b", null, NAMES[a] ?? a), el("span", null, e.msg ?? e.type));
    feed.prepend(li);
    while (feed.children.length > 9) feed.lastChild.remove();
    const stage = STATIONS[stationFor({ ...e, type: "phase", agent: "manager" })]?.name ?? "";
    nowTitle.textContent = e.type === "gate" ? "Waiting for your OK" : `${STATIONS[PHASE[e.phase] ?? 4]?.name ?? stage}`;
    nowText.textContent = `${NAMES[a] ?? a}: ${e.msg ?? ""}`;
    const r = running();
    status.textContent = lanes.user.state === "waiting" ? "Waiting for your OK" : r ? `${r} running` : i >= events.length ? "Shipped · live" : "Working";
    count.textContent = `${i} / ${events.length}`;
  }

  function drawLane(a, animate) {
    const L = lanes[a];
    if (!animate || !gsap) { L.shown = L.x; L.thread.setAttribute("d", wave(L.shown, L.y)); drawEnd(L, a); return; }
    gsap.to(L, { shown: L.x, duration: 0.6, ease: "expo.out", onUpdate: () => L.thread.setAttribute("d", wave(L.shown, L.y)) });
    drawEnd(L, a);
  }

  function step(animate = true) {
    if (i >= events.length) { stop(); return false; }
    i++;
    apply(events[i - 1], animate);
    if (i >= events.length) stop();
    return true;
  }
  function stop() { playing = false; clearTimeout(timer); play.textContent = i >= events.length ? "Replay" : "Play"; play.setAttribute("aria-pressed", "false"); }
  function start() {
    if (i >= events.length) reset();
    playing = true; play.textContent = "Pause"; play.setAttribute("aria-pressed", "true");
    const tick = () => { if (!playing) return; if (step(!reduced)) timer = setTimeout(tick, reduced ? 400 : 750); };
    tick();
  }
  function reset() {
    stop(); i = 0; feed.replaceChildren();
    for (const [a, L] of Object.entries(lanes)) { L.knots.replaceChildren(); L.x = L.shown = LEFT - 12; L.state = "idle"; L.perStation = {}; L.thread.setAttribute("d", ""); drawEnd(L, a); }
    nowTitle.textContent = "Ready"; nowText.textContent = "Press play to replay the run."; status.textContent = "Ready"; count.textContent = `0 / ${events.length}`;
  }

  play.onclick = () => (playing ? stop() : start());
  restart.onclick = () => { reset(); start(); };
  reset();
  if (reduced) { while (step(false)); }   // reduced motion: show the finished run; Replay steps through it
  else {
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting && !playing && i === 0) start(); else if (!en.isIntersecting && playing) stop(); }, { threshold: 0.35 });
    io.observe(root);
  }
  return { start, stop, reset };
}
