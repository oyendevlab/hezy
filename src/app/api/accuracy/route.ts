import { summarizeAccuracy } from "@/lib/accuracy";
import { getAccuracyIndex } from "@/lib/data";
import { localHourKey } from "@/lib/reading";

/** GET /api/accuracy — ringkasan ketepatan kebangsaan 14 hari (Tetapan dan pemantauan). */
export async function GET() {
  let index;
  try {
    index = await getAccuracyIndex();
  } catch (error) {
    console.error("[api/accuracy]", error);
    return Response.json(
      { error: "Data ketepatan tidak dapat diambil." },
      { status: 502 },
    );
  }
  const today = localHourKey(new Date()).slice(0, 10);
  return Response.json(
    { ...summarizeAccuracy(index, today), updatedAt: index?.updatedAt ?? null },
    {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=7200",
      },
    },
  );
}
