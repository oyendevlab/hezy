import { stationsDue } from "@/lib/apims-schedule";
import { getStations } from "@/lib/data";

/** GET /api/stations — semua stesen APIMS dengan bacaan IPU terkini (untuk peta). */
export async function GET() {
  try {
    const stations = await getStations();
    return Response.json(
      { source: "apims", stations },
      {
        headers: {
          // Bacaan jam semasa dijangka terbit: cache CDN pendek (v0.8.5).
          "Cache-Control": stationsDue(stations, new Date())
            ? "public, s-maxage=60, stale-while-revalidate=120"
            : "public, s-maxage=300, stale-while-revalidate=900",
        },
      },
    );
  } catch (error) {
    console.error("[api/stations]", error);
    return Response.json(
      { error: "Data stesen APIMS tidak dapat diambil." },
      { status: 502 },
    );
  }
}
