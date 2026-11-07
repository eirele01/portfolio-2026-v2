// [SCR-12] Touch verification: Lenis syncTouch on a real-phone-like context.
//
// Measures, on a 390x844 hasTouch context in story mode:
//   A) finger drag tracks the page 1:1 (scrollY ≈ cumulative finger travel)
//   B) release glide is bounded (native OS fling ≈ 3,000-6,000+ px per
//      flick; the damped glide must stay well under ~1,500 px even for a
//      violent synthetic flick)
//   C) the mobile card snap-row still swipes natively (data-lenis-prevent)
//   D) the chat panel list still scrolls natively, page untouched
//   E) lite mode still scrolls natively (engine is destroyed there)
//   F) desktop wheel story scrub still works (1440x900, no touch)
//
// Run: node scripts/verify-touch.mjs   (dev server on :3000)
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const errors = [];
const results = [];
const browser = await chromium.launch();

function watch(page, tag) {
  page.on("pageerror", (e) => errors.push(`[${tag}] pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[${tag}] console: ${m.text()}`);
  });
}

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name} — ${detail}`);
}

async function waitLoaded(page) {
  await page.waitForFunction(
    () => {
      const el = document.querySelector('div[role="status"]');
      return !el || el.getAttribute("aria-label") === "Loading complete";
    },
    { timeout: 90000 },
  );
  await page.waitForTimeout(1200); // loader fade-out + scroll unlock
}

async function touchSeq(cdp, startY, moves, gapMs, x) {
  // moves: array of {x?, y} finger positions after the start point
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y: startY, id: 1 }],
  });
  for (const m of moves) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: m.x ?? x, y: m.y, id: 1 }],
    });
    await new Promise((r) => setTimeout(r, gapMs));
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

/* ---------- A/B: story mode on a phone ---------- */
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  watch(page, "story-touch");
  await page.goto(`${BASE}/?mode=story`, { waitUntil: "domcontentloaded" });
  await waitLoaded(page);

  const cdp = await ctx.newCDPSession(page);

  // --- A: drag 1:1 ---
  await page.evaluate(() => window.scrollTo(0, Math.round(window.innerHeight * 3.2)));
  await page.waitForTimeout(800);
  const dragSamples = [];
  let fy = 700;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 195, y: fy, id: 1 }],
  });
  for (let i = 0; i < 5; i++) {
    fy -= 40;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 195, y: fy, id: 1 }],
    });
    await page.waitForTimeout(45);
    dragSamples.push(await page.evaluate(() => window.scrollY));
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(1500);

  const stepDelta = [];
  for (let i = 1; i < dragSamples.length; i++)
    stepDelta.push(dragSamples[i] - dragSamples[i - 1]);
  const avgStep = stepDelta.reduce((a, b) => a + b, 0) / stepDelta.length;
  const drag1to1 =
    dragSamples[0] > 0 && avgStep > 25 && avgStep < 60; // ≈40px per 40px move
  record(
    "A drag tracks finger 1:1",
    drag1to1,
    `cumulative scroll steps ≈ ${stepDelta.map((d) => Math.round(d)).join(", ")} px per 40px finger step`,
  );

  // --- B1: gentle reading swipe — rapid move burst (real phones stream
  // touchmoves 8-16ms apart; CDP round-trips stretch gaps, and a gap > ~40ms
  // lets Lenis's per-move animation COMPLETE, zeroing release velocity)
  await page.evaluate(() => window.scrollTo(0, Math.round(window.innerHeight * 2.0)));
  await page.waitForTimeout(900);
  const b1Before = await page.evaluate(() => window.scrollY);
  const moves1 = [];
  let y = 780;
  for (let i = 0; i < 8; i++) {
    y -= 28;
    moves1.push({ y });
  }
  await touchSeq(cdp, 780, moves1, 8, 195);
  await page.waitForTimeout(120);
  const b1AfterDrag = await page.evaluate(() => window.scrollY);
  let b1Max = b1AfterDrag;
  for (let i = 0; i < 22; i++) {
    await page.waitForTimeout(100);
    b1Max = Math.max(b1Max, await page.evaluate(() => window.scrollY));
  }
  const b1Drag = b1AfterDrag - b1Before;
  const b1Glide = b1Max - b1AfterDrag;
  record(
    "B1 gentle swipe: 1:1 + short tail",
    b1Drag > 140 && b1Glide < 400,
    `drag ${Math.round(b1Drag)} px (finger 224), glide ${Math.round(b1Glide)} px (native fling for this gesture ≈ 800-2,000)`,
  );

  // --- B2: hard flick — rapid burst, ~3,400 px/s finger speed ---
  await page.evaluate(() => window.scrollTo(0, Math.round(window.innerHeight * 2.0)));
  await page.waitForTimeout(900);
  const b2Before = await page.evaluate(() => window.scrollY);
  const moves2 = [];
  y = 800;
  for (let i = 0; i < 8; i++) {
    y -= 42;
    moves2.push({ y });
  }
  await touchSeq(cdp, 800, moves2, 8, 195);
  await page.waitForTimeout(120);
  const b2AfterDrag = await page.evaluate(() => window.scrollY);
  let b2Max = b2AfterDrag;
  for (let i = 0; i < 26; i++) {
    await page.waitForTimeout(100);
    b2Max = Math.max(b2Max, await page.evaluate(() => window.scrollY));
  }
  const b2Drag = b2AfterDrag - b2Before;
  const b2Glide = b2Max - b2AfterDrag;
  record(
    "B2 hard flick glide is bounded",
    b2Drag > 250 && b2Glide < 1200,
    `drag ${Math.round(b2Drag)} px (finger 336), glide ${Math.round(b2Glide)} px (native OS fling ≈ 3,000-6,000+)`,
  );

  // --- C: mobile card snap-row keeps native touch ---
  // The row lives inside a pinned phase; jump to ~55% of ITS pin so the
  // cards beat is actually visible (beats fade in/out on the stage timeline).
  const row = page
    .locator("div.no-scrollbar.snap-x.snap-mandatory.overflow-x-auto")
    .first();
  const hasRow = (await row.count()) > 0;
  if (hasRow) {
    const info = await page.evaluate(() => {
      const r = document.querySelector(
        "div.no-scrollbar.snap-x.snap-mandatory.overflow-x-auto",
      );
      if (!r) return null;
      const sec = r.closest("section[data-phase]");
      const spacer = sec?.parentElement; // pin-spacer added by ScrollTrigger
      if (!sec || !spacer) return null;
      return {
        top: spacer.getBoundingClientRect().top + window.scrollY,
        h: spacer.offsetHeight,
      };
    });
    if (info) {
      await page.evaluate(
        (i) => window.scrollTo(0, Math.round(i.top + i.h * 0.55)),
        info,
      );
      await page.waitForTimeout(1000);
    }
    const box = await row.boundingBox();
    if (box && box.y > -50 && box.y + box.height < 900) {
      const cy = box.y + box.height / 2;
      const sl0 = await row.evaluate((el) => el.scrollLeft);
      const sy0 = await page.evaluate(() => window.scrollY);
      const cm = [];
      const startX = box.x + box.width * 0.8;
      let cx = startX;
      for (let i = 0; i < 4; i++) {
        cx -= 55;
        cm.push({ x: cx, y: cy + i * 2 });
      }
      await touchSeq(cdp, cy, cm, 35, startX);
      await page.waitForTimeout(700);
      const sl1 = await row.evaluate((el) => el.scrollLeft);
      const sy1 = await page.evaluate(() => window.scrollY);
      record(
        "C card snap-row swipes natively",
        sl1 - sl0 > 40 && Math.abs(sy1 - sy0) < 14,
        `scrollLeft +${Math.round(sl1 - sl0)} px, page scrollY Δ ${Math.round(sy1 - sy0)} px`,
      );
    } else {
      record("C card snap-row swipes natively", false, "no bounding box (not in view)");
    }
  } else {
    record("C card snap-row swipes natively", true, "no cards beat rendered in this story — skipped");
  }

  // --- D: chat panel list scrolls natively ---
  try {
    await page.getByRole("button", { name: /chat with the portfolio assistant/i }).click();
    await page.waitForSelector('[aria-label="Portfolio assistant chat"]', { timeout: 5000 });
    // seed enough replies that the list overflows
    for (const q of ["What has Eirele built?", "What is his experience?", "How can I contact him?"]) {
      await page.getByLabel("Your message").fill(q);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1800);
    }
    const list = page.locator(".chat-scroll");
    const overflow = await list.evaluate(
      (el) => el.scrollHeight - el.clientHeight,
    );
    const st0 = await list.evaluate((el) => el.scrollTop);
    const wy0 = await page.evaluate(() => window.scrollY);
    const lbox = await list.boundingBox();
    if (lbox && overflow > 20) {
      // the list auto-scrolls to the bottom on each reply — swipe DOWN
      // (finger +y, i.e. back into history); an upward swipe would push
      // past the bottom edge and native scroll-chaining moves the page.
      const dm = [];
      const dy0 = lbox.y + lbox.height * 0.7;
      let dy = dy0;
      for (let i = 0; i < 4; i++) {
        dy += 45;
        dm.push({ y: dy });
      }
      await touchSeq(cdp, dy0, dm, 35, lbox.x + lbox.width / 2);
      await page.waitForTimeout(700);
      const st1 = await list.evaluate((el) => el.scrollTop);
      const wy1 = await page.evaluate(() => window.scrollY);
      record(
        "D chat list scrolls, page still",
        Math.abs(st1 - st0) > 20 && Math.abs(wy1 - wy0) < 14,
        `list scrollTop Δ ${Math.round(st1 - st0)} px, page scrollY Δ ${Math.round(wy1 - wy0)} px`,
      );
    } else {
      record(
        "D chat list scrolls, page still",
        false,
        `list overflow ${overflow} px${lbox ? "" : " / box not visible"} — not scrollable`,
      );
    }
    await page.getByRole("button", { name: "Close chat" }).click().catch(() => {});
  } catch (e) {
    record("D chat list scrolls, page still", false, `setup failed: ${e.message.split("\n")[0]}`);
  }

  await ctx.close();
}

/* ---------- E: lite mode — native scroll preserved ---------- */
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  watch(page, "lite-touch");
  await page.goto(`${BASE}/?mode=lite`, { waitUntil: "domcontentloaded" });
  await waitLoaded(page);
  await page.waitForTimeout(800);
  const y0 = await page.evaluate(() => window.scrollY);
  const cdp = await ctx.newCDPSession(page);
  const mv = [];
  let y = 720;
  for (let i = 0; i < 4; i++) {
    y -= 80;
    mv.push({ y });
  }
  await touchSeq(cdp, 720, mv, 30, 195);
  await page.waitForTimeout(500);
  const y1 = await page.evaluate(() => window.scrollY);
  record(
    "E lite mode touch scroll works",
    y1 - y0 > 200,
    `scrollY +${Math.round(y1 - y0)} px for a 320 px drag (native, engine destroyed in lite)`,
  );
  await ctx.close();
}

/* ---------- F: desktop wheel smoke (no touch) ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  watch(page, "desktop-wheel");
  await page.goto(`${BASE}/?mode=story`, { waitUntil: "domcontentloaded" });
  await waitLoaded(page);
  const y0 = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(700);
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(2000);
  const y1 = await page.evaluate(() => window.scrollY);
  record(
    "F desktop wheel scrub works",
    y1 - y0 > 600,
    `scrollY +${Math.round(y1 - y0)} px after two 900px wheel ticks (eased, duration 1.15)`,
  );
  await ctx.close();
}

await browser.close();

console.log("\n--- console/page errors ---");
console.log(errors.length ? errors.join("\n") : "(none)");
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length || errors.length ? 1 : 0);
