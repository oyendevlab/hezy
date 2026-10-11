import { parseCoords } from "@/lib/coords";
import { getAirQuality, getStations } from "@/lib/data";
import { officialFor } from "@/lib/official";
import { buildReading, localHourKey } from "@/lib/reading";

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

  const [series, stations] = await Promise.allSettled([
    getAirQuality(coords.lat, coords.lon),
    getStations(),
  ]);

  if (series.status === "rejected") {
    console.error("[api/aqi] Open-Meteo", series.reason);
    return Response.json(
      { error: "Data kualiti udara tidak dapat diambil. Cuba lagi sebentar." },
      { status: 502 },
    );
  }
  if (stations.status === "rejected") {
    // APIMS hanya tambahan; anggaran model masih dipulangkan.
    console.error("[api/aqi] APIMS", stations.reason);
  }

  const now = new Date();
  const reading = buildReading(series.value, now);
  reading.official =
    stations.status === "fulfilled"
      ? officialFor(stations.value, coords, localHourKey(now))
      : null;

  return Response.json(reading, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
    },
  });
}
