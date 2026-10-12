import { getHotspots } from "@/lib/data";
import { FIRMS_DAYS } from "@/lib/hotspots";

/** GET /api/hotspots — sel titik panas NASA FIRMS (2 hari) untuk lapisan peta. */
export async function GET() {
  try {
    const { updatedAt, cells } = await getHotspots();
    return Response.json(
      { source: "NASA FIRMS (VIIRS)", days: FIRMS_DAYS, updatedAt, cells },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=7200",
        },
      },
    );
  } catch (error) {
    console.error("[api/hotspots]", error);
    return Response.json(
      { error: "Data titik panas tidak dapat diambil buat masa ini." },
      { status: 502 },
    );
  }
}
