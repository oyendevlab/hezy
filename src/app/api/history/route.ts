import { getDailyIndex } from "@/lib/data";
import { HISTORY_FETCH_DAYS, firstDate, stationHistory } from "@/lib/history";
import { localHourKey } from "@/lib/reading";

/** GET /api/history?station=CA17W — ringkasan IPU harian stesen APIMS untuk heatmap. */
export async function GET(request: Request) {
  const station = new URL(request.url).searchParams.get("station") ?? "";
  if (!/^[A-Z0-9]{3,12}$/.test(station)) {
    return Response.json({ error: "Stesen tidak sah." }, { status: 400 });
  }
  let index;
  try {
    index = await getDailyIndex();
  } catch (error) {
    console.error("[api/history]", error);
    return Response.json(
      { error: "Sejarah tidak dapat diambil buat masa ini." },
      { status: 502 },
    );
  }
  const today = localHourKey(new Date()).slice(0, 10);
  return Response.json(
    {
      station,
      today,
      first: firstDate(index, station),
      days: stationHistory(index, station, today, HISTORY_FETCH_DAYS),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
      },
    },
  );
}
