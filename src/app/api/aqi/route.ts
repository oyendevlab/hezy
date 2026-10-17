import { after } from "next/server";
import { summarizeAccuracy } from "@/lib/accuracy";
import { nearestStation } from "@/lib/apims";
import { stationsDue } from "@/lib/apims-schedule";
import { handled, withinBudget } from "@/lib/budget";
import { parseCoords } from "@/lib/coords";
import {
  getAccuracyIndex,
  getHotspots,
  getMetBundle,
  getStationsResilient,
  getWeather,
} from "@/lib/data";
import { findState } from "@/lib/areas";
import { metFor, metTargetFor } from "@/lib/metmalaysia";
import { placeAt } from "@/lib/places";
import { upwindHotspots } from "@/lib/hotspots";
import { currentWeather } from "@/lib/weather";
import { CALM_KMH, windAt } from "@/lib/wind";
import { loadReading, modelCell } from "@/lib/load-reading";
import { localHourKey } from "@/lib/reading";

/** Had (ms dari permulaan permintaan) menunggu sumber pilihan: cuaca, titik panas, ketepatan. */
const OPTIONAL_DEADLINE_MS = 2500;
/** Had menunggu sejarah APIMS (graf rasmi dan pembetulan ramalan). */
const HISTORY_BUDGET_MS = 3000;
/** Had menunggu senarai stesen APIMS (termasuk satu cubaan semula). */
const STATIONS_BUDGET_MS = 4000;

const FULL_CACHE = "public, s-maxage=300, stale-while-revalidate=900";
/** Respons tanpa sumber yang lambat dicache sebentar sahaja supaya permintaan seterusnya lengkap. */
const PARTIAL_CACHE = "public, s-maxage=60, stale-while-revalidate=120";
/** Bacaan rasmi jam semasa dijangka terbit: cache CDN lebih pendek (v0.8.5). */
const DUE_CACHE = "public, s-maxage=120, stale-while-revalidate=300";

/**
 * GET /api/aqi?lat=3.07&lon=101.52
 * Anggaran IPU (Open-Meteo), 24 jam hari ini, masa terbaik untuk keluar,
 * dan bacaan rasmi APIMS stesen terdekat jika ada.
 *
 * Semua sumber dimulakan serentak (v0.8.2). Hanya model dan senarai stesen menentukan nombor
 * IPU; sumber pilihan yang lambat ditinggalkan daripada respons dan dibiar siap selepasnya
 * supaya cache instans terisi.
 */
export async function GET(request: Request) {
  const started = Date.now();
  const coords = parseCoords(new URL(request.url).searchParams);
  if (!coords.ok) {
    return Response.json({ error: coords.error }, { status: 400 });
  }

  const late: Promise<unknown>[] = [];
  // Senarai stesen APIMS (bacaan rasmi, bias stesen, negeri MetMalaysia) ditunggu ≤ 4 s. Bila
  // gagal atau lambat, respons ditanda separa supaya tidak dicache lama sebagai lengkap (v0.8.10).
  let stationsMissing = false;
  const stationsPending = handled(getStationsResilient());
  const stationsPromise = withinBudget(
    stationsPending,
    STATIONS_BUDGET_MS,
  ).then((result) => {
    if (result.status === "ok") return result.value;
    stationsMissing = true;
    if (result.status === "late") late.push(stationsPending);
    else console.error("[api/aqi] APIMS", result.error);
    return null;
  });
  // Cuaca juga ikut sel 0.1° (grid Open-Meteo) supaya cache dikongsi koordinat berdekatan.
  const cell = modelCell(coords);
  const weatherPromise = handled(getWeather(cell.lat, cell.lon));
  const accuracyPromise = handled(getAccuracyIndex());
  const hotspotsPromise = handled(getHotspots());
  const metPromise = handled(
    getMetBundle(localHourKey(new Date()).slice(0, 10)),
  );

  const now = new Date();
  const nowKey = localHourKey(now);
  let loaded;
  try {
    loaded = await loadReading(coords, now, stationsPromise, {
      historyBudgetMs: HISTORY_BUDGET_MS,
    });
  } catch (error) {
    console.error("[api/aqi] Open-Meteo", error);
    return Response.json(
      { error: "Data kualiti udara tidak dapat diambil. Cuba lagi sebentar." },
      { status: 502 },
    );
  }
  const { reading, station } = loaded;
  const stations = await stationsPromise;
  let partial = loaded.partial || stationsMissing;
  /** Nilai sumber pilihan, atau `undefined` bila gagal atau melepasi had masa. */
  const optional = async <T>(
    name: string,
    promise: Promise<T>,
  ): Promise<T | undefined> => {
    const result = await withinBudget(
      promise,
      started + OPTIONAL_DEADLINE_MS - Date.now(),
    );
    if (result.status === "ok") return result.value;
    if (result.status === "late") {
      partial = true;
      late.push(promise);
    } else {
      console.error(`[api/aqi] ${name}`, result.error);
    }
    return undefined;
  };

  const weather = await optional("cuaca", weatherPromise);
  reading.wind = weather ? windAt(weather, coords, nowKey) : null;
  if (weather) {
    reading.weather = currentWeather(weather, nowKey);
    reading.weatherDays = weather.days.filter(
      (d) => d.date >= nowKey.slice(0, 10),
    );
    // Ramalan per jam: cuaca dan angin permukaan bagi setiap jam akan datang.
    reading.hourly = reading.hourly?.map((h) => {
      const i = weather.times.indexOf(h.time);
      if (i < 0) return h;
      const temp = weather.temperature[i];
      const speed = weather.windSpeed10[i];
      return {
        ...h,
        temperature: temp === null ? null : Math.round(temp),
        code: weather.code[i],
        isDay: weather.isDay[i] === 1,
        windSpeed: speed === null ? null : Math.round(speed),
        windDir: weather.windDir10[i],
      };
    });
  }
  // Negeri dan daerah ikut sempadan sebenar (v0.8.11), bukan stesen terdekat.
  const place = placeAt(coords);
  reading.state = place?.state ?? null;
  if (reading.wind && reading.wind.speed >= CALM_KMH) {
    const hotspots = await optional("titik panas", hotspotsPromise);
    if (hotspots) {
      reading.wind.hotspots = upwindHotspots(
        hotspots.cells,
        coords,
        reading.wind.direction,
      );
    }
  }

  // Ketepatan 14 hari: stesen rasmi, atau stesen terdekat dalam 100 km, atau kebangsaan.
  const accuracy = await optional("ketepatan", accuracyPromise);
  if (accuracy !== undefined) {
    const near =
      station ??
      (stations ? nearestStation(stations, coords, 100)?.station : undefined);
    reading.accuracy = summarizeAccuracy(
      accuracy,
      nowKey.slice(0, 10),
      near?.id ?? null,
    );
  }

  // Amaran negeri dan ramalan MetMalaysia: tanah tinggi, daerah, kemudian negeri (v0.8.11).
  const metTarget = place
    ? metTargetFor(coords, place, findState(place.state)?.name ?? place.state)
    : null;
  if (metTarget) {
    const met = await optional("MetMalaysia", metPromise);
    if (met)
      reading.met = metFor(metTarget, met.warnings, met.forecasts, nowKey);
  }

  if (partial) reading.partial = true;
  if (late.length) after(() => Promise.allSettled(late));
  return Response.json(reading, {
    headers: {
      "Cache-Control": partial
        ? PARTIAL_CACHE
        : stations && stationsDue(stations, now)
          ? DUE_CACHE
          : FULL_CACHE,
      "Server-Timing": `app;dur=${Date.now() - started}${partial ? ', partial;desc="separa"' : ""}`,
    },
  });
}
