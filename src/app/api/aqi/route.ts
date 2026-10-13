import { summarizeAccuracy } from "@/lib/accuracy";
import { nearestStation } from "@/lib/apims";
import { parseCoords } from "@/lib/coords";
import {
  getAccuracyIndex,
  getHotspots,
  getStations,
  getWeather,
} from "@/lib/data";
import { upwindHotspots } from "@/lib/hotspots";
import { currentWeather } from "@/lib/weather";
import { CALM_KMH, windAt } from "@/lib/wind";
import { loadReading } from "@/lib/load-reading";
import { stateForPoint } from "@/lib/state-flag";
import { localHourKey } from "@/lib/reading";

/**
 * GET /api/aqi?lat=3.07&lon=101.52
 * Anggaran IPU (Open-Meteo), 24 jam hari ini, masa terbaik untuk keluar,
 * dan bacaan rasmi APIMS stesen terdekat jika ada.
 */
export async function GET(request: Request) {
  const coords = parseCoords(new URL(request.url).searchParams);
  if (!coords.ok) {
    return Response.json({ error: coords.error }, { status: 400 });
  }

  const [stations, wind] = await Promise.allSettled([
    getStations(),
    getWeather(coords.lat, coords.lon),
  ]);
  if (stations.status === "rejected") {
    // APIMS hanya tambahan; anggaran model masih dipulangkan.
    console.error("[api/aqi] APIMS", stations.reason);
  }

  const now = new Date();
  const nowKey = localHourKey(now);
  let loaded;
  try {
    loaded = await loadReading(
      coords,
      now,
      stations.status === "fulfilled" ? stations.value : null,
    );
  } catch (error) {
    console.error("[api/aqi] Open-Meteo", error);
    return Response.json(
      { error: "Data kualiti udara tidak dapat diambil. Cuba lagi sebentar." },
      { status: 502 },
    );
  }
  const { reading, station } = loaded;

  reading.wind =
    wind.status === "fulfilled" ? windAt(wind.value, coords, nowKey) : null;
  if (wind.status === "fulfilled") {
    reading.weather = currentWeather(wind.value, nowKey);
    reading.weatherDays = wind.value.days.filter(
      (d) => d.date > nowKey.slice(0, 10),
    );
  }
  reading.state =
    stations.status === "fulfilled"
      ? stateForPoint(stations.value, coords)
      : null;
  if (wind.status === "rejected") console.error("[api/aqi] cuaca", wind.reason);
  if (reading.wind && reading.wind.speed >= CALM_KMH) {
    try {
      const { cells } = await getHotspots();
      reading.wind.hotspots = upwindHotspots(
        cells,
        coords,
        reading.wind.direction,
      );
    } catch (error) {
      console.error("[api/aqi] titik panas", error);
    }
  }

  // Ketepatan 14 hari: stesen rasmi, atau stesen terdekat dalam 100 km, atau kebangsaan.
  try {
    const near =
      station ??
      (stations.status === "fulfilled"
        ? nearestStation(stations.value, coords, 100)?.station
        : undefined);
    reading.accuracy = summarizeAccuracy(
      await getAccuracyIndex(),
      nowKey.slice(0, 10),
      near?.id ?? null,
    );
  } catch (error) {
    console.error("[api/aqi] ketepatan", error);
  }

  return Response.json(reading, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
    },
  });
}
