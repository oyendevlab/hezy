import { test as base, type Page } from "@playwright/test";

const PREFS_KEY = "hezy:prefs:v1";

/** Respons /api/aqi rekaan: Tidak Sihat (156), masa terbaik 9–11 malam. */
export function fakeReading(official: Record<string, unknown> | null = null) {
  const hourly = [
    70, 68, 66, 64, 62, 60, 62, 70, 90, 120, 156, 160, 165, 170, 172, 168, 160,
    150, 130, 110, 90, 70, 75, 80,
  ];
  return {
    source: "open-meteo",
    estimate: true,
    generatedAt: "2026-10-11T02:30:00.000Z",
    current: {
      time: "2026-10-11T10:00",
      ipu: 156,
      category: "tidak-sihat",
      label: "Tidak Sihat",
      emergency: false,
      pm25Average: 72.4,
    },
    change3h: 12,
    today: hourly.map((h, i) => ({
      time: `2026-10-11T${String(i).padStart(2, "0")}:00`,
      ipu: 150,
      hourlyIpu: h,
      forecast: i > 10,
    })),
    bestWindow: {
      start: "2026-10-11T20:00",
      end: "2026-10-11T22:00",
      averageIpu: 78,
    },
    stale: false,
    official,
  };
}

export const SHAH_ALAM = {
  id: "area:shah-alam",
  name: "Shah Alam",
  detail: "Selangor",
  lat: 3.07,
  lon: 101.52,
  source: "area",
};

/** Tetapkan lokasi semasa sekali sahaja (tidak ditulis semula selepas navigasi). */
export async function seedLocation(page: Page) {
  await page.addInitScript(
    ([key, location]) => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(
          key,
          JSON.stringify({
            current: location,
            favourites: [],
            profile: "umum",
            theme: "system",
          }),
        );
      }
    },
    [PREFS_KEY, SHAH_ALAM] as const,
  );
}

export const test = base.extend<{ mockApi: void }>({
  mockApi: [
    async ({ page }, use) => {
      await page.route("**/api/aqi?**", (route) =>
        route.fulfill({ json: fakeReading() }),
      );
      await use();
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";

/** Bacaan rasmi APIMS rekaan untuk stesen Shah Alam. */
export const OFFICIAL_SHAH_ALAM = {
  stationId: "CA20B",
  stationName: "Shah Alam",
  distanceKm: 5.6,
  ipu: 172,
  category: "tidak-sihat",
  label: "Tidak Sihat",
  emergency: false,
  pollutant: "PM2.5",
  time: "2026-10-11T10:00",
};
