import { expect, test } from "@playwright/test";

const keyRegions = [
  ".chronicle-frame",
  ".edition-header",
  ".masthead",
  ".masthead h1",
  ".primary-navigation",
  ".front-page-primary",
  ".exhibit-scene",
  ".scene-controls",
  ".lead-story",
  ".lead-intro",
  ".lead-intro h2",
];

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("The Rock Springs Chronicles");
  await expect(
    page.getByText(
      "View spatial relationships stated in Part One, then read the source chapters.",
    ),
  ).toBeVisible();
});

test("keeps the full front page inside the viewport", async ({ page }) => {
  const overflow = await page.evaluate((selectors) => {
    const viewportWidth = document.documentElement.clientWidth;
    const documentOverflow = document.documentElement.scrollWidth - viewportWidth;
    const regions = selectors.map((selector) => {
      const element = document.querySelector(selector);
      if (!element) return { selector, missing: true };

      const box = element.getBoundingClientRect();
      return {
        selector,
        left: Math.round(box.left),
        right: Math.round(box.right),
        width: Math.round(box.width),
      };
    });

    return { viewportWidth, documentOverflow, regions };
  }, keyRegions);

  expect(overflow.documentOverflow, JSON.stringify(overflow, null, 2)).toBeLessThanOrEqual(1);

  for (const region of overflow.regions) {
    expect("missing" in region, JSON.stringify(region)).toBe(false);
    if ("left" in region) {
      expect(region.left, `${region.selector} crosses the left viewport edge`).toBeGreaterThanOrEqual(0);
      expect(region.right, `${region.selector} crosses the right viewport edge`).toBeLessThanOrEqual(
        overflow.viewportWidth + 1,
      );
    }
  }
});

test("uses readable controls and responsive layout modes", async ({ page }, testInfo) => {
  const navLinks = page.locator(".nav-links a");
  const linkCount = await navLinks.count();

  for (let index = 0; index < linkCount; index += 1) {
    const box = await navLinks.nth(index).boundingBox();
    expect(box?.height ?? 0, `Navigation item ${index + 1} is too short`).toBeGreaterThanOrEqual(44);
  }

  await expect(page.locator("[data-scene-phase]")).toHaveAttribute(
    "data-scene-phase",
    "ready",
    { timeout: 20_000 },
  );
  const sceneControls = page.locator(".scene-controls button, .scene-controls select");
  const sceneControlCount = await sceneControls.count();
  for (let index = 0; index < sceneControlCount; index += 1) {
    const box = await sceneControls.nth(index).boundingBox();
    expect(box?.height ?? 0, `Scene control ${index + 1} is too short`).toBeGreaterThanOrEqual(44);
  }

  const layout = await page.evaluate(() => ({
    primaryColumns: getComputedStyle(document.querySelector(".front-page-primary")!).gridTemplateColumns,
    leadColumns: getComputedStyle(document.querySelector(".lead-story")!).gridTemplateColumns,
    sceneHeight: document.querySelector(".exhibit-scene")!.getBoundingClientRect().height,
    sceneControls: document.querySelector(".scene-controls")!.getBoundingClientRect().toJSON(),
    sceneRect: document.querySelector(".exhibit-scene")!.getBoundingClientRect().toJSON(),
    viewportHeight: window.innerHeight,
    mastheadHeight: document.querySelector(".masthead h1")!.getBoundingClientRect().height,
    mastheadSize: Number.parseFloat(
      getComputedStyle(document.querySelector(".masthead h1")!).fontSize,
    ),
    headlineSize: Number.parseFloat(
      getComputedStyle(document.querySelector(".lead-intro h2")!).fontSize,
    ),
  }));

  expect(layout.sceneHeight).toBeLessThanOrEqual(layout.viewportHeight * 0.5 + 1);
  expect(layout.sceneControls.top).toBeGreaterThanOrEqual(layout.sceneRect.top - 1);
  expect(layout.sceneControls.bottom).toBeLessThanOrEqual(layout.sceneRect.bottom + 1);

  if (testInfo.project.name === "mobile") {
    expect(layout.primaryColumns.trim().split(/\s+/)).toHaveLength(1);
    expect(layout.leadColumns.trim().split(/\s+/)).toHaveLength(1);
    expect(layout.mastheadSize).toBeLessThanOrEqual(52);
    expect(layout.mastheadHeight).toBeLessThanOrEqual(layout.mastheadSize * 2.2);
    expect(layout.headlineSize).toBeLessThanOrEqual(56);
  } else if (testInfo.project.name === "tablet") {
    expect(layout.primaryColumns.trim().split(/\s+/)).toHaveLength(2);
    expect(layout.leadColumns.trim().split(/\s+/)).toHaveLength(1);
    expect(layout.mastheadSize).toBeLessThanOrEqual(64);
    expect(layout.mastheadHeight).toBeLessThanOrEqual(layout.mastheadSize * 2.2);
    expect(layout.headlineSize).toBeLessThanOrEqual(56);
  } else {
    expect(layout.primaryColumns.trim().split(/\s+/)).toHaveLength(3);
    expect(layout.leadColumns.trim().split(/\s+/)).toHaveLength(1);
    expect(layout.mastheadSize).toBeLessThanOrEqual(96);
    expect(layout.mastheadHeight).toBeLessThanOrEqual(layout.mastheadSize * 1.2);
    expect(layout.headlineSize).toBeLessThanOrEqual(64);
  }
});

test("matches the responsive exhibit baseline", async ({ page }, testInfo) => {
  await page.addStyleTag({
    content: `
      .town-scene-runtime .scene-canvas { opacity: 0 !important; }
      .town-scene-runtime .scene-fallback { opacity: 1 !important; }
      .scene-controls, .scene-load-status { visibility: hidden !important; }
    `,
  });
  if (process.env.RSC_CAPTURE_FALLBACK === "1") {
    await page.screenshot({
      animations: "disabled",
      fullPage: true,
      path: testInfo.outputPath("current-fallback.png"),
    });
  }
  await expect(page).toHaveScreenshot("chronicle-front-page.png", {
    fullPage: true,
    timeout: 15_000,
  });
});
