import { defineConfig } from "@playwright/test";

const existingServerUrl = process.env.PLAYWRIGHT_BASE_URL;
const devServerUrl = existingServerUrl ?? "http://127.0.0.1:5174";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "line",
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL: devServerUrl,
    colorScheme: "light",
    locale: "en-US",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: existingServerUrl
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1 --port 5174 --strictPort",
        url: devServerUrl,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [
    {
      name: "mobile",
      use: { viewport: { width: 412, height: 915 } },
    },
    {
      name: "tablet",
      use: { viewport: { width: 1024, height: 1366 } },
    },
    {
      name: "desktop",
      use: { viewport: { width: 1440, height: 1000 } },
    },
  ],
});
