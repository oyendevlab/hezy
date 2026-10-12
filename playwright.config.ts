import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
/** Tetapkan E2E_BASE_URL (cth. https://hezy.vercel.app) untuk menguji deployment sedia ada. */
const REMOTE = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: REMOTE ?? `http://localhost:${PORT}`,
    locale: "ms-MY",
    timezoneId: "Asia/Kuala_Lumpur",
    // SW disekat secara lalai supaya page.route boleh meniru /api/aqi; ujian luar talian membenarkannya.
    serviceWorkers: "block",
    trace: "on-first-retry",
  },
  projects: [
    { name: "telefon", use: { ...devices["Pixel 7"] } },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: REMOTE
    ? undefined
    : {
        command: `npm run build && npx next start -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 240_000,
        // Token palsu: permintaan WAQI ditiru dalam e2e/fixtures.ts.
        env: { NEXT_PUBLIC_WAQI_TOKEN: "e2e" },
      },
});
