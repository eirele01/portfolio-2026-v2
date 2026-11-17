// [SCR-13 / v1-2] Every pointer scrubs — touch video joins the scroll engine.
//
// Verifies, on a 390x844 hasTouch context in story mode, that the phase and
// transition clips now follow scroll like on desktop (the old coarse-pointer
// play-once fallback is gone):
//   M1  phase-1 video follows scroll FORWARD (currentTime tracks pin progress)
//   M2  …and scrubs BACK in reverse
//   M3  idle = frozen frame + paused (no autoplay of any kind)
//   M4  a slow real-finger touch drag advances the clip monotonically
//   M5  the transition clip (t1-2) scrubs too
//   D1/D2  desktop 1440x900: same forward/reverse/idle-hold (regression)
//   D3  desktop wheel still scrubs the page (sanity)
//   L1  lite: no canvas at all, touch scroll native
//   S1  static: loads clean, no canvas
//
// Run: node scripts/verify-touch-scrub.mjs   (dev server on :3000)
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
  await page.waitForTimeout(1200);
}

/** Scroll target + height of a stage's pin-spacer (ScrollTrigger wraps it). */
async function pinGeo(page, sel) {
  return page.evaluate((sel) => {
    const sec = document.querySelector(sel);
    if (!sec) return null;
    const outer = sec.parentElement ?? sec; // pin-spacer
    return {
      top: outer.getBoundingClientRect().top + window.scrollY,
      h: outer.offsetHeight,
    };
  }, sel);
}

/** currentTime/paused/duration of a canvas segment's <video>. */
async function vstate(page, key) {
  return page.evaluate((key) => {
    const v = document.querySelector(`div[data-canvas-segment="${key}"] video`);
    if (!v) return null;
    return { t: v.currentTime, dur: v.duration || 0, paused: v.paused };
  }, key);
}

async function settleAt(page, y) {
  await page.evaluate((y) => window.scrollTo(0, Math.round(y)), y);
  await page.waitForTimeout(1300); // rate-assist converge + seek watchdog settle
}

/** Wait until a segment's video element exists and reports a duration. */
async function waitVideo(page, key) {
  await page.waitForFunction(
    (key) => {
      const v = document.querySelector(`div[data-canvas-segment="${key}"] video`);
      return !!v && !!v.duration;
    },
    key,
    { timeout: 30000 },
  );
}

/* ---------- M1-M5: story mode on a phone ---------- */
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

  const geo = await pinGeo(page, 'section[data-phase="1"]');
  if (!geo) {
    record("M1 phase-1 video follows scroll", false, "phase-1 section not found");
  } else {
    await waitVideo(page, "p1");

    // M1 forward: 12% -> 42% of the pin spacer. NOTE: spacer height =
    // section (100svh) + pin length, so timeline progress ≈ fraction ×
    // (1 + sectionH/pinLength) — small fractions stay inside the pin for
    // every stage (pin length ≥ 150svh on mobile).
    await settleAt(page, geo.top + geo.h * 0.12);
    const a = await vstate(page, "p1");
    const syA = await page.evaluate(() => window.scrollY);
    await settleAt(page, geo.top + geo.h * 0.42);
    const b = await vstate(page, "p1");
    const fwdOk =
      a && b && b.dur > 1 &&
      b.t - a.t > b.dur * 0.15;
    record(
      "M1 phase-1 video follows scroll forward",
      fwdOk,
      `scrollY ${Math.round(syA)}->${Math.round(await page.evaluate(() => window.scrollY))}, currentTime ${a ? a.t.toFixed(2) : "?"}s -> ${b ? b.t.toFixed(2) : "?"}s of ${b ? b.dur.toFixed(1) : "?"}s clip`,
    );

    // M2 reverse: back to 12%
    await settleAt(page, geo.top + geo.h * 0.12);
    const c = await vstate(page, "p1");
    const revOk = c && b && c.t < b.t - b.dur * 0.15;
    record(
      "M2 phase-1 video scrubs in reverse",
      revOk,
      `back to ${c ? c.t.toFixed(2) : "?"}s (from ${b ? b.t.toFixed(2) : "?"}s) — reversible, not a one-way play`,
    );

    // M3 idle: no autoplay — frame frozen, video paused
    await settleAt(page, geo.top + geo.h * 0.4);
    const i1 = await vstate(page, "p1");
    await page.waitForTimeout(1000);
    const i2 = await vstate(page, "p1");
    const idleOk =
      i1 && i2 && Math.abs(i2.t - i1.t) < 0.06 && i2.paused;
    record(
      "M3 idle holds the frame, paused (no autoplay)",
      idleOk,
      `Δ ${(i1 && i2 ? Math.abs(i2.t - i1.t) : 9).toFixed(3)}s over 1s idle, paused=${i2 ? i2.paused : "?"}`,
    );

    // M4 slow real-finger drag advances the clip monotonically
    const cdp = await ctx.newCDPSession(page);
    await settleAt(page, geo.top + geo.h * 0.3);
    const samples = [];
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
      await page.waitForTimeout(120);
      const s = await vstate(page, "p1");
      if (s) samples.push(s.t);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(900); // let any release glide finish before M5
    const steps = [];
    let mono = true;
    for (let i = 1; i < samples.length; i++) {
      steps.push(samples[i] - samples[i - 1]);
      if (samples[i] < samples[i - 1] - 0.05) mono = false;
    }
    const total = samples.length ? samples[samples.length - 1] - samples[0] : 0;
    record(
      "M4 finger drag scrubs the clip",
      samples.length === 5 && mono && total > 0.3,
      `clip seconds after each 40px step: ${samples.map((s) => s.toFixed(2)).join(", ")} (total +${total.toFixed(2)}s)`,
    );

    // M5 the transition clip scrubs too
    const tSel = 'section[data-transition]';
    const tGeo = await pinGeo(page, tSel);
    if (tGeo) {
      await settleAt(page, tGeo.top + tGeo.h * 0.25);
      const tKey = await page.evaluate(() => {
        const el = document.querySelector('div[data-canvas-segment^="t"]');
        return el ? el.getAttribute("data-canvas-segment") : null;
      });
      if (tKey) {
        await waitVideo(page, tKey);
        await settleAt(page, tGeo.top + tGeo.h * 0.1);
        const t1 = await vstate(page, tKey);
        await settleAt(page, tGeo.top + tGeo.h * 0.3);
        const t2 = await vstate(page, tKey);
        const ok = t1 && t2 && t2.dur > 0.5 && t2.t - t1.t > t2.dur * 0.15;
        record(
          "M5 transition clip scrubs by scroll",
          ok,
          `${tKey}: ${t1 ? t1.t.toFixed(2) : "?"}s -> ${t2 ? t2.t.toFixed(2) : "?"}s of ${t2 ? t2.dur.toFixed(1) : "?"}s (spacer fractions 0.1->0.3, always inside the pin)`,
        );
      } else {
        record("M5 transition clip scrubs by scroll", false, "no mounted transition layer");
      }
    } else {
      record("M5 transition clip scrubs by scroll", false, "no transition section");
    }
  }
  await ctx.close();
}

/* ---------- D1-D3: desktop regression (fine pointer) ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  watch(page, "desktop");
  await page.goto(`${BASE}/?mode=story`, { waitUntil: "domcontentloaded" });
  await waitLoaded(page);
  const geo = await pinGeo(page, 'section[data-phase="1"]');
  if (!geo) {
    record("D1 desktop phase-1 scrub forward", false, "phase-1 section not found");
  } else {
    await waitVideo(page, "p1");
    await settleAt(page, geo.top + geo.h * 0.12);
    const a = await vstate(page, "p1");
    await settleAt(page, geo.top + geo.h * 0.42);
    const b = await vstate(page, "p1");
    const ok =
      a && b && b.dur > 1 && b.t - a.t > b.dur * 0.15;
    record(
      "D1 desktop phase-1 scrub forward (regression)",
      ok,
      `currentTime ${a ? a.t.toFixed(2) : "?"}s -> ${b ? b.t.toFixed(2) : "?"}s of ${b ? b.dur.toFixed(1) : "?"}s`,
    );
    await settleAt(page, geo.top + geo.h * 0.12);
    const c = await vstate(page, "p1");
    await page.waitForTimeout(1000);
    const c2 = await vstate(page, "p1");
    const okIdle =
      c && c2 && c.t < b.t - b.dur * 0.15 && Math.abs(c2.t - c.t) < 0.06 && c2.paused;
    record(
      "D2 desktop reverse + idle hold (regression)",
      okIdle,
      `reverse back to ${c ? c.t.toFixed(2) : "?"}s, idle Δ ${c && c2 ? Math.abs(c2.t - c.t).toFixed(3) : "?"}s, paused=${c2 ? c2.paused : "?"}`,
    );
  }
  const y0 = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(700);
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(1500);
  const y1 = await page.evaluate(() => window.scrollY);
  record(
    "D3 desktop wheel scrub still moves",
    y1 - y0 > 600,
    `scrollY +${Math.round(y1 - y0)} px after two 900px wheel ticks`,
  );
  await ctx.close();
}

/* ---------- L1: lite — no canvas, native touch ---------- */
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
  const canvasCount = await page.evaluate(
    () => document.querySelectorAll("div[data-canvas-segment]").length,
  );
  const y0 = await page.evaluate(() => window.scrollY);
  const cdp = await ctx.newCDPSession(page);
  const mv = [];
  let y = 720;
  for (let i = 0; i < 4; i++) {
    y -= 80;
    mv.push({ y });
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 195, y, id: 1 }],
  });
  for (const m of mv) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 195, y: m.y, id: 1 }],
    });
    await page.waitForTimeout(30);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(500);
  const y1 = await page.evaluate(() => window.scrollY);
  record(
    "L1 lite: no canvas, native touch scroll",
    canvasCount === 0 && y1 - y0 > 200,
    `canvas segments: ${canvasCount}, scrollY +${Math.round(y1 - y0)} px for a 320 px drag`,
  );
  await ctx.close();
}

/* ---------- S1: static — loads clean, no canvas ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  watch(page, "static");
  await page.goto(`${BASE}/?mode=static`, { waitUntil: "domcontentloaded" });
  await waitLoaded(page);
  await page.waitForTimeout(600);
  const canvasCount = await page.evaluate(
    () => document.querySelectorAll("div[data-canvas-segment]").length,
  );
  const bodyText = await page.evaluate(() => document.body.innerText.length);
  record(
    "S1 static: loads clean, no canvas",
    canvasCount === 0 && bodyText > 200,
    `canvas segments: ${canvasCount}, body text ${bodyText} chars`,
  );
  await ctx.close();
}

await browser.close();

console.log("\n--- console/page errors ---");
console.log(errors.length ? errors.join("\n") : "(none)");
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length || errors.length ? 1 : 0);
