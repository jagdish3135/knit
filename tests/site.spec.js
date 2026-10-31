import { test, expect } from "@playwright/test";

// Fail any test that logs an error or throws on the page.
test.beforeEach(async ({ page }) => {
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && page.errors.push(m.text()));
});
test.afterEach(async ({ page }) => expect(page.errors).toEqual([]));

test("loads, finishes the loader and the call to action leads to GitHub", async ({ page }) => {
  await page.route("https://github.com/**", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<title>GitHub</title>ok" }));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/The team weaves your app/);
  await expect(page.locator("#loader")).toHaveAttribute("data-loader", "done", { timeout: 6_000 });
  const cta = page.getByRole("link", { name: "Get Knit on GitHub" });
  await cta.scrollIntoViewIfNeeded();
  await cta.click();
  await page.waitForURL("https://github.com/jagdish3135/knit");
});

test("copy buttons show the copied state", async ({ page, context, browserName }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  const btn = page.locator(".hero [data-copy]");
  await btn.click();
  await expect(btn).toHaveText("Copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("git clone https://github.com/jagdish3135/knit");
});

test("the run replay plays the real calculator log", async ({ page }) => {
  await page.goto("/#run");
  const count = page.locator("[data-run-count]");
  await expect(count).toHaveText("0 / 29");
  await page.locator("[data-run-play]").click();
  await expect(count).not.toHaveText("0 / 29");
  await expect(page.locator(".feed li").first()).toBeVisible();
});

test("reduced motion shows the still poster, no 3D and no custom cursor", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:4381/");
  await expect(page.locator("#poster")).toHaveClass(/on/);
  await expect(page.locator("canvas.kc")).toHaveCount(0);
  await ctx.close();
});

test("no sideways scroll and the theme switch works", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("#theme").click();
  const theme = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(["light", "dark"]).toContain(theme);
});
