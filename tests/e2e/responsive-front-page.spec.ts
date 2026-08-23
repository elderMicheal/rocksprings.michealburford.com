import { expect, test } from "@playwright/test";

const keyRegions = [
  ".rsc-front-page",
  ".front-page-scroll",
  ".front-page-outer-frame",
  ".front-page-inner-frame",
  ".front-page-grid",
  ".front-masthead",
  ".front-top-story",
  ".front-map-exhibit",
  ".map-panel",
  ".front-introduction",
];

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".front-masthead h1")).toHaveText("The Rock Springs Chronicles");
  await expect(page.locator(".front-map-exhibit .map-panel")).toBeVisible();
});

test("keeps the locked newspaper composition contained by its scroll surface", async ({ page }, testInfo) => {
  const layout = await page.evaluate((selectors) => {
    const viewportWidth = document.documentElement.clientWidth;
    const documentOverflow = document.documentElement.scrollWidth - viewportWidth;
    const scroll = document.querySelector<HTMLElement>(".front-page-scroll")!;
    const frame = document.querySelector<HTMLElement>(".front-page-outer-frame")!;
    const regions = selectors.map((selector) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return { selector, missing: true };
      const box = element.getBoundingClientRect();
      return { selector, width: Math.round(box.width), height: Math.round(box.height) };
    });

    return {
      viewportWidth,
      documentOverflow,
      scrollClientWidth: scroll.clientWidth,
      scrollWidth: scroll.scrollWidth,
      frameWidth: frame.getBoundingClientRect().width,
      regions,
    };
  }, keyRegions);

  expect(layout.documentOverflow, JSON.stringify(layout, null, 2)).toBeLessThanOrEqual(1);
  for (const region of layout.regions) {
    expect("missing" in region, JSON.stringify(region)).toBe(false);
    if ("width" in region) {
      expect(region.width, `${region.selector} has no width`).toBeGreaterThan(0);
      expect(region.height, `${region.selector} has no height`).toBeGreaterThan(0);
    }
  }

  if (testInfo.project.name === "mobile") {
    expect(layout.frameWidth).toBeGreaterThan(layout.viewportWidth);
    expect(layout.scrollWidth).toBeGreaterThan(layout.scrollClientWidth);
  } else {
    expect(layout.frameWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  }
});

test("keeps current front-page map controls and source actions usable", async ({ page }) => {
  const mapLink = page.getByRole("link", { name: "Open 3D map" });
  await expect(mapLink).toBeVisible();
  await expect(mapLink).toHaveAttribute("href", "/map");
  await expect(page.getByRole("link", { name: /Read Book 1, Part 1/i })).toHaveAttribute("href", "/read/jackies-window/part-1");
  await expect(page.locator(".town-map")).toBeVisible();
  await expect(page.locator(".map-marker")).toHaveCount(11);
  await expect(page.locator(".exhibit-scene")).toHaveCount(0);
});

test("maintains the reviewed front-page grid proportions", async ({ page }) => {
  const layout = await page.evaluate(() => {
    const grid = document.querySelector<HTMLElement>(".front-page-grid")!;
    const masthead = document.querySelector<HTMLElement>(".front-masthead")!;
    const map = document.querySelector<HTMLElement>(".front-map-exhibit")!;
    const story = document.querySelector<HTMLElement>(".front-top-story")!;
    const gridStyle = getComputedStyle(grid);
    return {
      columns: gridStyle.gridTemplateColumns.trim().split(/\s+/).length,
      rows: gridStyle.gridTemplateRows.trim().split(/\s+/).length,
      aspectRatio: grid.getBoundingClientRect().width / grid.getBoundingClientRect().height,
      mastheadHeight: masthead.getBoundingClientRect().height,
      mapHeight: map.getBoundingClientRect().height,
      storyHeight: story.getBoundingClientRect().height,
    };
  });

  expect(layout.columns).toBe(12);
  expect(layout.rows).toBe(5);
  expect(layout.aspectRatio).toBeCloseTo(596 / 674, 1);
  expect(layout.mastheadHeight).toBeGreaterThan(0);
  expect(layout.mapHeight).toBeGreaterThan(layout.storyHeight);
});
