// Makes the README media in the Loom style: a banner, designed screenshot cards and the scroll demo
// (demo.mp4, demo.webp, demo.gif). Needs ffmpeg, and these running locally:
//   node scripts/serve-site.mjs 4380
//   node board/server.mjs ../habit-tracker --port 4333 --replay --speed 2 --offline
// Usage: node docs/readme/media.mjs        (raw captures go to docs/readme/raw/, which git ignores)
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const here = dirname(fileURLToPath(import.meta.url));
const raw = join(here, "raw");
const SITE = "http://127.0.0.1:4380/", BOARD = "http://127.0.0.1:4333/";
const GPU = ["--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"];
const NO_CURSOR = ".kc{display:none!important}";
mkdirSync(raw, { recursive: true });
const browser = await chromium.launch({ args: GPU });

async function sitePage(opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport ?? { width: 1440, height: 900 }, deviceScaleFactor: opts.dpr ?? 1, colorScheme: opts.theme ?? "light", isMobile: opts.mobile, hasTouch: opts.mobile, recordVideo: opts.video });
  const page = await ctx.newPage();
  const t0 = Date.now();
  await page.goto(SITE);
  await page.addStyleTag({ content: NO_CURSOR });
  await page.mouse.wheel(0, 1);                       // starts the 3D like a first scroll would
  await page.waitForSelector('body[data-weave="ready"]', { timeout: 20000 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(1600);
  return { ctx, page, readyAt: (Date.now() - t0) / 1000 };
}
const scrollToStep = async (page, sel, wait = 1800) => {
  await page.evaluate((s) => scrollTo(0, document.querySelector(s).getBoundingClientRect().top + scrollY - 40), sel);
  await page.waitForTimeout(wait);
};

// ---- captures ---------------------------------------------------------------------------------
{
  const { ctx, page } = await sitePage();
  await page.screenshot({ path: join(raw, "hero.png") });
  await ctx.close();
}
{
  const { ctx, page } = await sitePage({ theme: "dark" });
  await scrollToStep(page, '[data-stage="4"]', 2600);
  await page.screenshot({ path: join(raw, "ship-dark.png") });
  await ctx.close();
}
{
  const { ctx, page } = await sitePage();
  await page.addStyleTag({ content: ".nav{display:none!important}" });   // the fixed nav would cover the card's top
  await scrollToStep(page, "#run-card", 300);
  await page.locator("[data-run-restart]").click();
  await page.waitForTimeout(9800);
  await page.locator("#run-card").screenshot({ path: join(raw, "run.png") });
  await ctx.close();
}
{
  const { ctx, page } = await sitePage({ viewport: { width: 390, height: 844 }, dpr: 2, mobile: true });
  await page.screenshot({ path: join(raw, "phone.png") });
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
  const page = await ctx.newPage();
  await page.goto(BOARD);
  for (let i = 0; i < 400; i++) {                      // a moment with two agents running
    await page.waitForTimeout(60);
    if (+(await page.textContent("#busy")) >= 2 && (await page.locator(".lane-name").count()) >= 8) break;
  }
  await page.waitForTimeout(350);
  await page.screenshot({ path: join(raw, "board.png") });
  await ctx.close();
}
// The demo: settle on the hero, then scroll steadily through the story to the woven app.
{
  const { ctx, page, readyAt } = await sitePage({ viewport: { width: 1280, height: 800 }, video: { dir: raw, size: { width: 1280, height: 800 } } });
  const start = readyAt + 1.6 - 0.3;
  await page.waitForTimeout(1200);
  await page.evaluate(async () => {
    const end = document.querySelector('[data-stage="4"]').getBoundingClientRect().top + scrollY - 40;
    const t0 = performance.now(), dur = 9500;
    await new Promise((res) => { const step = (t) => { const k = Math.min(1, (t - t0) / dur); scrollTo(0, end * (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2)); k < 1 ? requestAnimationFrame(step) : res(); }; requestAnimationFrame(step); });
  });
  await page.waitForTimeout(2200);
  const video = page.video();
  await ctx.close();
  const webm = await video.path();
  for (const f of readdirSync(raw)) if (f.endsWith(".webm") && join(raw, f) !== webm) rmSync(join(raw, f));
  renameSync(webm, join(raw, "demo.webm"));
  process.env.KNIT_DEMO_START = String(start);
}

// ---- cards ------------------------------------------------------------------------------------
const tokens = readFileSync(join(here, "../../site/tokens.css"), "utf8").replaceAll('url("fonts/', `url("${SITE}fonts/`);
const b64 = (file) => `data:image/png;base64,${readFileSync(join(raw, file)).toString("base64")}`;
const poster = `data:image/webp;base64,${readFileSync(join(here, "../../site/media/weave-poster.webp")).toString("base64")}`;
const CARD_CSS = `${tokens}
  body{margin:0;background:transparent;font-family:var(--font-body);color:#1E2A5A}
  .card{width:1200px;box-sizing:border-box;background:#FFFDF8;border:1.5px solid #D9D0BF;border-radius:28px;padding:38px 42px 42px;position:relative;
    background-image:repeating-linear-gradient(0deg,rgba(30,42,90,.02) 0 1px,transparent 1px 3px)}
  .card::after{content:"";position:absolute;inset:9px;border:1.5px dashed #B9B09F;border-radius:21px;pointer-events:none}
  .k{font:500 13px var(--font-mono);letter-spacing:.12em;text-transform:uppercase;color:#B33A23}
  h2{font:800 46px/1 var(--font-display);letter-spacing:-.04em;margin:12px 0 10px}
  p{font-size:19px;color:#5E5A50;margin:0 0 26px;max-width:880px}
  .win{border-radius:16px;overflow:hidden;border:1.5px solid #D9D0BF;box-shadow:0 26px 60px -30px rgba(30,42,90,.45);background:#F3EEE4}
  .bar{height:40px;display:flex;align-items:center;gap:8px;padding:0 16px;background:#EFE9DD;border-bottom:1.5px solid #D9D0BF}
  .bar i{width:11px;height:11px;border-radius:50%}
  .url{margin-left:14px;font:500 12.5px var(--font-mono);color:#5E5A50;background:#FFFDF8;border-radius:999px;padding:5px 14px}
  .win img{display:block;width:100%}
  .row{display:flex;gap:28px;align-items:center}
  .phone{width:300px;flex:none;border-radius:44px;padding:11px;background:#1E2A5A;box-shadow:0 26px 60px -30px rgba(30,42,90,.55)}
  .phone img{display:block;width:100%;border-radius:34px}
  .threads{display:flex;gap:6px;margin-top:22px}.threads span{height:6px;flex:1;border-radius:3px}`;
const dots = `<i style="background:#E2654A"></i><i style="background:#E2A522"></i><i style="background:#3FAE6E"></i>`;
const THREADS = ["manager", "ux-designer", "frontend-dev", "backend-dev", "tester", "debugger", "code-reviewer", "devops", "tech-writer"].map((a) => `<span style="background:var(--dye-${a})"></span>`).join("");
const win = (src, url) => `<div class="win"><div class="bar">${dots}<span class="url">${url}</span></div><img src="${src}"></div>`;

async function render(file, html, width = 1200) {
  const page = await browser.newPage({ viewport: { width, height: 800 }, deviceScaleFactor: 1 });
  await page.goto(SITE);                                 // same origin, so the self-hosted fonts load
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CARD_CSS}</style></head><body>${html}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  const png = join(raw, `${file}.png`);
  await page.locator("body > *").first().screenshot({ path: png, omitBackground: true });
  await page.close();
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", png, "-c:v", "libwebp", "-quality", "86", "-lossless", "0", join(here, `${file}.webp`)]);
}

await render("banner", `<div class="card" style="width:1600px;padding:54px 60px;display:grid;grid-template-columns:1fr 640px;gap:40px;align-items:center">
  <div>
    <div style="display:flex;align-items:center;gap:18px"><svg width="72" height="72" viewBox="0 0 32 32"><path d="M5 16c0-6 5-10 11-10s11 4 11 10" fill="none" stroke="#C4432B" stroke-width="3.2" stroke-linecap="round"/><path d="M27 16c0 6-5 10-11 10S5 22 5 16" fill="none" stroke="#1E2A5A" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="4 5"/><circle cx="16" cy="16" r="3.5" fill="#C4432B"/></svg><span style="font:800 96px/1 var(--font-display);letter-spacing:-.05em">Knit</span></div>
    <div style="font:800 64px/.98 var(--font-display);letter-spacing:-.045em;margin:30px 0 18px">The team weaves<br><span style="color:#C4432B">your app.</span></div>
    <p style="font-size:22px;margin:0">A software team for AI coding agents: plan, design, build, tests, review, docs and a live deploy, at the cost of one normal session. Claude Code · Codex · Cursor · OpenCode · Antigravity.</p>
    <div class="threads">${THREADS}</div>
  </div>
  <img src="${poster}" style="width:640px;display:block">
</div>`, 1600);
await render("card-landing", `<div class="card"><div class="k">The landing page</div><h2>The team weaves your app.</h2><p>Nine Blender spools, one per agent, feed a three.js loom. Scroll and the rows weave in: plan, build, tests, review, ship.</p>${win(b64("hero.png"), "jagdish3135.github.io/knit")}</div>`);
await render("card-weave", `<div class="card"><div class="k">The last rows</div><h2>The cloth is a shipped app.</h2><p>On the final rows the woven picture is LexAgent, a real app built with Knit. Light and dark, AA contrast throughout.</p>${win(b64("ship-dark.png"), "jagdish3135.github.io/knit")}</div>`);
await render("card-run", `<div class="card"><div class="k">What a run looks like</div><h2>Every agent is a thread.</h2><p>A replay of Calculator 2.0's real run log: knots are each agent's steps at each station, from intake to live.</p><div class="win"><img src="${b64("run.png")}"></div></div>`);
await render("card-board", `<div class="card"><div class="k">Knit Board</div><h2>Watch the team weave, live.</h2><p>Threads grow as agents log steps; running, waiting for your OK, failed and done are clear at a glance. No dependencies, 127.0.0.1 only.</p>${win(b64("board.png"), "127.0.0.1:4321")}</div>`);
await render("card-phone", `<div class="card"><div class="row"><div class="phone"><img src="${b64("phone.png")}"></div><div><div class="k">On a phone</div><h2>Same loom, lighter scene.</h2><p style="margin:0">The copy sits on cotton panels over the loom, the needle cursor turns off for touch, and reduced motion gets a still of the woven cloth instead of the 3D.</p></div></div></div>`);

// ---- the demo: framed in a card, then MP4, animated WebP and GIF ---------------------------
{
  const start = process.env.KNIT_DEMO_START;
  const frame = join(raw, "demo-frame.png");
  await render("demo-frame", `<div class="card" style="width:1360px;padding:30px"><div class="win"><div class="bar">${dots}<span class="url">jagdish3135.github.io/knit</span></div><div style="width:1296px;height:810px"></div></div></div>`, 1360);
  const run = (args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
  const [fw, fh] = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", frame]).toString().trim().split(",").map(Number);
  // Cotton behind the card (MP4 has no transparency), the card on top, the video inside its window.
  const vf = `color=c=0xF3EEE4:s=${fw}x${fh + (fh % 2)}[c];[c][0:v]overlay=0:0[f];[1:v]scale=1296:810[v];[f][v]overlay=33:74:shortest=1,fps=30`;
  run(["-loop", "1", "-i", frame, "-ss", start, "-i", join(raw, "demo.webm"), "-filter_complex", vf, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "24", "-preset", "slow", "-movflags", "+faststart", "-an", join(here, "demo.mp4")]);
  run(["-i", join(here, "demo.mp4"), "-vf", "fps=12,scale=820:-1:flags=lanczos", "-c:v", "libwebp_anim", "-lossless", "0", "-quality", "55", "-compression_level", "6", "-loop", "0", join(here, "demo.webp")]);
  run(["-i", join(here, "demo.mp4"), "-vf", "fps=8,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle", "-loop", "0", join(here, "demo.gif")]);
  rmSync(join(here, "demo-frame.webp"), { force: true });
}
await browser.close();
console.log("README media written to docs/readme/");
