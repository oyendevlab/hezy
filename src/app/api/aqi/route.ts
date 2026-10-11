import { parseCoords } from "@/lib/coords";
import { getAirQuality } from "@/lib/data";
import { buildReading } from "@/lib/reading";

/**
 * GET /api/aqi?lat=3.07&lon=101.52
 * Memulangkan anggaran IPU semasa, 24 jam hari ini dan masa terbaik untuk keluar.
 */
export async function GET(request: Request) {
  const coords = parseCoords(new URL(request.url).searchParams);
  if (!coords.ok) {
    return Response.json({ error: coords.error }, { status: 400 });
  }

  try {
    const series = await getAirQuality(coords.lat, coords.lon);
    return Response.json(buildReading(series, new Date()), {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
      },
    });
  } catch (error) {
    console.error("[api/aqi]", error);
    return Response.json(
      { error: "Data kualiti udara tidak dapat diambil. Cuba lagi sebentar." },
      { status: 502 },
    );
  }
}
