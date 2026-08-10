import { expect, test } from "@playwright/test";

test("published game opens the Lobby and starts Iron Crust", async ({ page }) => {
  await page.addInitScript(() => {
    const target = window as typeof window & {
      __RUNTIME_ERRORS__?: unknown[];
    };
    target.__RUNTIME_ERRORS__ = [];

    window.addEventListener("error", (event) => {
      target.__RUNTIME_ERRORS__?.push({
        type: "error",
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        errorName:
          event.error instanceof Error ? event.error.name : typeof event.error,
        errorMessage:
          event.error instanceof Error ? event.error.message : String(event.error),
        stack: event.error instanceof Error ? event.error.stack : null
      });
    });
    window.addEventListener("unhandledrejection", (event) => {
      const reason = event.reason;
      target.__RUNTIME_ERRORS__?.push({
        type: "unhandledrejection",
        reasonName: reason instanceof Error ? reason.name : typeof reason,
        reasonMessage: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : null
      });
    });
  });

  const messages: string[] = [];
  page.on("console", (message) => {
    messages.push(`[console:${message.type()}] ${message.text()}`);
  });
  page.on("pageerror", (error) => {
    messages.push(
      `[pageerror] name=${error.name} message=${JSON.stringify(error.message)} stack=${JSON.stringify(error.stack)}`
    );
  });
  page.on("requestfailed", (request) => {
    messages.push(
      `[requestfailed] ${request.url()} ${request.failure()?.errorText ?? "unknown"}`
    );
  });

  const response = await page.goto(
    "https://osiksq.github.io/deepcore-bastion-preview/",
    { waitUntil: "networkidle" }
  );
  await page.waitForTimeout(3_000);

  const runtime = await page.evaluate(() => {
    const target = window as typeof window & {
      __RUNTIME_ERRORS__?: unknown[];
    };
    return {
      title: document.title,
      rootChildren: document.getElementById("game-root")?.childElementCount ?? -1,
      rootHtml: document.getElementById("game-root")?.innerHTML ?? "missing",
      canvasCount: document.querySelectorAll("canvas").length,
      sdkEnvironment: window.CrazyGames?.SDK?.environment ?? "missing",
      runtimeErrors: target.__RUNTIME_ERRORS__ ?? [],
      resources: performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
    };
  });
  console.log(
    "RUNTIME_DIAGNOSTICS",
    JSON.stringify({ response: response?.status(), runtime, messages })
  );

  await expect(page.locator("canvas")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Deepcore Bastion" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Start Iron Crust" }).click();
  await expect(page.locator(".lobby-overlay")).toBeHidden();
  const postStartErrors = await page.evaluate(() => {
    const target = window as typeof window & {
      __RUNTIME_ERRORS__?: unknown[];
    };
    return target.__RUNTIME_ERRORS__ ?? [];
  });
  expect(runtime.runtimeErrors).toEqual([]);
  expect(postStartErrors).toEqual([]);
  expect(
    messages.filter((message) => message.startsWith("[pageerror]"))
  ).toEqual([]);
});
