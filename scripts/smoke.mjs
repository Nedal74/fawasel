#!/usr/bin/env node
/**
 * End-to-end smoke test of the "definition of done" flow:
 * sign in -> create a project -> publish it -> see it on the public site,
 * plus a pass over every public route in both languages.
 *
 * Usage: npm run smoke            (expects the app on http://localhost:3000)
 *        BASE_URL=… npm run smoke
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.ADMIN_EMAIL ?? "admin@nedal.local";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "nedal-dev-admin";

process.on("uncaughtException", (error) => {
  const detail = String(error?.stack ?? error)
    .split("\n")
    .filter((line) => line.includes("smoke.mjs") || line.includes("Error"))
    .slice(0, 3)
    .join(" | ");
  check("run completed", false, detail);
  report();
  process.exit(1);
});

const results = [];
let failures = 0;

function check(name, ok, detail = "") {
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

function report() {
  console.log(results.join("\n"));
  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(String(error)));

async function visit(path, expected) {
  const response = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  const status = response?.status() ?? 0;
  const body = await page.content();
  check(`GET ${path}`, status === 200 && body.includes(expected), `status ${status}`);

  // No horizontal overflow at desktop or mobile width.
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    check(`no horizontal overflow ${path} @${width}px`, !overflow);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
}

// --- public site ------------------------------------------------------------
await visit("/", "NEDAL ELABID");
await visit("/about", "THE PERSON BEHIND THE STRATEGY");
await visit("/services", "Marketing Strategy");
await visit("/projects", "MY WORK");
await visit("/articles", "MY ARTICLES");
await visit("/clients", "CLIENTS WHO TRUSTED ME");
await visit("/contact", "START A PROJECT");

// Arabic / RTL
await context.addCookies([
  { name: "nedal_locale", value: "ar", url: BASE },
]);
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const dir = await page.evaluate(() => document.documentElement.getAttribute("dir"));
const lang = await page.evaluate(() => document.documentElement.getAttribute("lang"));
check("Arabic switches to RTL", dir === "rtl" && lang === "ar", `dir=${dir} lang=${lang}`);
check("Arabic hero copy renders", (await page.content()).includes("مدير تسويق"));
await context.clearCookies();

// --- homepage interactions --------------------------------------------------
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

// Services slider: the active (lime) card changes when advancing.
const activeService = () =>
  page.evaluate(() => {
    const card = document.querySelector("#services article");
    return card ? card.textContent?.replace(/\s+/g, " ").trim() ?? "" : "";
  });
await page.locator("#services").scrollIntoViewIfNeeded();
const serviceBefore = await activeService();
await page.getByRole("button", { name: "Next service" }).click();
await page.waitForTimeout(900);
check("services slider advances", (await activeService()) !== serviceBefore);

// Both sliders move on their own, without any interaction, roughly every 3s.
await page.mouse.move(5, 5);
const liveService = () => page.locator('#services [aria-live="polite"]').textContent();
const serviceIdle = await liveService();
await page.waitForTimeout(3400);
check("services slider advances on its own", (await liveService()) !== serviceIdle, serviceIdle);

// Metrics: the large number changes when advancing.
await page.locator("#intelligence").scrollIntoViewIfNeeded();
const liveMetric = () => page.locator('#intelligence [aria-live="polite"]').textContent();
const metricBefore = await liveMetric();
await page.getByRole("button", { name: "Next metric" }).click();
await page.waitForTimeout(900);
check("metrics carousel advances", (await liveMetric()) !== metricBefore, `${metricBefore}`);

await page.mouse.move(5, 5);
const metricIdle = await liveMetric();
await page.waitForTimeout(3400);
check("metrics advance on their own", (await liveMetric()) !== metricIdle, `${metricIdle}`);

// Homepage order must match the V2 spec.
const order = await page.evaluate(() =>
  [...document.querySelectorAll("section[id]")].map((section) => section.id),
);
check(
  "homepage section order",
  order.join(",") ===
    "about,services,work,skills,intelligence,clients,testimonials,articles,contact",
  order.join(","),
);

check(
  "no experience or tools section on the public site",
  !order.includes("experience") && !order.includes("tools"),
);

// About section drops the services into two piles.
await page.locator("#about").scrollIntoViewIfNeeded();
await page.waitForTimeout(2600);
const pileBoxes = await page.locator("#about ul").count();
const pills = await page.locator("#about ul li").count();
check("about section shows two service piles", pileBoxes === 2, `${pileBoxes} boxes`);
check("service pills dropped in", pills >= 10, `${pills} pills`);
const landed = await page.evaluate(() => {
  const pill = document.querySelector("#about ul li span");
  return pill ? getComputedStyle(pill).transform : "";
});
check("pills settled at an angle", landed.startsWith("matrix") && landed !== "none", landed.slice(0, 40));

// Floating WhatsApp button is present and points at the CMS number.
check(
  "floating WhatsApp button",
  (await page.locator('a[href*="wa.me/966573728884"]').count()) > 0,
);

// --- admin auth -------------------------------------------------------------
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
check("unauthenticated /admin redirects to login", page.url().includes("/admin/login"));

await page.fill("#email", EMAIL);
await page.fill("#password", PASSWORD);
await Promise.all([
  page.waitForURL("**/admin", { timeout: 15000 }),
  page.getByRole("button", { name: "Sign in" }).click(),
]);
check("sign in reaches the dashboard", page.url().endsWith("/admin"));

// --- dashboard language -----------------------------------------------------
await page.getByRole("button", { name: /Switch dashboard language/ }).click();
await page.waitForFunction(
  () => document.querySelector('[dir="rtl"]') !== null,
  undefined,
  { timeout: 10000 },
).catch(() => undefined);
check(
  "dashboard switches to Arabic RTL",
  (await page.locator('[dir="rtl"]').count()) > 0 &&
    (await page.content()).includes("المشاريع"),
);
await page.getByRole("button", { name: /Switch dashboard language/ }).click();
await page.waitForFunction(
  () => document.body.innerText.includes("Projects"),
  undefined,
  { timeout: 10000 },
).catch(() => undefined);
check("dashboard switches back to English", (await page.content()).includes("Projects"));

// --- create + publish a project --------------------------------------------
const slug = `smoke-test-${Date.now()}`;
await page.goto(`${BASE}/admin/projects/new`, { waitUntil: "networkidle" });
await page.fill("#name-en", "Smoke Test Campaign");
await page.fill("#name-ar", "حملة اختبار");
await page.fill("#slug", slug);
await page.fill("#summary-en", "A project created by the automated smoke test.");
await page.fill("#category-en", "Performance");
await page.fill("#year", "2026");
await page.check('input[name="featured"]');
await Promise.all([
  page.waitForURL(/\/admin\/projects\/(?!new)[^/]+/, { timeout: 15000 }),
  page.getByRole("button", { name: "Save", exact: true }).click(),
]);
const createdPath = new URL(page.url()).pathname;
check("project created", /^\/admin\/projects\/[^/]+$/.test(createdPath) && !createdPath.endsWith("/new"), createdPath);

await visit(`/projects/${slug}`, "Smoke Test Campaign");
await page.goto(`${BASE}/projects`, { waitUntil: "networkidle" });
check("project appears in the work listing", (await page.content()).includes("Smoke Test Campaign"));
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
check("featured project appears on the homepage", (await page.content()).includes("Smoke Test Campaign"));

// --- unpublish round-trip ---------------------------------------------------
await page.goto(`${BASE}/admin/projects`, { waitUntil: "networkidle" });
const row = page.locator("tr", { hasText: "Smoke Test Campaign" }).first();
await row.locator('button[aria-label="Unpublish"]').click({ noWaitAfter: true });
await page.waitForFunction(() => document.body.innerText.includes("Draft"), undefined, {
  timeout: 15000,
}).catch(() => undefined);
const unpublished = await page.goto(`${BASE}/projects/${slug}`, { waitUntil: "networkidle" });
check("unpublished project 404s on the public site", unpublished?.status() === 404);

// --- clean up ---------------------------------------------------------------
await page.goto(`${BASE}/admin/projects`, { waitUntil: "networkidle" });
page.on("dialog", (dialog) => dialog.accept());
await page
  .locator("tr", { hasText: "Smoke Test Campaign" })
  .first()
  .locator('button[aria-label="Delete"]')
  .click();
await page.waitForFunction(
  () => !document.body.innerText.includes("Smoke Test Campaign"),
  undefined,
  { timeout: 15000 },
).catch(() => undefined);
await page.reload({ waitUntil: "networkidle" });
check("project deleted", !(await page.content()).includes("Smoke Test Campaign"));

// --- articles ---------------------------------------------------------------
const articleSlug = `smoke-article-${Date.now()}`;
await page.goto(`${BASE}/admin/articles/new`, { waitUntil: "networkidle" });
await page.fill("#title-en", "Smoke Test Article");
await page.fill("#slug", articleSlug);
await page.fill("#summary-en", "An article created by the automated smoke test.");
await page.fill("#content-en", "## Heading\n\nFirst paragraph.\n\nSecond paragraph.");
await page.fill("#category-en", "Strategy");
await page.fill("#date", "2026-03-18");
await page.check('input[name="featured"]');
await Promise.all([
  page.waitForURL(/\/admin\/articles\/(?!new)[^/]+/, { timeout: 15000 }),
  page.getByRole("button", { name: "Save", exact: true }).click(),
]);
await visit(`/articles/${articleSlug}`, "Smoke Test Article");
check("article body renders its heading", (await page.locator("article h2").count()) > 0);
check(
  "article body splits into paragraphs",
  (await page.locator("article p").filter({ hasText: "paragraph" }).count()) >= 2,
);
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
check("article appears on the homepage", (await page.content()).includes("Smoke Test Article"));

await page.goto(`${BASE}/admin/articles`, { waitUntil: "networkidle" });
await page
  .locator("tr", { hasText: "Smoke Test Article" })
  .first()
  .locator('button[aria-label="Delete"]')
  .click();
await page.waitForTimeout(1200);
await page.reload({ waitUntil: "networkidle" });
check("article deleted", !(await page.content()).includes("Smoke Test Article"));

// --- dashboard palette ------------------------------------------------------
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
const accent = await page.evaluate(() =>
  getComputedStyle(document.documentElement).getPropertyValue("--accent").trim().toLowerCase(),
);
check("dashboard uses the lime accent", accent === "#bef532", accent);

// --- media library ----------------------------------------------------------
await page.goto(`${BASE}/admin/media`, { waitUntil: "networkidle" });
const before = await page.locator("main li").count();
await page.setInputFiles('input[type="file"]', {
  name: "smoke-pixel.png",
  mimeType: "image/png",
  // 1x1 transparent PNG
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64",
  ),
});
await page.waitForFunction(
  (count) => document.querySelectorAll("main li").length > count,
  before,
  { timeout: 20000 },
).catch(() => undefined);
check("media upload adds an asset", (await page.locator("main li").count()) > before);
const uploadedSrc = await page.locator("main li img").first().getAttribute("src");
const uploadedResponse = uploadedSrc ? await page.request.get(`${BASE}${uploadedSrc}`) : null;
check(
  "uploaded media is served",
  uploadedResponse?.status() === 200,
  `${uploadedSrc} -> ${uploadedResponse?.status()}`,
);
page.once("dialog", (dialog) => dialog.accept());
// The row disappears as the action completes, so don't wait on the element.
await page
  .locator('button[aria-label^="Delete smoke-pixel"]')
  .first()
  .click({ noWaitAfter: true });
await page.waitForLoadState("networkidle");

// --- contact form -----------------------------------------------------------
await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
await page.fill("#contact-name", "Smoke Tester");
await page.fill("#contact-phone", "+966500000000");
await page.fill("#contact-brief", "Checking the inquiry pipeline.");
await page.getByRole("button", { name: "Start project" }).click();
await page.waitForSelector('[role="status"]', { timeout: 15000 });
check("contact form shows the success state", (await page.content()).includes("Received."));

// --- SEO: privacy page, hreflang, structured data -------------------------
await visit("/privacy", "PRIVACY POLICY");
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
check(
  "hreflang alternates for en + ar",
  (await page.locator('link[rel="alternate"][hreflang="ar"]').count()) > 0 &&
    (await page.locator('link[rel="alternate"][hreflang="en"]').count()) > 0,
);
const ldTypes = await page.evaluate(() =>
  [...document.querySelectorAll('script[type="application/ld+json"]')].map((node) => node.textContent ?? ""),
);
check("Person structured data on the homepage", ldTypes.some((text) => text.includes('"Person"')));
await page.goto(`${BASE}/?lang=ar`, { waitUntil: "networkidle" });
check(
  "?lang=ar renders Arabic",
  (await page.evaluate(() => document.documentElement.getAttribute("dir"))) === "rtl",
);
await context.clearCookies();

// --- first-party analytics endpoint -------------------------------------------
const beacon = await page.request.post(`${BASE}/api/track`, {
  data: JSON.stringify({ type: "pageview", sessionId: "smoketest0001", path: "/", source: "direct", locale: "en" }),
  headers: { "content-type": "text/plain" },
});
check("analytics beacon accepted", beacon.status() === 204, `status ${beacon.status()}`);
const badBeacon = await page.request.post(`${BASE}/api/track`, { data: "{}" });
check("analytics beacon validates input", badBeacon.status() === 422, `status ${badBeacon.status()}`);

// --- chatbot ------------------------------------------------------------------
const smokeQuestion = `smoke question ${Date.now()} zqxv`;
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.locator("[data-chatbot-launcher]").click();
const bot = page.locator("#site-chatbot");
await bot.waitFor({ timeout: 10000 });
check("chatbot opens with a greeting", (await bot.locator('[data-chat-from="bot"]').count()) > 0);
await bot.getByRole("button", { name: "Marketing services" }).click();
check(
  "chatbot follows the scripted flow",
  (await bot.getByText("Which area are you interested in?").count()) > 0,
);
await page.fill("#chat-input", "how much does it cost?");
await page.keyboard.press("Enter");
await bot.getByText("depends on the scope").waitFor({ timeout: 10000 }).catch(() => undefined);
check("chatbot answers from the knowledge base", (await bot.getByText("depends on the scope").count()) > 0);
await page.fill("#chat-input", smokeQuestion);
await page.keyboard.press("Enter");
await bot.getByText("I don't have an answer").waitFor({ timeout: 10000 }).catch(() => undefined);
check("chatbot falls back when it has no answer", (await bot.getByText("I don't have an answer").count()) > 0);
await page.setViewportSize({ width: 390, height: 844 });
check(
  "chatbot fits a phone screen",
  await page.evaluate(() => {
    const box = document.querySelector("#site-chatbot")?.getBoundingClientRect();
    return Boolean(box && box.left >= 0 && box.right <= window.innerWidth && box.top >= 0);
  }),
);
await page.setViewportSize({ width: 1280, height: 900 });

// --- growth dashboard ---------------------------------------------------------
// Earlier sections leave dialog handlers behind; accept each confirm() once.
page.removeAllListeners("dialog");
page.on("dialog", (dialog) => dialog.accept().catch(() => undefined));
await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
await page.fill("#email", EMAIL);
await page.fill("#password", PASSWORD);
await Promise.all([
  page.waitForURL("**/admin", { timeout: 15000 }),
  page.getByRole("button", { name: "Sign in" }).click(),
]);
const analytics = await page.goto(`${BASE}/admin/analytics?range=30d`, { waitUntil: "networkidle" });
check(
  "analytics dashboard renders",
  analytics?.status() === 200 && (await page.content()).includes("Traffic sources"),
);
check("contact-form lead is listed", (await page.content()).includes("Smoke Tester"));

await page.goto(`${BASE}/admin/unanswered`, { waitUntil: "networkidle" });
const unansweredRow = page.locator("[data-unanswered]", { hasText: smokeQuestion });
check("unanswered question is logged", (await unansweredRow.count()) > 0);
await unansweredRow.first().locator('button[aria-label="Delete"]').click();
await page.waitForTimeout(1200);
await page.reload({ waitUntil: "networkidle" });
check("unanswered question deleted", (await page.locator("[data-unanswered]", { hasText: smokeQuestion }).count()) === 0);

await page.goto(`${BASE}/admin/conversations`, { waitUntil: "networkidle" });
const conversationRow = page.locator("[data-conversation]", { hasText: smokeQuestion });
check("conversation is logged", (await conversationRow.count()) > 0);
await conversationRow.first().locator('button[aria-label="Mark as lead"]').click();
await page.waitForTimeout(1200);
await page.reload({ waitUntil: "networkidle" });
check(
  "conversation can be marked as a lead",
  (await page.locator("[data-conversation]", { hasText: smokeQuestion }).first().getByText("Lead", { exact: true }).count()) > 0,
);
await page.locator("[data-conversation]", { hasText: smokeQuestion }).first().locator('button[aria-label="Delete"]').click();
await page.waitForTimeout(1200);
await page.reload({ waitUntil: "networkidle" });
check("conversation deleted", (await page.locator("[data-conversation]", { hasText: smokeQuestion }).count()) === 0);

const chatbotEditor = await page.goto(`${BASE}/admin/chatbot`, { waitUntil: "networkidle" });
check("chatbot editor renders", chatbotEditor?.status() === 200 && (await page.locator("[data-step]").count()) > 0);
await page.getByRole("button", { name: "Save chatbot" }).click();
await page.getByText("Chatbot saved.").waitFor({ timeout: 10000 }).catch(() => undefined);
check("chatbot config saves", (await page.getByText("Chatbot saved.").count()) > 0);

const knowledge = await page.goto(`${BASE}/admin/chat_knowledge`, { waitUntil: "networkidle" });
check("knowledge base is editable", knowledge?.status() === 200 && (await page.content()).includes("How much do your services cost?"));

// The deliberate visit to the unpublished project logs an expected 404.
const unexpectedErrors = consoleErrors.filter(
  (message) => !message.includes("status of 404"),
);
check("no console errors", unexpectedErrors.length === 0, unexpectedErrors.slice(0, 3).join(" | "));

await browser.close();
report();
process.exit(failures === 0 ? 0 : 1);
