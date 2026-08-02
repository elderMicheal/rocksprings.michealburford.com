import { expect, test } from "@playwright/test";

test.describe("interactive presentation scene", () => {
  test("loads the validated model and enables controls", async ({ page }, testInfo) => {
    await page.goto("/");

    const runtime = page.locator("[data-scene-phase]");
    await expect(runtime).toHaveAttribute("data-scene-phase", "ready", { timeout: 20_000 });
    await expect(page.locator(".scene-canvas")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset view" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Replay descent" })).toBeEnabled();
    const viewpoint = page.getByRole("combobox", { name: "Town viewpoint" });
    await expect(viewpoint).toBeEnabled();
    await expect(viewpoint.locator("option")).toHaveCount(8);
    await expect(page.locator(".scene-label")).toHaveCount(0);
    await page.getByRole("button", { name: "Enter the view" }).click();
    await expect(page.locator(".exhibit-scene")).toHaveClass(/scene-entered/);
    await expect(page.locator(".scene-copy")).toBeHidden();

    if (process.env.RSC_CAPTURE_SCENE === "1") {
      await viewpoint.selectOption("Camera_Town_Overview");
      await page.waitForTimeout(1_000);
      await page.locator(".scene-canvas").screenshot({
        animations: "disabled",
        path: testInfo.outputPath("authored-town-overview-canvas.png"),
      });
    }

    await viewpoint.selectOption("Camera_Abby_POV");
    await expect(runtime).toHaveAttribute("data-scene-view", "Camera_Abby_POV");

    if (process.env.RSC_CAPTURE_SCENE === "1") {
      await page.waitForTimeout(1_000);
      await page.locator(".exhibit-scene").screenshot({
        animations: "disabled",
        path: testInfo.outputPath("authored-abby-view.png"),
      });
      await viewpoint.selectOption("Camera_Chalmers_Route");
      await page.waitForTimeout(1_000);
      await page.locator(".exhibit-scene").screenshot({
        animations: "disabled",
        path: testInfo.outputPath("authored-chalmers-view.png"),
      });
      await viewpoint.selectOption("Camera_Parade_Staging");
      await page.waitForTimeout(1_000);
      await page.locator(".exhibit-scene").screenshot({
        animations: "disabled",
        path: testInfo.outputPath("authored-parade-staging-view.png"),
      });
      const diagnosticStyle = await page.addStyleTag({
        content: `
          .scene-shade,
          .scene-copy,
          .scene-status,
          .scene-controls,
          .scene-load-status { visibility: hidden !important; }
        `,
      });
      await page.locator(".scene-canvas").screenshot({
        animations: "disabled",
        path: testInfo.outputPath("authored-parade-staging-canvas.png"),
      });
      await diagnosticStyle.evaluate((style) => {
        style.parentNode?.removeChild(style);
      });
    }

    await page.getByRole("button", { name: "Replay descent" }).click();
    await expect(runtime).toHaveAttribute("data-auto-motion", "playing");

    if (process.env.RSC_CAPTURE_SCENE === "1") {
      await expect(runtime).toHaveAttribute("data-auto-motion", "completed", { timeout: 10_000 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        animations: "disabled",
        fullPage: false,
        path: testInfo.outputPath("live-scene.png"),
      });
    }

    await page.getByRole("button", { name: "Reset view" }).click();
  });

  test("enters an unobstructed view and supports full screen", async ({ page }, testInfo) => {
    await page.goto("/");

    const runtime = page.locator("[data-scene-phase]");
    await expect(runtime).toHaveAttribute("data-scene-phase", "ready", { timeout: 20_000 });
    await page.getByRole("button", { name: "Enter the view" }).click();
    await expect(page.locator(".scene-copy")).toBeHidden();

    const fullscreenButton = page.getByRole("button", { name: "Full screen" });
    await expect(fullscreenButton).toBeEnabled();
    await fullscreenButton.click();
    await expect(runtime).toHaveAttribute("data-fullscreen", "true");
    await expect(page.getByRole("button", { name: "Exit full screen" })).toBeVisible();
    if (process.env.RSC_CAPTURE_SCENE === "1") {
      await page.screenshot({
        animations: "disabled",
        path: testInfo.outputPath("full-screen-town-view.png"),
      });
    }

    await page.getByRole("button", { name: "Exit full screen" }).click();
    await expect(runtime).toHaveAttribute("data-fullscreen", "false");
    await expect(page.getByRole("button", { name: "Full screen" })).toBeVisible();
  });

  test("skips automatic descent when reduced motion is requested", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const runtime = page.locator("[data-scene-phase]");
    await expect(runtime).toHaveAttribute("data-scene-phase", "ready", { timeout: 20_000 });
    await expect(runtime).toHaveAttribute("data-auto-motion", "skipped");
  });

  test("keeps a neutral fallback when the model cannot load", async ({ page }) => {
    await page.route("**/rock-springs-jackies-window.glb", (route) => route.abort());
    await page.goto("/");

    const runtime = page.locator("[data-scene-phase]");
    await expect(runtime).toHaveAttribute("data-scene-phase", "error", { timeout: 20_000 });
    await expect(page.locator(".scene-fallback")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset view" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Replay descent" })).toBeDisabled();
    await expect(page.getByRole("combobox", { name: "Town viewpoint" })).toBeDisabled();
  });
});
