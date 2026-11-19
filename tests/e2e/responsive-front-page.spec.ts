import { expect, test } from "@playwright/test";
import publicationFixture from "../../src/content/generated/publication-package.json" with { type: "json" };

test.beforeEach(async ({ page }) => {
  await page.route("**/api/publication", (route) =>
    route.fulfill({ json: publicationFixture }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "The Rock Springs Chronicles",
      level: 1,
    }),
  ).toBeVisible();
});

test("keeps the public library responsive and the world exhibit in one grid", async ({
  page,
}) => {
  expect(await page.locator(".series-work").count()).toBeGreaterThan(0);
  await expect(page.getByRole("link", { name: "Open 3D map" })).toHaveAttribute(
    "href",
    "/map",
  );
  const geometry = await page.evaluate(() => {
    const map = document.querySelector(".map-panel")!.getBoundingClientRect();
    const copy = document.querySelector(".world-copy")!.getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth - innerWidth,
      mapTop: map.top,
      copyBottom: copy.bottom,
      width: innerWidth,
    };
  });
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  if (geometry.width > 760)
    expect(geometry.mapTop).toBeLessThan(geometry.copyBottom);
  await expect(page.locator(".map-marker")).toHaveCount(16);
});

test("matches the redesigned responsive front-page baseline", async ({
  page,
}) => {
  test.skip(
    process.platform !== "win32",
    "Reviewed screenshot baselines are Windows-specific.",
  );
  await expect(page).toHaveScreenshot("chronicle-front-page.png", {
    fullPage: true,
    timeout: 15000,
  });
});
