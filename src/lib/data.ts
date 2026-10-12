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
import { readAccuracy, readIndex } from "./history-store";
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
    headers: { "User-Agent": "Hezy/0.1 (+https://hezy.vercel.app)" },
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
    headers: { "User-Agent": "Hezy/0.3 (+https://hezy.vercel.app)" },
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
    headers: { "User-Agent": "Hezy/0.4 (+https://hezy.vercel.app)" },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`APIMS (sejarah) memulangkan status ${res.status}`);
  }
  return parseHourly(await res.json());
}

/** Indeks ketepatan (Vercel Blob), dicache 1 jam; dikemas kini sekali sehari. */
export async function getAccuracyIndex(): Promise<AccuracyIndex | null> {
  "use cache";
  cacheLife({ stale: 1800, revalidate: 3600, expire: 14400 });
  return readAccuracy();
}
