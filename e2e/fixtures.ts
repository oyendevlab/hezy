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
    days: [
      { date: "2026-10-12", averageIpu: 120, maxIpu: 150 },
      { date: "2026-10-13", averageIpu: 95, maxIpu: 110 },
      { date: "2026-10-14", averageIpu: 60, maxIpu: 75 },
    ],
  };
}

/** Stesen APIMS rekaan untuk peta. */
export const FAKE_STATIONS = [
  {
    id: "CA20B",
    name: "Shah Alam",
    state: "Selangor",
    lat: 3.104,
    lon: 101.556,
    ipu: 72,
    pollutant: "PM2.5",
    time: "2026-10-11T10:00",
  },
  {
    id: "CA21B",
    name: "Klang",
    state: "Selangor",
    lat: 3.01,
    lon: 101.408,
    ipu: 146,
    pollutant: "PM2.5",
    time: "2026-10-11T10:00",
  },
  {
    id: "CA13A",
    name: "Seri Manjung",
    state: "Perak",
    lat: 4.2,
    lon: 100.66,
    ipu: null,
    pollutant: null,
    time: null,
  },
];

export const SHAH_ALAM = {
  id: "area:shah-alam",
  name: "Shah Alam",
  detail: "Selangor",
  lat: 3.07,
  lon: 101.52,
  source: "area",
};

/** Kegemaran rekaan untuk ujian perbandingan. */
export const KLANG = {
  id: "area:klang",
  name: "Klang",
  detail: "Selangor",
  lat: 3.04,
  lon: 101.45,
  source: "area",
};

/** Tetapkan lokasi semasa (dan kegemaran) sekali sahaja; tidak ditulis semula selepas navigasi. */
export async function seedLocation(
  page: Page,
  favourites: (typeof KLANG)[] = [],
) {
  await page.addInitScript(
    ([key, location, favs]) => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(
          key,
          JSON.stringify({
            current: location,
            favourites: favs,
            profile: "umum",
            theme: "system",
          }),
        );
      }
    },
    [PREFS_KEY, SHAH_ALAM, favourites] as const,
  );
}

/** Respons WAQI `map/bounds`: satu sensor komuniti + satu pendua stesen APIMS Klang. */
export const FAKE_WAQI = () => {
  const time = new Date(Date.now() - 30 * 60_000).toISOString();
  return {
    status: "ok",
    data: [
      {
        lat: 3.08,
        lon: 101.6,
        uid: -2871205,
        aqi: "88",
        station: { name: "Jalan Anggun 3P", time },
      },
      {
        lat: 3.01,
        lon: 101.408,
        uid: 2619,
        aqi: "120",
        station: { name: "Klang, Selangor, Malaysia", time },
      },
    ],
  };
};

export const test = base.extend<{ mockApi: void }>({
  mockApi: [
    async ({ page }, use) => {
      await page.route("**/api/aqi?**", (route) =>
        route.fulfill({ json: fakeReading() }),
      );
      await page.route("**/api/stations", (route) =>
        route.fulfill({ json: { source: "apims", stations: FAKE_STATIONS } }),
      );
      await page.route("https://api.waqi.info/**", (route) =>
        route.fulfill({ json: FAKE_WAQI() }),
      );
      // Jubin peta luaran tidak diperlukan dalam ujian.
      await page.route("https://tile.openstreetmap.org/**", (route) =>
        route.abort(),
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
