// Knit landing page. The page works as plain HTML; this adds the theme switch, copy buttons, smooth
// scroll, text reveals, the run replay, the cursor and, last, the 3D loom (loaded lazily).
import { reducedMotion, finePointer, ease, dur, revealLines, revealUp } from "./motion.js";
import { startCursor } from "./cursor.js";
import { mountRun } from "./run.js";

const reduced = reducedMotion();
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;

// Theme: system first, then the visitor's choice, remembered.
$("#theme").addEventListener("click", () => {
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("knit-theme", root.dataset.theme); } catch {}
});

// Version from the repo's VERSION file (copied next to the page on deploy).
fetch("VERSION").then((r) => (r.ok ? r.text() : Promise.reject())).then((v) => {
  v = v.trim();
  if (!/^\d+\.\d+\.\d+$/.test(v)) return;
  const chip = $("#version");
  chip.textContent = `v${v}`;
  chip.hidden = false;
  $$("[data-version]").forEach((e) => (e.textContent = `v${v}`));
}).catch(() => {});

// Copy buttons: copied, or a clear fallback when the clipboard is blocked.
for (const b of $$("[data-copy]")) {
  const label = b.querySelector("span");
  b.addEventListener("click", async () => {
    const code = b.parentElement.querySelector("code");
    const text = code.textContent.trim();
    clearTimeout(b._t);
    try {
      await navigator.clipboard.writeText(text);
      b.dataset.state = "copied";
      label.textContent = "Copied";
    } catch {
      getSelection().selectAllChildren(code);
      b.dataset.state = "error";
      label.textContent = "Press Ctrl+C";
    }
    b._t = setTimeout(() => { delete b.dataset.state; label.textContent = "Copy"; }, 1800);
  });
}

// Solid nav once the page scrolls.
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("solid", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Animation libraries from the import map. If the CDN is unreachable the page stays fully usable.
let gsap = null, ScrollTrigger = null, SplitText = null, Lenis = null;
try {
  [{ gsap }, { ScrollTrigger }, { SplitText }, { default: Lenis }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger.js"), import("gsap/SplitText.js"), import("lenis")]);
  gsap.registerPlugin(ScrollTrigger, SplitText);
} catch (e) {
  console.warn("Knit: animation libraries didn't load; showing the still page.", e);
  gsap = null;
}

// Smooth scroll, synced to GSAP's ticker. Anchor links still land on (and focus) their section.
let lenis = null;
if (gsap && !reduced) {
  lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
// Sections have generous top padding, so land on their first heading (kicker, step number or title),
// a little below the fixed nav, instead of on the section's top edge.
const NAV_GAP = 28;
const landingY = (target) => {
  if (target.id === "top") return 0;
  const head = target.querySelector(".kicker, .step .inner, h2") ?? target;   // untransformed boxes, so reveals don't shift the landing
  return Math.max(0, head.getBoundingClientRect().top + scrollY - nav.offsetHeight - NAV_GAP);
};
const goTo = (target, immediate = false) => {
  const done = () => { if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true }); };
  const y = landingY(target);
  if (lenis) lenis.scrollTo(y, { duration: immediate ? 0 : 1.2, immediate, onComplete: done, force: true });
  else { scrollTo({ top: y, behavior: immediate || reduced ? "auto" : "smooth" }); done(); }
};
for (const a of $$('a[href^="#"]')) {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const target = id === "#top" ? $("#top") : $(id);
    if (!target) return;
    e.preventDefault();
    goTo(target);
    history.pushState(null, "", id);
  });
}
// Arriving with a #hash in the URL lands the same way.
if (location.hash.length > 1) {
  const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (t) requestAnimationFrame(() => goTo(t, true));
}

// The run replay works with or without GSAP.
mountRun($("#run-card"), { url: "runs/calculator.jsonl", gsap, reduced });

// Text reveals, counters and bars.
if (gsap && !reduced) {
  await document.fonts.ready;
  for (const h of $$("[data-split]")) revealLines(gsap, SplitText, h, { immediate: h.id === "hero-title", delay: h.id === "hero-title" ? 0.1 : 0 });
  gsap.from(".hero .eyebrow, .hero .lede, .hero .ctas, .hero .cmd", { y: 22, opacity: 0, duration: dur[4] * 1.4, ease: ease.out, stagger: 0.08, delay: 0.35 });
  for (const s of $$(".step .inner")) revealUp(gsap, s.querySelectorAll("p, ul, .approve, .shipped, .n"), s);
  revealUp(gsap, ".agent", "#agent-list");
  revealUp(gsap, ".project", ".projects");
  revealUp(gsap, ".faq details", ".faq");
  gsap.from(".fill", { scaleX: 0, duration: 1.4, ease: ease.out, stagger: 0.12, scrollTrigger: { trigger: ".bars", start: "top 85%", once: true } });
  // Keyboard users can reach content before it has scrolled in: finish its reveal on focus.
  document.addEventListener("focusin", (e) => {
    for (let el = e.target; el && el !== document.body; el = el.parentElement)
      for (const tw of gsap.getTweensOf(el)) if (tw.progress() < 1) tw.progress(1);
  });
  for (const n of $$("[data-count]")) {
    const to = +n.dataset.count, o = { v: 0 }, pre = n.dataset.prefix ?? "", suf = n.dataset.suffix ?? "";
    gsap.to(o, { v: to, duration: 1.6, ease: "power2.out", scrollTrigger: { trigger: n, start: "top 90%", once: true }, onUpdate: () => (n.textContent = `${pre}${Math.round(o.v)}${suf}`) });
  }
}

// Magnetic buttons pull a little toward the pointer.
if (gsap && finePointer() && !reduced) {
  for (const b of $$("[data-magnetic]")) {
    const x = gsap.quickTo(b, "x", { duration: 0.4, ease: ease.out }), y = gsap.quickTo(b, "y", { duration: 0.4, ease: ease.out });
    b.addEventListener("pointermove", (e) => { const r = b.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.22); y((e.clientY - r.top - r.height / 2) * 0.3); });
    b.addEventListener("pointerleave", () => { x(0); y(0); });
  }
}

// Final call to action: a 600 ms indigo wipe, then GitHub. Modified clicks open as usual.
const wipe = $("#wipe");
for (const a of $$("[data-wipe]")) {
  a.addEventListener("click", (e) => {
    if (!gsap || reduced || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    gsap.fromTo(wipe, { yPercent: 100 }, { yPercent: 0, duration: dur[4], ease: ease.inOut, onComplete: () => (location.href = a.href) });
  });
}
addEventListener("pageshow", () => gsap?.set(wipe, { yPercent: 100 }));

startCursor();

// The loom, last. Reduced motion, no WebGL or no libraries: the still poster instead.
const canvas = $("#weave"), poster = $("#poster"), loader = $("#loader"), pct = $("#loader-pct"), stages = $$("#stages span");
const done = () => { loader.dataset.loader = "done"; };
const showPoster = () => { if (!poster.src) poster.src = "media/weave-poster.webp"; poster.classList.add("on"); canvas.style.visibility = "hidden"; done(); };
const hasWebGL = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } })();
const lite = matchMedia("(pointer: coarse)").matches || innerWidth < 768;

if (!gsap || reduced || !hasWebGL) showPoster();
else {
  let loadedModule = 0, assets = 0, weave = null;
  const show = () => (pct.textContent = `${Math.round((loadedModule * 0.5 + assets * 0.5) * 100)}%`);
  const slow = setTimeout(() => { if (!weave) showPoster(); }, Math.max(0, 3000 - performance.now()));   // never wait past ~3 s after navigation
  try {
    const { createWeave } = await import("./weave.js");
    loadedModule = 1; show();
    weave = await createWeave(canvas, { lite, maxDpr: lite ? 1.5 : 1.75, onProgress: (p) => { assets = p; show(); } });
    clearTimeout(slow);
    pct.textContent = "100%";
    if (poster.classList.contains("on")) { poster.classList.remove("on"); canvas.style.visibility = ""; }
    gsap.fromTo(canvas, { autoAlpha: 0 }, { autoAlpha: 1, duration: dur[4], ease: ease.out });
    done();

    let visible = true;
    const sync = () => (weave.active = visible && !document.hidden);
    document.addEventListener("visibilitychange", sync);
    gsap.ticker.add(() => weave.frame());
    let rz = 0;
    addEventListener("resize", () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => weave.resize()); });
    if (finePointer()) addEventListener("pointermove", (e) => weave.pointer((e.clientX / innerWidth - 0.5) * 2, (e.clientY / innerHeight - 0.5) * 2), { passive: true });

    // One master timeline across the story: it weaves the rows stage by stage and pushes the camera in.
    // Each step's own trigger lights its stage pill. After the agents section the loom fades out and
    // stops rendering while hidden.
    const view = { p: 0, z: 1 };
    gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: "#story", start: "top 55%", end: "bottom 60%", scrub: 0.6 } })
      .to(view, { p: 1, z: 0.94, duration: 1, onUpdate: () => { weave.setProgress(view.p); weave.dolly(view.z); } });
    $$(".step").forEach((step, i) => ScrollTrigger.create({ trigger: step, start: "top 55%", end: "bottom 55%",
      onToggle: (st) => {
        if (st.isActive) stages.forEach((el, k) => el.classList.toggle("on", k === i));
        else if (i === 0 && st.direction < 0) stages.forEach((el) => el.classList.remove("on"));   // scrolled back to the hero
      } }));
    const narrow = matchMedia("(max-aspect-ratio: 115/100)").matches;   // phones and portrait tablets: cards cover the loom, so fade early
    gsap.timeline({ scrollTrigger: { trigger: "#agents", start: narrow ? "top 85%" : "bottom 75%", end: narrow ? "top 35%" : "bottom 35%", scrub: 0.4 } })
      .to([canvas, "#stages"], { autoAlpha: 0, ease: "none", onUpdate: () => { visible = gsap.getProperty(canvas, "opacity") > 0.01; sync(); } });
    ScrollTrigger.create({ trigger: "#agents", start: narrow ? "top 35%" : "bottom 35%", onLeaveBack: () => { visible = true; sync(); } });

    // Hovering or focusing an agent card tugs its spool.
    for (const card of $$("[data-agent]")) {
      const on = () => weave.tug(card.dataset.agent, 1), off = () => weave.tug(card.dataset.agent, 0);
      card.addEventListener("pointerenter", on); card.addEventListener("pointerleave", off);
      card.addEventListener("focusin", on); card.addEventListener("focusout", off);
    }
    document.body.dataset.weave = "ready";
  } catch (e) {
    console.warn("Knit: the 3D loom didn't load; showing the poster.", e);
    clearTimeout(slow);
    showPoster();
  }
}
