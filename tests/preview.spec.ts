import { expect, test } from "@playwright/test";

test("published game creates a visible canvas", async ({ page }) => {
  const messages: string[] = [];
  page.on("console", (message) => {
    messages.push(`[console:${message.type()}] ${message.text()}`);
  });
  page.on("pageerror", (error) => {
    messages.push(`[pageerror] ${error.stack ?? error.message}`);
  });

  const response = await page.goto(
    "https://osiksq.github.io/deepcore-bastion-preview/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(8_000);

  const runtime = await page.evaluate(() => ({
    title: document.title,
    rootChildren: document.getElementById("game-root")?.childElementCount ?? -1,
    canvasCount: document.querySelectorAll("canvas").length,
    sdkEnvironment: window.CrazyGames?.SDK?.environment ?? "missing"
  }));
  console.log("RUNTIME_DIAGNOSTICS", JSON.stringify({ response: response?.status(), runtime, messages }));

  await expect(page.locator("canvas")).toBeVisible();
});
