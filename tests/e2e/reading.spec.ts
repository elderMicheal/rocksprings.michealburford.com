import { expect, test } from "@playwright/test";

const partOnePath = "/read/jackies-window/part-1";

test("lists the complete approved Part 1 sequence without horizontal overflow", async ({
  page,
}) => {
  await page.goto(partOnePath);

  await expect(page.locator(".reader-frame")).toHaveAttribute(
    "data-writing-revision",
    /^[0-9a-f]{40}$/,
  );
  await expect(page.getByRole("heading", { name: "Jackie's Window" })).toBeVisible();
  await expect(page.locator(".chapter-card")).toHaveCount(8);
  await expect(
    page.getByRole("link", { name: /Chapter 7.*Awaiting prose/ }),
  ).toBeVisible();

  const geometry = await page.evaluate(() => ({
    documentOverflow:
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
    hero: document.querySelector(".reader-hero")!.getBoundingClientRect().toJSON(),
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(geometry.documentOverflow).toBeLessThanOrEqual(1);
  expect(geometry.hero.left).toBeGreaterThanOrEqual(0);
  expect(geometry.hero.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
});

test("serves a readable chapter by direct refresh-safe URL", async ({ page }) => {
  await page.goto(`${partOnePath}/chapter-01`);

  await expect(page.getByRole("heading", { name: "Chapter 1" })).toBeVisible();
  expect(await page.locator(".chapter-prose p").count()).toBeGreaterThan(40);
  await expect(page.locator(".chapter-prose").getByText(/As the bells of St\. Thomas Cathedral/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Next.*Chapter 2/ })).toBeVisible();

  const readingGeometry = await page.locator(".chapter-prose").evaluate((element) => {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return {
      width: box.width,
      fontSize: Number.parseFloat(style.fontSize),
      lineHeight: Number.parseFloat(style.lineHeight),
      documentOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  expect(readingGeometry.width).toBeLessThanOrEqual(820);
  expect(readingGeometry.fontSize).toBeGreaterThanOrEqual(17);
  expect(readingGeometry.lineHeight / readingGeometry.fontSize).toBeGreaterThanOrEqual(1.7);
  expect(readingGeometry.documentOverflow).toBeLessThanOrEqual(1);
});

test("keeps an unfinished source chapter explicit and navigable", async ({ page }) => {
  await page.goto(`${partOnePath}/chapter-07`);

  await expect(
    page.getByRole("heading", { name: "Chapter 7", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Chapter 7 does not contain prose yet." }),
  ).toBeVisible();
  await expect(page.locator(".chapter-prose")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Previous.*Chapter 6/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Next.*Chapter 8/ })).toBeVisible();
});

test("provides visible keyboard focus without unsupported collection navigation", async ({
  page,
}) => {
  await page.goto(partOnePath);
  await page.locator(".chronicle-seal").focus();

  const focus = await page.evaluate(() => {
    const active = document.activeElement as HTMLElement;
    const style = getComputedStyle(active);
    return {
      tagName: active.tagName,
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
    };
  });
  expect(focus.tagName).toBe("A");
  expect(focus.outlineStyle).not.toBe("none");
  expect(focus.outlineWidth).toBeGreaterThanOrEqual(2);

  const primaryNavigation = page.getByRole("navigation", {
    name: "Chronicle sections",
  });
  await expect(primaryNavigation.getByRole("link", { name: "Front Page" })).toBeVisible();
  await expect(
    primaryNavigation.getByRole("link", { name: "Part One", exact: true }),
  ).toBeVisible();
  await expect(primaryNavigation.getByRole("link", { name: "People" })).toHaveCount(0);
  await expect(primaryNavigation.getByRole("link", { name: "Places" })).toHaveCount(0);
  await expect(primaryNavigation.getByRole("link", { name: "Timeline" })).toHaveCount(0);
  await expect(primaryNavigation.getByRole("link", { name: "Archive" })).toHaveCount(0);
});

test("matches the reviewed Part 1 responsive baseline", async ({ page }) => {
  await page.goto(partOnePath);
  await expect(page.locator(".chapter-card")).toHaveCount(8);
  await expect(page).toHaveScreenshot("part-one-reader.png", {
    fullPage: true,
    timeout: 15_000,
  });
});
