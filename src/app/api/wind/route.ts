import { getWindGrid } from "@/lib/data";

/** GET /api/wind — grid angin 850 hPa (u/v, km/j) untuk lapisan aliran angin di peta. */
export async function GET() {
  try {
    const grid = await getWindGrid();
    return Response.json(
      { source: "Open-Meteo (850 hPa)", ...grid },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=7200",
        },
      },
    );
  } catch (error) {
    console.error("[api/wind]", error);
    return Response.json(
      { error: "Data angin tidak dapat diambil buat masa ini." },
      { status: 502 },
    );
  }
}
