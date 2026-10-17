import { cacheLife } from "next/cache";
import { stationsRevalidateSeconds } from "./apims-schedule";
import { createLastGoodStore } from "./budget";
import { fetchWithRetry } from "./http";
import {
  MET_FORECAST_URL,
  MET_WARNING_URL,
  parseForecasts,
  parseMetBundle,
  parseWarnings,
  pickForecasts,
  type MetBundle,
} from "./metmalaysia";
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
  airQualityMultiUrl,
  airQualityUrl,
  parseAirQuality,
  parseAirQualityMulti,
  type AirQualitySeries,
} from "./openmeteo";

/**
 * Siri PM2.5 untuk koordinat. Model CAMS dikemas kini dua kali sehari, jadi entri disegarkan
 * setiap jam dan nilai lama dikekalkan hingga 6 jam (dipaparkan sementara sumber disegarkan).
 */
export async function getAirQuality(
  lat: number,
  lon: number,
): Promise<AirQualitySeries> {
  "use cache";
  cacheLife({ stale: 600, revalidate: 3600, expire: 21600 });

  const res = await fetch(airQualityUrl(lat, lon), {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`Open-Meteo memulangkan status ${res.status}`);
  }
  return parseAirQuality(await res.json());
}

/**
 * Siri model terakhir yang berjaya bagi setiap sel (setiap instans). Siri merangkumi 2 hari
 * lepas + 5 hari ramalan, jadi salinan sehari masih sah untuk jam semasa.
 */
const lastGoodAirQuality = createLastGoodStore<AirQualitySeries>(
  500,
  24 * 3600_000,
);

/**
 * {@link getAirQuality} dengan sandaran: bila Open-Meteo gagal, guna siri terakhir yang
 * berjaya bagi sel yang sama (≤ 24 jam) supaya pengguna tidak melihat ralat.
 */
export async function getAirQualityResilient(
  lat: number,
  lon: number,
): Promise<AirQualitySeries> {
  const key = `${lat},${lon}`;
  try {
    const series = await getAirQuality(lat, lon);
    lastGoodAirQuality.remember(key, series);
    return series;
  } catch (error) {
    const saved = lastGoodAirQuality.recall(key);
    if (!saved) throw error;
    console.error("[data] Open-Meteo gagal; guna siri terakhir", error);
    return saved;
  }
}

/** Titik per permintaan berbilang lokasi Open-Meteo. */
const MULTI_CHUNK = 25;

/**
 * Siri model di lokasi stesen APIMS untuk pembetulan bias ruang (v0.8.5). Koordinat dihantar
 * sebagai argumen (bukan dibaca daripada getStations) supaya tempoh cache model 1 jam tidak
 * dipendekkan oleh cache stesen. Permintaan berbilang lokasi dibuat serentak.
 */
export async function getStationModels(
  points: readonly { id: string; lat: number; lon: number }[],
): Promise<Record<string, AirQualitySeries>> {
  "use cache";
  cacheLife({ stale: 600, revalidate: 3600, expire: 21600 });
  const chunks: (typeof points)[] = [];
  for (let i = 0; i < points.length; i += MULTI_CHUNK)
    chunks.push(points.slice(i, i + MULTI_CHUNK));
  const lists = await Promise.all(
    chunks.map(async (chunk) => {
      const res = await fetch(airQualityMultiUrl(chunk, 2, 1), {
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok)
        throw new Error(`Open-Meteo (stesen) memulangkan status ${res.status}`);
      const series = parseAirQualityMulti(await res.json());
      return chunk.map((p, i) => [p.id, series[i]] as const);
    }),
  );
  return Object.fromEntries(lists.flat());
}

/**
 * Senarai stesen APIMS dengan bacaan terkini (satu permintaan ke JAS bagi semua pengguna).
 * Tempoh cache ikut jadual terbitan APIMS (v0.8.5): 2 minit bila bacaan jam semasa dijangka,
 * jika tidak hingga beberapa minit selepas jam berikutnya.
 */
export async function getStations(): Promise<Station[]> {
  "use cache";
  // Cuba semula sekali bila APIMS memulangkan 5xx atau tamat masa (v0.8.10).
  const res = await fetchWithRetry(APIMS_STATIONS_URL, {
    headers: { "User-Agent": "Hezy (+https://hezy.my)" },
    timeoutMs: 6000,
  });
  if (!res.ok) {
    throw new Error(`APIMS memulangkan status ${res.status}`);
  }
  const stations = parseStations(await res.json());
  cacheLife({
    stale: 60,
    revalidate: stationsRevalidateSeconds(stations, new Date()),
    expire: 3600,
  });
  return stations;
}

/** Senarai stesen terakhir yang berjaya (setiap instans), untuk gangguan APIMS (v0.8.10). */
const lastGoodStations = createLastGoodStore<Station[]>(1, 2 * 3600_000);

/**
 * {@link getStations} dengan sandaran: bila APIMS gagal (cth. 502), guna senarai terakhir yang
 * berjaya (≤ 2 jam). Bacaan lebih lama daripada 3 jam tetap ditolak oleh `officialFor`.
 */
export async function getStationsResilient(): Promise<Station[]> {
  try {
    const stations = await getStations();
    lastGoodStations.remember("all", stations);
    return stations;
  } catch (error) {
    const saved = lastGoodStations.recall("all");
    if (!saved) throw error;
    console.error("[data] APIMS gagal; guna senarai stesen terakhir", error);
    return saved;
  }
}

/** Sejarah IPU rasmi 25 jam bagi semua stesen dalam negeri, dicache 15 minit. */
export async function getStateHistory(
  stateId: number,
  hourKey: string,
): Promise<Record<string, HourlyOfficial[]>> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });

  const res = await fetchWithRetry(apimsHourlyUrl(stateId, hourKey), {
    headers: { "User-Agent": "Hezy (+https://hezy.my)" },
    timeoutMs: 6000,
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
  // /api/aqi tidak menunggu lebih 2.5 s; had panjang ini supaya fetch lambat masih sempat
  // mengisi cache di latar belakang (v0.8.2).
  const res = await fetch(
    weatherUrl(Math.round(lat * 10) / 10, Math.round(lon * 10) / 10),
    { signal: AbortSignal.timeout(15_000) },
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
  // Kedua-dua satelit diminta serentak (v0.8.2).
  const lists = await Promise.all(
    FIRMS_SOURCES.map(async (source) => {
      const res = await fetch(firmsUrl(key, source), {
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) throw new Error(`FIRMS memulangkan status ${res.status}`);
      const text = await res.text();
      // FIRMS memulangkan teks ralat (bukan CSV) bila kunci tidak sah atau had dicapai.
      if (!text.startsWith("latitude")) {
        throw new Error(`Respons FIRMS tidak dijangka: ${text.slice(0, 80)}`);
      }
      return parseFirmsCsv(text);
    }),
  );
  return {
    updatedAt: new Date().toISOString(),
    cells: aggregate(lists.flat()),
  };
}

/** Salinan MetMalaysia terakhir yang berjaya (setiap instans), untuk bila data.gov.my 429. */
const lastGoodMet = createLastGoodStore<MetBundle>(1, 6 * 3600_000);

async function metJson(url: string, label: string, timeoutMs: number) {
  const res = await fetchWithRetry(url, { timeoutMs }, 1500);
  if (!res.ok)
    throw new Error(`MetMalaysia (${label}) memulangkan status ${res.status}`);
  return (await res.json()) as unknown;
}

/**
 * MetMalaysia terus daripada data.gov.my: amaran + semua ramalan (2 permintaan). Had
 * data.gov.my 4 permintaan/minit dikongsi alamat IP Vercel, jadi hanya /api/met (CDN 15 min)
 * dan sandarannya memanggil ini. Bahagian yang gagal diganti salinan terakhir (≤ 6 jam);
 * `stale` bila mana-mana bahagian tidak segar.
 */
export async function fetchMetUpstream(
  today: string,
): Promise<{ bundle: MetBundle; stale: boolean }> {
  const [warnings, forecasts] = await Promise.allSettled([
    metJson(MET_WARNING_URL, "amaran", 8000).then(parseWarnings),
    metJson(MET_FORECAST_URL, "ramalan", 15_000).then((json) =>
      pickForecasts(parseForecasts(json), today),
    ),
  ]);
  for (const part of [warnings, forecasts])
    if (part.status === "rejected")
      console.error("[data] MetMalaysia", part.reason);
  const saved = lastGoodMet.recall("met");
  const w = warnings.status === "fulfilled" ? warnings.value : saved?.warnings;
  const f =
    forecasts.status === "fulfilled" ? forecasts.value : saved?.forecasts;
  if (!w && !f) throw new Error("MetMalaysia tidak tersedia");
  const bundle: MetBundle = {
    warnings: w ?? [],
    forecasts: f ?? {},
    fetchedAt: new Date().toISOString(),
  };
  const fresh =
    warnings.status === "fulfilled" && forecasts.status === "fulfilled";
  if (warnings.status === "fulfilled" || forecasts.status === "fulfilled")
    lastGoodMet.remember("met", bundle);
  return { bundle, stale: !fresh };
}

/** /api/met production (salinan CDN dikongsi semua instans), atau null di luar production. */
function metProxyUrl(): string | null {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return process.env.VERCEL_ENV === "production" && host
    ? `https://${host}/api/met`
    : null;
}

/**
 * MetMalaysia untuk /api/aqi (v0.8.11), dicache 5 min setiap instans. Di production dibaca
 * melalui /api/met supaya semua instans berkongsi satu salinan; sandaran: terus ke data.gov.my.
 */
export async function getMetBundle(today: string): Promise<MetBundle> {
  "use cache";
  cacheLife({ stale: 120, revalidate: 300, expire: 3600 });
  const proxy = metProxyUrl();
  if (proxy) {
    try {
      const res = await fetch(proxy, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error(`/api/met memulangkan status ${res.status}`);
      return parseMetBundle(await res.json());
    } catch (error) {
      console.error("[data] /api/met gagal; terus ke data.gov.my", error);
    }
  }
  return (await fetchMetUpstream(today)).bundle;
}
