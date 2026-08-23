import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "The Rock Springs Chronicles", level: 1 }),
  ).toBeVisible();
  await expect(page.locator(".front-top-story")).toBeVisible();
  await expect(page.locator(".front-map-exhibit")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open 3D map" })).toBeVisible();
});

test("contains the locked front page inside its intentional scroll surface", async ({
  page,
}) => {
  const layout = await page.evaluate(() => {
    const documentWidth = document.documentElement.clientWidth;
    const scrollSurface = document.querySelector(".front-page-scroll");
    const frame = document.querySelector(".front-page-outer-frame");
    const grid = document.querySelector(".front-page-grid");
    if (!scrollSurface || !frame || !grid) throw new Error("Front-page structure is missing");

    return {
      documentOverflow: document.documentElement.scrollWidth - documentWidth,
      scrollClientWidth: scrollSurface.clientWidth,
      scrollWidth: scrollSurface.scrollWidth,
      frameWidth: frame.getBoundingClientRect().width,
      gridColumns: getComputedStyle(grid).gridTemplateColumns,
    };
  });

  expect(layout.documentOverflow).toBeLessThanOrEqual(1);
  expect(layout.scrollWidth).toBeGreaterThanOrEqual(layout.scrollClientWidth);
  expect(layout.frameWidth).toBeGreaterThan(0);
  expect(layout.gridColumns.trim().split(/\s+/)).toHaveLength(12);
});

test("keeps the source-derived map legible at each viewport", async ({ page }) => {
  const map = page.locator(".town-map");
  const mapBox = await map.boundingBox();
  expect(mapBox).not.toBeNull();
  expect(mapBox?.width ?? 0).toBeGreaterThan(200);
  expect(mapBox?.height ?? 0).toBeGreaterThan(150);

  await expect(page.locator(".map-road-main-street")).toHaveCount(1);
  await expect(page.locator(".map-road-broad-street")).toHaveCount(1);
  await expect(page.locator(".map-marker")).toHaveCount(16);
});

test("matches the approved responsive front-page baseline", async ({ page }) => {
  test.skip(process.platform !== "win32", "Reviewed screenshot baselines are Windows-specific.");
  await expect(page).toHaveScreenshot("chronicle-front-page.png", {
    fullPage: true,
    timeout: 15_000,
  });
});
