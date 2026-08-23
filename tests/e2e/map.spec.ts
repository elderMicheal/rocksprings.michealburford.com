import { expect, test } from "@playwright/test";

const canonicalRevision = "3fd095b8f3e36215deef39e7de899c278a147e94";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".map-panel")).toHaveAttribute(
    "data-writing-revision",
    canonicalRevision,
  );
});

test("renders current manuscript-evidence relationships from the shared plan", async ({ page }) => {
  const map = page.locator(".town-map");
  const marker = (label: string) => map.locator(".map-marker").filter({ hasText: label });

  const abby = await marker("Abby's").boundingBox();
  const newBeginnings = await marker("New Beginnings").boundingBox();
  const staging = await marker("Old school lot").boundingBox();
  const river = await map.locator(".map-river").boundingBox();

  expect(abby).not.toBeNull();
  expect(newBeginnings).not.toBeNull();
  expect(staging).not.toBeNull();
  expect(river).not.toBeNull();
  if (!abby || !newBeginnings || !staging || !river) return;

  expect(newBeginnings.x).toBeLessThan(abby.x);
  expect(newBeginnings.y).toBeLessThan(abby.y);
  expect(staging.y).toBeGreaterThan(newBeginnings.y);
  expect(staging.y).toBeLessThan(abby.y);
  expect(river.y).toBeGreaterThan(abby.y);

  await expect(map.locator(".map-road-partridge-street")).toHaveCount(1);
  await expect(map.locator(".map-road-oak-street")).toHaveCount(1);
  await expect(map.locator(".map-road-amity-street")).toHaveCount(1);
  await expect(map.locator(".map-route-monte_perimeter")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Open 3D map" })).toHaveAttribute("href", "/map");
});

test("keeps every reviewed evidence marker inside the local map", async ({ page }, testInfo) => {
  const map = page.locator(".town-map");
  const mapBox = await map.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) return;

  const markers = map.locator(".map-marker");
  await expect(markers).toHaveCount(11);
  for (let index = 0; index < 11; index += 1) {
    const box = await markers.nth(index).boundingBox();
    expect(box, `marker ${index + 1} is missing`).not.toBeNull();
    if (!box) continue;
    expect(box.x).toBeGreaterThanOrEqual(mapBox.x - 1);
    expect(box.y).toBeGreaterThanOrEqual(mapBox.y - 1);
    expect(box.x + box.width).toBeLessThanOrEqual(mapBox.x + mapBox.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(mapBox.y + mapBox.height + 1);
  }

  if (process.env.RSC_CAPTURE_MAP === "1") {
    await map.screenshot({ animations: "disabled", path: testInfo.outputPath("canonical-town-map.png") });
  }
});
