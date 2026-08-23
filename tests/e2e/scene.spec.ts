import { expect, test } from "@playwright/test";

test.describe("interactive presentation scene", () => {
  test("loads the current validated model and exposes the authored viewpoints", async ({ page }, testInfo) => {
    await page.goto("/map");

    const runtime = page.locator("[data-scene-phase]");
    await expect(runtime).toHaveAttribute("data-scene-phase", "ready", { timeout: 20_000 });
    await expect(page.locator(".scene-canvas")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset view" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Replay descent" })).toBeEnabled();
    const viewpoint = page.getByRole("combobox", { name: "Town viewpoint" });
    await expect(viewpoint).toBeEnabled();
    await expect(viewpoint.locator("option")).toHaveCount(10);
    await expect(page.locator(".scene-label")).toHaveCount(0);

    await viewpoint.selectOption("Camera_Abby_POV");
    await expect(runtime).toHaveAttribute("data-scene-view", "Camera_Abby_POV");
    await viewpoint.selectOption("Camera_Southside_Industrial");
    await expect(runtime).toHaveAttribute("data-scene-view", "Camera_Southside_Industrial");
    await viewpoint.selectOption("Camera_Eastside_Diner");
    await expect(runtime).toHaveAttribute("data-scene-view", "Camera_Eastside_Diner");

    if (process.env.RSC_CAPTURE_SCENE === "1") {
      await page.waitForTimeout(1_000);
      await page.locator(".scene-canvas").screenshot({
        animations: "disabled",
        path: testInfo.outputPath("current-eastside-diner-canvas.png"),
      });
    }

    await page.getByRole("button", { name: "Replay descent" }).click();
    await expect(runtime).toHaveAttribute("data-auto-motion", "playing");
    await page.getByRole("button", { name: "Reset view" }).click();
  });

  test("supports full screen on the dedicated map surface", async ({ page }) => {
    await page.goto("/map");
    const runtime = page.locator("[data-scene-phase]");
    await expect(runtime).toHaveAttribute("data-scene-phase", "ready", { timeout: 20_000 });

    const fullscreenButton = page.getByRole("button", { name: "Full screen" });
    if (await fullscreenButton.isDisabled()) test.skip(true, "Fullscreen API is unavailable in this browser environment");
    await fullscreenButton.click();
    await expect(runtime).toHaveAttribute("data-fullscreen", "true");
    await expect(page.getByRole("button", { name: "Exit full screen" })).toBeVisible();
    await page.getByRole("button", { name: "Exit full screen" }).click();
    await expect(runtime).toHaveAttribute("data-fullscreen", "false");
  });

  test("skips automatic descent when reduced motion is requested", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/map");
    const runtime = page.locator("[data-scene-phase]");
    await expect(runtime).toHaveAttribute("data-scene-phase", "ready", { timeout: 20_000 });
    await expect(runtime).toHaveAttribute("data-auto-motion", "skipped");
  });

  test("keeps a neutral fallback when the model cannot load", async ({ page }) => {
    await page.route("**/rock-springs-jackies-window.glb", (route) => route.abort());
    await page.goto("/map");
    const runtime = page.locator("[data-scene-phase]");
    await expect(runtime).toHaveAttribute("data-scene-phase", "error", { timeout: 20_000 });
    await expect(page.locator(".scene-fallback")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset view" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Replay descent" })).toBeDisabled();
    await expect(page.getByRole("combobox", { name: "Town viewpoint" })).toBeDisabled();
  });
});
