// Verify ModeHint appears under auto-degradation (reduced-motion) and
// one tap switches to story (videos appear). Run: node scripts/verify-hint.mjs
import { chromium } from "playwright";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  reducedMotion: "reduce", // simulates OS-level reduce motion → static mode
});
const page = await ctx.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

const hintVisible = await page.getByText("video story is off").isVisible().catch(() => false);
console.log("hint visible (auto static):", hintVisible);

if (hintVisible) {
  await page.screenshot({ path: "scripts/media/scratch/hint-static.png" });
  await page.getByRole("button", { name: "Watch with video" }).click();
  await page.waitForTimeout(2000);
  const videos = await page.locator("video").count();
  const hintGone = !(await page.getByText("video story is off").isVisible().catch(() => false));
  console.log("after switch → videos:", videos, "| hint gone:", hintGone);
}

await browser.close();
