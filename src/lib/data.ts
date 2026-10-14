import { cacheLife } from "next/cache";
import {
  APIMS_STATIONS_URL,
  apimsHourlyUrl,
  parseHourly,
  parseStations,
  type HourlyOfficial,
  type Station,
} from "./apims";
import type { DailyIndex } from "./history";
import type { AccuracyIndex } from "./accuracy";
import {
  FIRMS_SOURCES,
  aggregate,
  firmsUrl,
  parseFirmsCsv,
  type HotspotCell,
} from "./hotspots";
import { parseWeather, weatherUrl, type WeatherSeries } from "./weather";
import { parseWindGrid, windGridUrl, type WindGrid } from "./wind-grid";
import { readAccuracy, readHourlyDay, readIndex } from "./history-store";
import { SCHOOL_DECISION_HOUR } from "./school";
import {
  airQualityUrl,
  parseAirQuality,
  type AirQualitySeries,
} from "./openmeteo";

/** Ambil siri PM2.5 untuk koordinat, dicache 15 minit di pelayan. */
export async function getAirQuality(
  lat: number,
  lon: number,
): Promise<AirQualitySeries> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });

  const res = await fetch(airQualityUrl(lat, lon));
  if (!res.ok) {
    throw new Error(`Open-Meteo memulangkan status ${res.status}`);
  }
  return parseAirQuality(await res.json());
}

/** Senarai stesen APIMS dengan bacaan terkini, dicache 15 minit (satu permintaan ke JAS bagi semua pengguna). */
export async function getStations(): Promise<Station[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });

  const res = await fetch(APIMS_STATIONS_URL, {
    headers: { "User-Agent": "Hezy (+https://hezy.my)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`APIMS memulangkan status ${res.status}`);
  }
  return parseStations(await res.json());
}

/** Sejarah IPU rasmi 25 jam bagi semua stesen dalam negeri, dicache 15 minit. */
export async function getStateHistory(
  stateId: number,
  hourKey: string,
): Promise<Record<string, HourlyOfficial[]>> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });

  const res = await fetch(apimsHourlyUrl(stateId, hourKey), {
    headers: { "User-Agent": "Hezy (+https://hezy.my)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`APIMS (sejarah) memulangkan status ${res.status}`);
  }
  // Objek biasa (bukan Map) supaya boleh disimpan dalam cache.
  return Object.fromEntries(parseHourly(await res.json()));
}

/** Indeks sejarah harian (Vercel Blob), dicache 30 minit; dikemas kini oleh /api/history/collect. */
export async function getDailyIndex(): Promise<DailyIndex | null> {
  "use cache";
  cacheLife({ stale: 600, revalidate: 1800, expire: 7200 });
  return readIndex();
}

/** Sejarah 25 jam terus dari APIMS tanpa cache (untuk pengumpul sejarah). */
export async function fetchStateHourly(
  stateId: number,
  hourKey: string,
): Promise<Map<string, HourlyOfficial[]>> {
  const res = await fetch(apimsHourlyUrl(stateId, hourKey), {
    headers: { "User-Agent": "Hezy (+https://hezy.my)" },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`APIMS (sejarah) memulangkan status ${res.status}`);
  }
  return parseHourly(await res.json());
}

/**
 * Bacaan IPU jam 2 petang semua stesen bagi satu tarikh lepas (Blob sejarah), untuk
 * jangkaan penutupan sekolah. Dicache 6 jam.
 */
export async function getTwoPmReadings(
  date: string,
): Promise<Record<string, number | null>> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 21600, expire: 86400 });
  const day = await readHourlyDay(date);
  return Object.fromEntries(
    Object.entries(day?.stations ?? {}).map(([id, hours]) => [
      id,
      hours[SCHOOL_DECISION_HOUR] ?? null,
    ]),
  );
}

/** Indeks ketepatan (Vercel Blob), dicache 1 jam; dikemas kini sekali sehari. */
export async function getAccuracyIndex(): Promise<AccuracyIndex | null> {
  "use cache";
  cacheLife({ stale: 1800, revalidate: 3600, expire: 14400 });
  return readAccuracy();
}

/** Cuaca dan angin 850 hPa untuk koordinat (dibundarkan 0.1° supaya cache dikongsi), dicache 30 minit. */
export async function getWeather(
  lat: number,
  lon: number,
): Promise<WeatherSeries> {
  "use cache";
  cacheLife({ stale: 600, revalidate: 1800, expire: 7200 });
  const res = await fetch(
    weatherUrl(Math.round(lat * 10) / 10, Math.round(lon * 10) / 10),
    { signal: AbortSignal.timeout(8000) },
  );
  if (!res.ok)
    throw new Error(`Open-Meteo (cuaca) memulangkan status ${res.status}`);
  return parseWeather(await res.json());
}

/** Grid angin 850 hPa (168 titik, satu permintaan) untuk lapisan aliran angin, dicache 1 jam. */
export async function getWindGrid(): Promise<WindGrid> {
  "use cache";
  cacheLife({ stale: 1800, revalidate: 3600, expire: 10800 });
  const res = await fetch(windGridUrl(), {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok)
    throw new Error(`Open-Meteo (grid angin) memulangkan status ${res.status}`);
  return parseWindGrid(await res.json());
}

/** Titik panas FIRMS (2 hari, VIIRS SNPP + NOAA-20) digabung ikut sel ~5 km, dicache 1 jam. */
export async function getHotspots(): Promise<{
  updatedAt: string;
  cells: HotspotCell[];
}> {
  "use cache";
  cacheLife({ stale: 1800, revalidate: 3600, expire: 10800 });
  const key = process.env.FIRMS_MAP_KEY;
  if (!key) throw new Error("FIRMS_MAP_KEY belum ditetapkan.");
  const points = [];
  for (const source of FIRMS_SOURCES) {
    const res = await fetch(firmsUrl(key, source), {
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`FIRMS memulangkan status ${res.status}`);
    const text = await res.text();
    // FIRMS memulangkan teks ralat (bukan CSV) bila kunci tidak sah atau had dicapai.
    if (!text.startsWith("latitude")) {
      throw new Error(`Respons FIRMS tidak dijangka: ${text.slice(0, 80)}`);
    }
    points.push(...parseFirmsCsv(text));
  }
  return { updatedAt: new Date().toISOString(), cells: aggregate(points) };
}
