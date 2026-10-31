// Needle-and-thread cursor (option A). The needle tip is the exact pointer. A short rope of thread
// trails from the needle's eye and swings as you move; over links and buttons the thread loops once
// around the target; a data-cursor="label" attribute hangs a small fabric tag on the thread.
// Off on touch screens and with reduced motion (the native cursor stays). Text fields keep the I-beam.
import { finePointer, reducedMotion } from "./motion.js";

const HOVER = "a[href], button, summary, label[for], [data-cursor]";
const TEXT = "input, textarea, select, [contenteditable='true']";
const SEGS = 8, SEG = 7, NEEDLE = 30;

export function startCursor() {
  if (!finePointer() || reducedMotion()) return null;
  const cv = document.createElement("canvas");
  cv.className = "kc";
  cv.setAttribute("aria-hidden", "true");
  document.body.append(cv);
  document.documentElement.classList.add("kc-on");
  const ctx = cv.getContext("2d");
  let dpr = 1, W = 0, H = 0;
  const resize = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  resize();
  addEventListener("resize", resize);

  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  let colors = { needle: css("--ink"), thread: css("--cursor-thread"), panel: css("--panel") };
  new MutationObserver(() => { colors = { needle: css("--ink"), thread: css("--cursor-thread"), panel: css("--panel") }; wake(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const p = { x: -100, y: -100, vx: 0, vy: 0, seen: false };
  let ang = Math.PI * 0.27;                 // needle body points down-right from the tip at rest
  let scale = 1, scaleTo = 1, hidden = true;
  let target = null, loop = 0, label = "";
  const rope = Array.from({ length: SEGS }, () => ({ x: -100, y: -100, px: -100, py: -100 }));

  const eye = () => ({ x: p.x + Math.cos(ang) * (NEEDLE - 4) * scale, y: p.y + Math.sin(ang) * (NEEDLE - 4) * scale });

  function onMove(e) {
    p.vx = e.clientX - p.x; p.vy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (!p.seen) { p.seen = true; const s = eye(); for (const r of rope) { r.x = r.px = s.x; r.y = r.py = s.y; } }
    const el = e.target instanceof Element ? e.target : null;
    const inText = el?.closest(TEXT);
    hidden = !!inText;
    const t = inText ? null : el?.closest(HOVER);
    if (t !== target) { target = t; label = t?.dataset.cursor ?? ""; }
    wake();
  }
  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("pointerdown", () => { scaleTo = 0.82; wake(); });
  addEventListener("pointerup", () => { scaleTo = 1; wake(); });
  document.addEventListener("pointerleave", () => { hidden = true; wake(); });
  document.addEventListener("pointerenter", () => { hidden = false; wake(); });

  let raf = 0, still = 0;
  function wake() { still = 0; if (!raf) raf = requestAnimationFrame(tick); }

  function tick() {
    raf = 0;
    // Needle angle: trails behind the motion when moving, eases back to rest when slow.
    const speed = Math.hypot(p.vx, p.vy);
    const want = speed > 2 ? Math.atan2(-p.vy, -p.vx) * 0.35 + Math.PI * 0.27 * 0.65 : Math.PI * 0.27;
    ang += (want - ang) * 0.18;
    p.vx *= 0.6; p.vy *= 0.6;
    scale += (scaleTo * (target ? 0.9 : 1) - scale) * 0.3;
    loop += ((target ? 1 : 0) - loop) * 0.2;

    // Verlet rope from the eye, with light gravity.
    const e0 = eye();
    rope[0].x = e0.x; rope[0].y = e0.y;
    let motion = 0;
    for (let i = 1; i < SEGS; i++) {
      const r = rope[i], vx = (r.x - r.px) * 0.9, vy = (r.y - r.py) * 0.9;
      r.px = r.x; r.py = r.y; r.x += vx; r.y += vy + 0.35;
      motion += Math.abs(vx) + Math.abs(vy);
    }
    for (let k = 0; k < 4; k++) for (let i = 1; i < SEGS; i++) {
      const a = rope[i - 1], b = rope[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - SEG) / d;
      if (i === 1) { b.x -= dx * f; b.y -= dy * f; } else { a.x += dx * f * 0.5; a.y += dy * f * 0.5; b.x -= dx * f * 0.5; b.y -= dy * f * 0.5; }
      rope[0].x = e0.x; rope[0].y = e0.y;
    }

    ctx.clearRect(0, 0, W, H);
    if (!hidden && p.seen) draw();
    still = motion < 0.05 && Math.abs(loop - (target ? 1 : 0)) < 0.01 && Math.abs(scale - scaleTo * (target ? 0.9 : 1)) < 0.005 ? still + 1 : 0;
    if (still < 4) raf = requestAnimationFrame(tick);
  }

  function draw() {
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    // Loop around the hovered target, drawn as a growing arc outside its focus ring.
    if (target && loop > 0.02) {
      const r = target.getBoundingClientRect();
      ctx.beginPath();
      ctx.ellipse(r.left + r.width / 2, r.top + r.height / 2, r.width / 2 + 12, r.height / 2 + 12, -0.06, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * loop);
      ctx.strokeStyle = colors.thread; ctx.lineWidth = 2; ctx.stroke();
    }
    // Thread tail.
    ctx.beginPath();
    ctx.moveTo(rope[0].x, rope[0].y);
    for (let i = 1; i < SEGS - 1; i++) { const mx = (rope[i].x + rope[i + 1].x) / 2, my = (rope[i].y + rope[i + 1].y) / 2; ctx.quadraticCurveTo(rope[i].x, rope[i].y, mx, my); }
    ctx.lineTo(rope[SEGS - 1].x, rope[SEGS - 1].y);
    ctx.strokeStyle = colors.thread; ctx.lineWidth = 2; ctx.stroke();
    // Label tag hanging from the end of the thread.
    if (label) {
      const end = rope[SEGS - 1];
      ctx.font = "600 11px 'Geist Mono', monospace";
      const w = ctx.measureText(label).width + 18, x = end.x - 4, y = end.y + 2;
      ctx.fillStyle = colors.panel; ctx.strokeStyle = colors.needle; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.roundRect(x, y, w, 21, 4); ctx.fill(); ctx.stroke();
      ctx.setLineDash([2.5, 2]); ctx.beginPath(); ctx.roundRect(x + 3, y + 3, w - 6, 15, 3); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = colors.needle; ctx.fillText(label, x + 9, y + 14.5);
    }
    // Needle: a slim tapered body from the tip, with an open eye.
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(ang); ctx.scale(scale, scale);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(NEEDLE, -2.6); ctx.quadraticCurveTo(NEEDLE + 3.4, 0, NEEDLE, 2.6); ctx.closePath();
    ctx.fillStyle = colors.needle; ctx.fill();
    ctx.beginPath(); ctx.ellipse(NEEDLE - 4, 0, 2.8, 1.05, 0, 0, Math.PI * 2); ctx.fillStyle = colors.panel; ctx.fill();
    ctx.restore();
  }

  return { destroy() { cancelAnimationFrame(raf); cv.remove(); document.documentElement.classList.remove("kc-on"); } };
}
