import { expect, test } from "@playwright/test";

const canonicalRevision = "3fd095b8f3e36215deef39e7de899c278a147e94";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".map-panel")).toHaveAttribute(
    "data-writing-revision",
    canonicalRevision,
  );
});

test("renders the manuscript-evidence relationships from the shared plan", async ({
  page,
}) => {
  const map = page.locator(".town-map");
  const marker = (label: string) =>
    map.locator(".map-marker").filter({ hasText: label });

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
});

test("shows the confirmed north-south Main Street and links to the shared 3D map", async ({
  page,
}) => {
  const mainStreet = page.locator(".map-road-main-street");
  const broadStreet = page.locator(".map-road-broad-street");
  const mainBox = await mainStreet.boundingBox();
  const broadBox = await broadStreet.boundingBox();

  expect(mainBox).not.toBeNull();
  expect(broadBox).not.toBeNull();
  if (mainBox && broadBox) {
    expect(mainBox.height).toBeGreaterThan(mainBox.width * 4);
    expect(broadBox.width).toBeGreaterThan(broadBox.height * 4);
  }

  const mapLink = page.getByRole("link", { name: "Open 3D map" });
  await expect(mapLink).toHaveAttribute("href", "/map");
  await mapLink.click();
  await expect(page).toHaveURL(/\/map$/);
  await expect(page.getByRole("heading", { name: "Rock Springs", level: 1 })).toBeVisible();
});

test("keeps every evidence marker inside the map", async ({ page }, testInfo) => {
  const map = page.locator(".town-map");
  const mapBox = await map.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) return;

  const markers = map.locator(".map-marker");
  await expect(markers).toHaveCount(16);
  for (let index = 0; index < 16; index += 1) {
    const box = await markers.nth(index).boundingBox();
    expect(box, `marker ${index + 1} is missing`).not.toBeNull();
    if (!box) continue;
    expect(box.x).toBeGreaterThanOrEqual(mapBox.x - 1);
    expect(box.y).toBeGreaterThanOrEqual(mapBox.y - 1);
    expect(box.x + box.width).toBeLessThanOrEqual(mapBox.x + mapBox.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(mapBox.y + mapBox.height + 1);
  }

  if (process.env.RSC_CAPTURE_MAP === "1") {
    await map.screenshot({
      animations: "disabled",
      path: testInfo.outputPath("canonical-town-map.png"),
    });
  }
});
